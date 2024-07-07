import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { OPTIONS } from "../constants";
import {Request, Response} from "express";
import { ApiError } from "../utils/ApiError";
import { sendEmail } from "../mails/sendCodeEmail";
import { ApiResponse } from "../utils/ApiResponse";
import User, { UserI } from "../models/user.model";
import { asyncHandler } from "../utils/AsyncHandler";
import { deleteFromCloudinary, extractPublicId, uploadOnCloudinary } from "../utils/cloudinary";
// import { sendSMS } from "../email and sms/sendCodeSms";

process.loadEnvFile();

function timeDiff(start: number) : boolean {
    const end = new Date().valueOf();
    const diff : number = ((end - start) / 1000);
    const seconds = Math.round(diff);
    return seconds <= 300;
}

export interface AuthenticatedRequest extends Request {
    user?: UserI;
}

const generateAccessAndRefreshToken = async (userId: string) => {
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        throw new ApiError(404, "User Not found");
      }
  
      const accessToken = user?.generateAccessToken();
      const refreshToken = user?.generateRefreshToken();
      if (!accessToken || !refreshToken) throw new ApiError(500, "failed to generates token");
  
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
  
      return { accessToken, refreshToken };
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {

    const { firstName, lastName, birthdate, number, email, password } = req.body;
    if ([firstName, lastName, birthdate, number, email, password].some((field) => {
        return (field?.trim() === "");
    })) throw new ApiError(400, "All fields are required");

    try {
        const existedUser = await User.findOne({ $or: [{ email }, { number }] });
        if(existedUser) throw new ApiError(409, "User already exist");
    
        const avatarImage = (req.files as { [fieldname: string]: Express.Multer.File[] })?.avatar;
        const avatarLocalPath = avatarImage && avatarImage[0]?.path;
        if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required");
    
        const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
        if(!avatarResponse) throw new ApiError(400, "Avatar file is required!!!.");
    
    
        const user = await User.create({
            firstName,
            lastName,
            email,
            birthdate,
            number,
            password,
            avatar: avatarResponse.url,
        });

        const createdUser = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(user._id),
                }
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    birthdate: 1,
                    number: 1,
                    avatar: 1,
                }
            }
        ]);
    
        return res
          .status(201)
          .json(new ApiResponse(200, createdUser, "User register successfully"));
    
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong while registering user"
        );
    }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {

    const {number, email, password} = req.body;

    if (!number && !email) 
        throw new ApiError(400, "at least give phone number or email");

    if (!password) 
        throw new ApiError(400, "password is required");

    try {
        const user = await User.findOne({ $or: [{ email }, { number }] });
        if(!user) throw new ApiError(404, "User not found");

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) throw new ApiError(401, "Invalid User Credentials");

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, OPTIONS)
            .cookie("refreshToken", refreshToken, OPTIONS)
            .json(
              new ApiResponse(
                200,
                {
                  user: loggedInUser,
                  accessToken,
                  refreshToken, 
                },
                "User Logged In Successfully" )
            );
        

    } catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while login"
        );
    }

});

export const logoutUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) throw new ApiError(400, "User ID not found in request");
  
        const newUser = await User.findByIdAndUpdate(
          userId,
          {
            $unset: {
              refreshToken: 1,
            },
          },
          {
            new: true,
          }
        );

        console.log(newUser);
  
        return res
          .status(200)
          .clearCookie("accessToken", OPTIONS)
          .clearCookie("refreshToken", OPTIONS)
          .json(new ApiResponse(200, {}, "User Logged Out  "));
      } catch (error: any) {
        throw new ApiError(
          500,
          error?.message || "something went wrong while logout"
        );
      }
});

export const refereshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request");

    try {
        const decodedRefreshToken: JwtPayload = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload;
        const user = await User.findById(decodedRefreshToken?._id);

        if (!user) throw new ApiError(401, "Invalid Refresh Token");
        if (incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Refresh Token is used or expried");

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, OPTIONS)
        .cookie("refreshToken", refreshToken, OPTIONS)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken},
                "Access token refreshed"
            )
        )
    } 
    catch (error: any) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export const updateUserDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { firstName, lastName, birthdate, number, email, about, prefrence } = req.body;
    if(!firstName && !lastName && !birthdate && !number && !email && !about && !prefrence) 
        throw new ApiError(400, "Send fields name which are to be updated");

    try {
        const user = await User.findById(req.user?._id);
        if(!user) throw new ApiError(404, "User Not Found");
        
        if(about) user.about = about;
        if(lastName) user.lastName = lastName;
        if(birthdate) user.birthdate = birthdate;
        if(firstName) user.firstName = firstName;
        if(email) user.email = email, user.isEmailVerified = false;
        if(number) user.number = number, user.isNumberVerified = false;

        if(prefrence) {
            for(let i = 0; i < 4; ++i) {
                prefrence[i] += (i * 3);
            } user.prefrence = prefrence;
        }

        await user.save();

        const updatedUser = await User.findById(req.user?._id);
        if(!updatedUser) throw new ApiError(404, "User Not Found");
    
        return res
            .status(200)
            .json(new ApiResponse(201, updatedUser, "Account detailed updated successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while updating account details"
        );
    }
});

export const updateUserAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    try {
        const user = await User.findById(req.user?._id);
        if(!user) throw new ApiError(404, "User Not Found");


        const oldAvaterUrl = user.avatar;
        if (oldAvaterUrl) {
            const publicId = await extractPublicId(oldAvaterUrl);
            await deleteFromCloudinary(publicId);
        }

        const avatarFile = (
            req.files as { [filedname: string]: Express.Multer.File[] }
        )?.avatar;

        const avatarLocalPath = avatarFile && avatarFile[0].path;
        if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing...");

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if(!avatar) throw new ApiError(400, "Avatar file is missing...");

        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url,
                },
            },
            { new: true }
        ).select("-password -refreshToken");
    
        return res
            .status(200)
            .json(new ApiResponse(201, updatedUser, "Avatar Successfully Updated"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while updating avatar"
        );
    }
});

export const getCurrentUser = asyncHandler( async (req: AuthenticatedRequest, res: Response) => {
    try {
        return res
          .status(200)
          .json(new ApiResponse(200, req.user, "current user fetched successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
          500,
          error?.message || "something went wrong while getting current user"
        );
    }
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    if(!userId) throw new ApiError(400, "User ID is required");

    try {
        const user = await User.findById(userId).select("-password -refreshToken");
        if(!user) throw new ApiError(404, "User not found");

        const tYear = new Date().getFullYear(), tMonth = new Date().getMonth(), tDay = new Date().getDate();
        const bYear = parseInt(user.birthdate.slice(6, 10)), bMonth = parseInt(user.birthdate.slice(3, 5)), bDay = parseInt(user.birthdate.slice(0, 2));

        let age = tYear - bYear;
        if(tMonth < bMonth || (tMonth == bMonth && tDay < bDay)) age--;

        const userDetail = await User.aggregate([
            // {
            //     _id: mongoose.
            // },
            {
                $project: {
                    name: { $concat: ["$firstName", " ", "$lastName"] },
                    rating: 1,
                    birthday: 1,
                    about: 1,
                    avatar: 1,
                    noOfRating: 1,
                    emailVerified: 1,
                    numberVerified: 1,
                    prefrence: 1,
                    since: 1,
                }
            }
        ]);

        userDetail[0].birthday = age.toString();

        return res
            .status(200)
            .json(new ApiResponse(200, userDetail, "User fetched successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while getting user"
        );
    }
});

export const getArchiveTrips = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
        const trips = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user?._id),
                  },
            },
            {
                $lookup: {
                  from: "conclusions",
                  localField: "tripsArchive",
                  foreignField: "_id",
                  as: "result",
                  pipeline: [
                    {
                      $project: {
                        date: 1,
                        tripId: 1,
                        conclusion: 1,
                        bookingId: 1,
                        archive: 1,
                      }
                    }
                  ]
                }
            },
            {
                $project: {
                  result: 1,
                }
            },
            {
                $unwind: {
                  path: "$result"
                }
            },
            {
                $project: {
                    conclusionId: "$result._id",
                    conclusionOfTrip: "$result.conclusion",
                    tripId: "$result.tripId",
                    bookingId: "$result.bookingId" ,
                    date: "$result.date",
                    archive: "$result.archive"
                }
            },
            {
                $match: {
                  archive: true
                }
            },
            {
                $sort: {
                  date: 1
                }
            },
            {
                $lookup: {
                  from: "trips",
                  localField: "tripId",
                  foreignField: "_id",
                  as: "allTripsArchive",
                  pipeline: [
                    {
                      $project: {
                        to: 1,
                        from: 1,
                        departureTime: 1,
                        reachingTime: 1,
                      }
                    }
                  ]
                }
            },
            {
                $lookup: {
                  from: "bookings",
                  localField: "bookingId",
                  foreignField: "_id",
                  as: "allBookingArchive",
                  pipeline: [
                    {
                      $project: {
                        to: 1,
                        from: 1,
                        departureTime: 1,
                        reachingTime: 1,
                      }
                    }
                  ]
                }
            },
            {
                $project: {
                  trip: "$allTripsArchive",
                  booking: "$allBookingArchive",
                  conclusionId: 1,
                  conclusionOfTrip: 1,
                  tripId: 1,
                  bookingId: 1,
                  date: 1,
                }
            }
        ]);


        // const trips = await User.aggregate([
        //     {
        //         $match: {
        //             _id: new mongoose.Types.ObjectId(req.user?._id),
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: "conclusions",
        //             let: { tripIds: "$tripsArchive" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: { $in: ["$_id", "$$tripIds"] },
        //                         archive: true,
        //                     },
        //                 },
        //                 {
        //                     $project: {
        //                         date: 1,
        //                         tripId: 1,
        //                         conclusion: 1,
        //                         bookingId: 1,
        //                     },
        //                 },
        //             ],
        //             as: "result",
        //         },
        //     },
        //     {
        //         $unwind: "$result",
        //     },
        //     {
        //         $lookup: {
        //             from: "trips",
        //             let: { tripId: "$result.tripId" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: { $eq: ["$_id", "$$tripId"] },
        //                     },
        //                 },
        //                 {
        //                     $project: {
        //                         to: 1,
        //                         from: 1,
        //                         departureTime: 1,
        //                         reachingTime: 1,
        //                     },
        //                 },
        //             ],
        //             as: "tripDetails",
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: "bookings",
        //             let: { bookingId: "$result.bookingId" },
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: { $eq: ["$_id", "$$bookingId"] },
        //                     },
        //                 },
        //                 {
        //                     $project: {
        //                         to: 1,
        //                         from: 1,
        //                         departureTime: 1,
        //                         reachingTime: 1,
        //                     },
        //                 },
        //             ],
        //             as: "bookingDetails",
        //         },
        //     },
        //     {
        //         $project: {
        //             conclusionId: "$result._id",
        //             conclusionOfTrip: "$result.conclusion",
        //             tripId: "$result.tripId",
        //             bookingId: "$result.bookingId",
        //             date: "$result.date",
        //             trip: { $arrayElemAt: ["$tripDetails", 0] },
        //             booking: { $arrayElemAt: ["$bookingDetails", 0] },
        //         },
        //     },
        //     {
        //         $sort: {
        //             date: 1,
        //         },
        //     },
        // ]);        

        return res
            .status(200)
            .json(
            new ApiResponse(
                200,
                trips,
                "successfully get trips history"
            )
        );
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while getting user watch history"
        );
    }
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.user?._id);
      if (!user) throw new ApiError(404, "User does not exist");

      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
      if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password");

      user.password = newPassword;
      await user.save({ validateBeforeSave: false });

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
    } 
    catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "something went wrong while changing password"
      );
    }
});

export const sendCodeForForgetPassword = asyncHandler(async (req: Request, res: Response) => {
    
    const email = req.body;
    if (!email) throw new ApiError(400, "email not found");

    console.log(email);
    
    try {
        const user = await User.findOne(email);
        if (!user) throw new ApiError(404, "User not found by this email");
    
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("verify-code is: ", verifyCode);
    
        const result = await sendEmail(email.email, user.firstName, verifyCode, "Forget Password");
        if(result.statusCode < 369) 
            throw new ApiError(400, "Error while sending the code for password");
    
        let time = new Date().valueOf();
        user.forgetPasswordTokenExpiry = time;
        user.forgetPasswordToken = verifyCode;
        await user.save({validateBeforeSave: false});
    
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Code for forget password sent successfully"));
    }
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong sending code to email for password"
        );
    }
});

export const verifyCodeForForgetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, verificationCode, password } = req.body;

    if(!email || !verificationCode || !password) 
            throw new ApiError(400, "All fields are required");

    try {

        const user = await User.findOne(email);
        if (!user) throw new ApiError(404, "User does not found with this email.");

        if(user.forgetPasswordToken === verificationCode) 
        {
            if(timeDiff(user.forgetPasswordTokenExpiry)) {
                user.password = password;
                user.forgetPasswordToken = "";
                user.forgetPasswordTokenExpiry = 0;
                await user.save({ validateBeforeSave: true });
            }
            else {
                throw new ApiError(404, "The given time is over for verification code.");
            }
        }
        else {
            throw new ApiError(404, "Verification code is wrong");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Email verified successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while verifying email"
        );
    }
});

export const sendCodeForEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) throw new ApiError(400, "User ID not found in request");
    
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");
    
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const result = await sendEmail(user.email, user.firstName, verifyCode, "Email Verification");
        if(result.statusCode < 369) 
            throw new ApiError(400, "Error while sending the verification code to email");
    
        let time = new Date().valueOf();
        user.verirfyEmailTokenExpiry = time;
        user.verirfyEmailToken = verifyCode;
        await user.save({validateBeforeSave: false});
    

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Email verification code sent successfully"));
    }
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong sending verifying code to email"
        );
    }
});

export const verifyCodeForEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { verificationCode } = req.body;
    if (!verificationCode) throw new ApiError(400, "Verification code is required");

    try {
        const userId = req.user?._id;
        if (!userId) throw new ApiError(400, "User ID not found in request");

        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User does not found");

        if(user.verirfyEmailToken === verificationCode) {

            if(timeDiff(user.verirfyEmailTokenExpiry)) {
                user.isEmailVerified = true;
                user.verirfyEmailToken = "";
                user.verirfyEmailTokenExpiry = 0;
                await user.save({ validateBeforeSave: true });
            }
            else {
                throw new ApiError(404, "The given time is over");
            }
        }
        else {
            throw new ApiError(404, "Verification code is wrong");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Email verified successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while verifying email"
        );
    }
});

export const sendCodeForNumber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) throw new ApiError(400, "User ID not found in request");
    
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");
    
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        // const result = await sendSMS(user.number, user.firstName, verifyCode);
        // if(result.statusCode < 369) 
        //     throw new ApiError(400, "Error while sending the verification code to number");
    
        let time = new Date().valueOf();
        user.verirfyNumberTokenExpiry = time;
        user.verirfyNumberToken = verifyCode;
        await user.save({validateBeforeSave: false});
    

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Number verification code sent successfully"));
    }
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong sending verifying code to number"
        );
    }
});

export const verifyCodeForNumber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { verificationCode } = req.body;
    if (!verificationCode) throw new ApiError(400, "Verification code is required");

    try {
        const userId = req.user?._id;
        if (!userId) throw new ApiError(400, "User ID not found in request");

        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User does not found");

        if(user.verirfyNumberToken === verificationCode) {

            if(timeDiff(user.verirfyNumberTokenExpiry)) {
                user.isNumberVerified = true;
                user.verirfyNumberToken = "";
                user.verirfyNumberTokenExpiry = 0;
                await user.save({ validateBeforeSave: true });
            }
            else {
                throw new ApiError(404, "The given time is over");
            }
        }
        else {
            throw new ApiError(404, "Verification code is wrong");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Phone number is verified successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while verifying phone number"
        );
    }
});
