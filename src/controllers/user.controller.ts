import { OPTIONS } from "../constants.ts";
import {Request, Response} from "express";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/AsyncHandler.ts";
import UserModel, { User } from "../models/user.model.ts";
import { deleteFromCloudinary, extractPublicId, uploadOnCloudinary } from "../utils/cloudinary.ts";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

const generateAccessAndRefreshToken = async (userId: string) => {
    try {
      const user = await UserModel.findById(userId);
  
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
    catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};

export const loginUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { phoneNumber, email, password } = req.body;

    if (!phoneNumber && !email) 
        throw new ApiError(400, "at least give userName or email");

    if (!password) 
        throw new ApiError(400, "password is required");

    try {
        const user = await UserModel.findOne({ $or: [{ email }, { phoneNumber }] });
        if(!user) throw new ApiError(404, "User not found");

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) throw new ApiError(401, "Invalid User Credentials");

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await UserModel.findById(user._id).select(
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
        

    } catch (error) {
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
  
        await UserModel.findByIdAndUpdate(
          userId,
          {
            $set: {
              refreshToken: undefined,
            },
          },
          {
            new: true,
          }
        );
  
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

export const registerUser = asyncHandler(async (req: Request, res: Response) => {

    const { firstName, lastName, birthdate, phoneNumber, email, password } = req.body;
    if ([firstName, lastName, birthdate, phoneNumber, email, password].some((field) => {
        return (field?.trim() === "");
    })) throw new ApiError(400, "All fields are required");

    try {
        const existedUser = await UserModel.findOne({ $or: [{ email }, { phoneNumber }] });
        if(existedUser) throw new ApiError(409, "User already exist");
    
        const avatarImage = (req.files as { [fieldname: string]: Express.Multer.File[] })?.avatar;
        const avatarLocalPath = avatarImage && avatarImage[0]?.path;
        if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required");
    
        const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
        if(!avatarResponse) throw new ApiError(400, "Avatar file is required!!!.");
    
    
        const user = await UserModel.create({
            firstName,
            lastName,
            email,
            birthdate,
            phoneNumber,
            password,
            avatar: avatarResponse.url,
        });
        const createdUser: User = await UserModel.findById(user._id).select(
            "-password -refreshToken"
        );
        if(!createdUser) throw new ApiError(500, "Something went wrong while creating the user");
    
    
        return res
          .status(201)
          .json(new ApiResponse(200, createdUser, "User register successfully"));
    
    } 
    catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong while registering user"
        );
    }
});

export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { firstName, lastName, birthdate, phoneNumber, email } = req.body;
    if(!firstName || !lastName || !birthdate || !phoneNumber || !email ) 
        throw new ApiError(400, "All fields are required");

    let isNumberVerified = true, isEmailVerified = true;
    if(email) isEmailVerified = false;
    if(phoneNumber) isNumberVerified = false;

    try {
        const user = await UserModel.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    firstName,
                    lastName,
                    birthdate,
                    phoneNumber,
                    email,
                    isEmailVerified,
                    isNumberVerified,
                },
            },
            {
                new: true,
            }
        ).select("-password -refreshToken");

        if(!user) throw new ApiError(404, "User not found");
    
        return res
            .status(200)
            .json(new ApiResponse(201, user, "Account detailed updated successfully"));
    } 
    catch (error) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while updating account details"
        );
    }
});

export const updateUserAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    try {
        
        const user = await UserModel.findById(req.user?._id);
        if(!user) throw new ApiError(404, "User Not Found");


        const oldAvaterUrl = user.avatar;
        if (oldAvaterUrl) {
            const publicId = await extractPublicId(oldAvaterUrl);
            const response = await deleteFromCloudinary(publicId);
        }

        const avatarFile = (
            req.files as { [filedname: string]: Express.Multer.File[] }
        )?.avatar;

        const avatarLocalPath = avatarFile && avatarFile[0].path;
        if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing...");

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const updatedUser = await UserModel.findByIdAndUpdate()
    
        return res
            .status(200)
            .json(new ApiResponse(201, updatedUser, "Avatar Successfully Updated"));
    } 
    catch (error) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while updating avatar"
        );
    }
});

export const verifyUserEmail = asyncHandler(async (req: Request, res: Response) => {});

export const verifyUserNumber = asyncHandler(async (req: Request, res: Response) => {});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {});