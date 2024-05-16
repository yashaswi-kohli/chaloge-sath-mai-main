import mongoose from "mongoose";
import {Request, Response} from "express";
import { User } from "../models/user.model.ts";
import { ApiError } from "../utils/ApiError.ts";
import RatingModel from "../models/rating.model.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/AsyncHandler.ts";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export const getAllRatings = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    if(!userId) throw new ApiError(400, "User id is required");

    try {
        const ratings = await RatingModel.aggregate([
            {
                $match: {
                    driver: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customerInfo",
                },
            },
            {
                $project: {
                    rating: 1,
                    comment: 1,
                    customerInfo: {
                        _id: 1,
                        name: 1,
                        avatar: 1,
                    },
                    createdAt: 1,
                },
            },
        ]);
    
        return res
            .status(200)
            .json(new ApiResponse(200, ratings, "Ratings fetched successfully"));
    
    } 
    catch (error) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while getting all reviews for the user"
        );    
    }
});

export const giveARating = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {});

export const updateRating = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {});

export const deleteRating = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {});