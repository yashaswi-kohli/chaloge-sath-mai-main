import mongoose from "mongoose";
import {Request, Response} from "express";
import Rating from "../models/rating.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import User, { UserI } from "../models/user.model";

export interface AuthenticatedRequest extends Request {
    user?: UserI;
}

export const getAllRatings = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    if(!userId) throw new ApiError(400, "UserI id is required");

    try {
        const ratings = await Rating.aggregate([
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
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while getting all reviews for the user"
        );    
    }
});

export const giveARating = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
    const { rating, comment, driverId } = req.body;
    if(!rating || !comment || !driverId) 
        throw new ApiError(400, "Rating, comment and driver id are required");
    
    try {
        const driver = await User.findById(driverId);
        if(!driver) throw new ApiError(404, "Driver not found");

        const newRatingStar =(((driver.nRating * driver.ratingS) + rating) / (driver.nRating + 1));

        driver.ratingS = newRatingStar;
        driver.nRating = driver.nRating + 1;
        await driver.save();

        const newRating = await Rating.create({
            driver: driverId,
            customer: req.user?._id,
            rating,
            comment,
        });

        return res
            .status(201)
            .json(new ApiResponse(201, newRating, "Rating given successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while giving a rating"
        );
    }
});

export const updateRating = asyncHandler(async (req: Request, res: Response) => {
    
    const { ratingId } = req.params;
    const { rating, comment } = req.body;
    if(!rating || !comment) throw new ApiError(400, "Rating and comment are required");
    
    try {
        const oldRating = await Rating.findById(ratingId);
        if(!oldRating) throw new ApiError(404, "Rating not found");

        const user = await User.findById(oldRating.driver);
        if(!user) throw new ApiError(404, "Driver not found");

        const newRatingStar = (((user.nRating * user.ratingS) - oldRating.rating + rating) / user.nRating);

        user.ratingS = newRatingStar;
        await user.save();

        const updatedRating = await Rating.findByIdAndUpdate(
            ratingId,
            {
                rating,
                comment,
            },
            { new: true }
        );

        return res
            .status(200)
            .json(new ApiResponse(200, updatedRating, "Rating updated successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while updating the rating"
        );
    }
});

export const deleteRating = asyncHandler(async (req: Request, res: Response) => {
    const { ratingId } = req.params;

    try {
        const rating = await Rating.findById(ratingId);
        if(!rating) throw new ApiError(404, "Rating not found");

        const user = await User.findById(rating.driver);
        if(!user) throw new ApiError(404, "Driver not found");

        const newRatingStar = (((user.nRating * user.ratingS) - rating.rating ) / (user.nRating - 1));

        user.ratingS = newRatingStar;
        user.nRating = user.nRating - 1;
        await user.save();

        await rating.deleteOne({ _id: ratingId});

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Rating updated successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while deleting the rating"
        );
    }
});