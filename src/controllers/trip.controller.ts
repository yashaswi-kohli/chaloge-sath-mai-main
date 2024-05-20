import mongoose from "mongoose";
import Trip from "../models/trip.model";
import {Request, Response} from "express";
import { ApiError } from "../utils/ApiError";
import Booking from "../models/booking.model";
import User, { UserI } from "../models/user.model";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { cancelBooking } from "./booking.controller";

export interface AuthenticatedRequest extends Request {
    user?: UserI;
}

const checkOrganiserOfTrip = async (tripId: string, userId: string) => {
    try 
    {
      const trip = await Trip.findById(tripId);
      if (!trip) throw new ApiError(404, "Video does not exist");

      return (trip?.user.toString() !== userId.toString());
    } 
    catch (error: any) {
      throw new ApiError(500, error?.message || "Something went wrong");
    }
};

export const createTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { from, to, departureTime, reachingTime, seats, car, price, instantBokking, date } = req.body;

        console.log(date);
    
        if(!from || !to || !departureTime || !reachingTime || !seats || !car || !price || !instantBokking || !date) throw new ApiError(400, "All fields are required");
    
        const trip = await Trip.create({
            user: req.user?._id,
            from,
            to,
            departureTime,
            reachingTime,
            seats,
            car,
            price,
            date,
            instantBokking,
        });
        await trip.save();
    
        return res
            .status(201)
            .json(new ApiResponse(201, trip, "Trip created successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong creating a trip"
        );
    }
});

export const getATrip = asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    
    try {
        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");
    
        const user = await User.findById(trip.user);
        if(!user) throw new ApiError(404, "User not found");
    
        let coTravellers : [any];

        trip.customer.map(async (traveller: any) => 
            {
                const user = await User.findById(traveller.user);
                if(!user) throw new ApiError(404, "User not found");
                const tName =  user.firstName + " " + user.lastName;

                coTravellers.push({
                    id: traveller.user,
                    from : traveller.from.city,
                    to: traveller.from.city, 
                    name: tName,
                });
            }
        );

        const tripData = await Trip.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(tripId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userInfo",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: {
                                    $concat: ["$firstName", " ", "$lastName"]
                                },
                                avatar: 1,
                                nRating: 1,
                                ratingS: 1,
                                isEmailVerified: 1,
                                isNumberVerified: 1,
                                prefrence: 1,
                                about: 1,
                            }
                        },
                    ]
                },      
            },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "tripId",
                    as: "coTravellers",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "Details",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            firstName: 1,
                                            lastName: 1,
                                            avatar: 1,
                                        }
                                    }
                                ]
                            }
                        },
                    ]
                },
            },
            {
                $project: {
                    day: { $dayOfWeek: "$date" },
                    date: { $dayOfMonth: "$date" },
                    month: { $month: "$date" },
                    from: 1,
                    departureTime: 1,
                    to: 1,
                    reachingTime: 1,
                    price: 1,
                    userInfo: 1,
                    car: 1,
                    seats: 1,
                    instantBooking: 1,
                },
            }
        ]);
    
        return res
            .status(200)
            .json(new ApiResponse(200, tripData, "Trip found successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong showing a particular ride"
        );
    }
    
})

//Todo      it will get all the trips related to search query
export const getAllTrips = asyncHandler(async (req: Request, res: Response) => {

});

//Todo      updating the trip info and sharing with the travellers
export const updateTrip = asyncHandler(async (req: Request, res: Response) => {
    
});


//todo       Both controllers after traverlers have booked their rides, and driver want to review it
export const showAllCustomers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    const check = await checkOrganiserOfTrip(tripId, req.user?._id);
    if(!check) throw new ApiError(401, "You are not authorised to cancel this trip");

    try {
        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        const customers = await Booking.find({ tripId: tripId });
        if(!customers) throw new ApiError(404, "Customers not found");

        return res
            .status(200)
            .json(new ApiResponse(200, customers, "Customers found successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong showing all customers"
        );
    }
});

export const getOthersBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId, bookingId } = req.params;

    try {
        const check = await checkOrganiserOfTrip(tripId, req.user?._id);
        if(!check) throw new ApiError(401, "You are not authorised to cancel this trip");

        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        const booking = await Booking.findById(bookingId);
        if(!booking) throw new ApiError(404, "Booking not found");

        const user = await User.findById(booking.user);
        if(!user) throw new ApiError(404, "User not found");

        return res
            .status(200)
            .json(new ApiResponse(200, booking, "Booking found successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong showing a particular ride"
        );
    }
});

//* Booking a ride
//todo      inform the driver about booking from message, and verify it, and after time limit, it will be auto cancelled
export const bookYourTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;

    const {from, to, noOfseat} = req.body;
    if(!from || !to || !noOfseat) throw new ApiError(400, "All fields are required");

    try {
        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");
    
        const seatLeft : Number = trip.seats - noOfseat;
    
        const newBooking = await Booking.create(
            {
                user: req.user?._id,
                tripId: trip._id,
                noOfseat: seatLeft,
                from,
                to,
            }
        );

        if (!newBooking) throw new ApiError(500, "Booking failed");
        trip.customer.push(newBooking._id);

        const updatedTrip = await Trip.findByIdAndUpdate(
            tripId,
            {
                $set: {
                    seats: seatLeft,
                    customer: trip.customer,
                },
            },
            { new: true }
        );
    
        return res
            .status(200)
            .json(new ApiResponse(200, updatedTrip, "Trip booked successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong booking a trip"
        );
        
    }

});

//*         Cancel your trip
//todo      inform the travellers from message
export const cancelYourTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    try {
        const check = await checkOrganiserOfTrip(tripId, req.user?._id)
        if(!check) throw new ApiError(401, "You are not authorised to cancel this trip");

        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        trip.customer.map(async (customer: any) => {

        });

        const deleteTrip = await Trip.findByIdAndDelete(tripId);
        if(!deleteTrip) throw new ApiError(500, "Trip not deleted");

        return res
            .status(200)
            .json(new ApiResponse(200, deleteTrip, "Trip cancelled successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while cancelling a tri"
        )
    }
});

//*         Cancel your travellers booking 
//todo      inform the travellers from message
export const cancelOthersTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId, bookingId } = req.params;

    try {
        const check = await checkOrganiserOfTrip(tripId, req.user?._id)
        if(!check) throw new ApiError(401, "You are not authorised to cancel this trip");

        const updatedTrip = await cancelBooking(tripId, bookingId, false, false);
        if(!updatedTrip) throw new ApiError(500, "Booking not deleted");

        return res
            .status(200)
            .json(new ApiResponse(200, updatedTrip, "Booking cancelled successfully"));
    }
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while cancelling a ride"
        );
    }
});
