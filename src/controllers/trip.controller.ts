import {Request, Response} from "express";
import { User } from "../models/user.model.ts";
import { ApiError } from "../utils/ApiError.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/AsyncHandler.ts";
import TripModel, { Trip } from "../models/trip.model.ts";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export const createTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { from, to, departureTime, reachingTime, seats, car, price, instantBokking } = req.body;

    if(!from || !to || !departureTime || !reachingTime || !seats || !car || !price || !instantBokking) throw new ApiError(400, "All fields are required");

    const trip = await TripModel.create({
        user: req.user,
        from,
        to,
        departureTime,
        reachingTime,
        seats,
        car,
        price,
        instantBokking,
    });
    await trip.save();

    return res
        .status(201)
        .json(new ApiResponse(201, trip, "Trip created successfully"));
});

export const showAllRides = asyncHandler(async (req: Request, res: Response) => {});

export const showParitcularRides = asyncHandler(async (req: Request, res: Response) => {});

export const showAllTrips = asyncHandler(async (req: Request, res: Response) => {});

export const showParitcularTrips = asyncHandler(async (req: Request, res: Response) => {});

export const cancelYourRide = asyncHandler(async (req: Request, res: Response) => {});

export const cancelYourTrip = asyncHandler(async (req: Request, res: Response) => {});

export const cancelOthersRide = asyncHandler(async (req: Request, res: Response) => {});
