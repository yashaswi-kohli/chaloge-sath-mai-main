import {Request, Response} from "express";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/AsyncHandler.ts";
import UserModel, { User } from "../models/user.model.ts";
import { uploadOnCloudinary } from "../utils/cloudinary.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";


export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, birthdate, phoneNumber, email, password } = req.body;
        if ([firstName, lastName, birthdate, phoneNumber, email, password].some((field) => {
            return (field?.trim() === "");
        })) throw new ApiError(400, "All fields are required");
    
    
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

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {});

export const registerUser = asyncHandler(async (req: Request, res: Response) => {});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {});

export const updateUserAvatar = asyncHandler(async (req: Request, res: Response) => {});

export const verifyUserEmail = asyncHandler(async (req: Request, res: Response) => {});

export const verifyUserNumber = asyncHandler(async (req: Request, res: Response) => {});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {});