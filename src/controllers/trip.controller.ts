import moment from "moment";
import Trip from "../models/trip.model";
import {Request, Response} from "express";
import { ApiError } from "../utils/ApiError";
import Booking from "../models/booking.model";
import User, { UserI } from "../models/user.model";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler";
import { cancelBooking } from "./booking.controller";
import Conclusion from "../models/conclusion.model";

export interface AuthenticatedRequest extends Request {
    user?: UserI;
}

const checkOrganiserOfTrip = async function (tripId: string, userId: string) {

    if(!userId || !isValidObjectId(userId)) throw new ApiError(400, "User id is required");
    try 
    {
      const trip = await Trip.findById(tripId);
      if (!trip) throw new ApiError(404, "Trip does not exist");

      return (trip.user.toString() === userId.toString());
    } 
    catch (error: any) {
      throw new ApiError(500, error?.message || "Something went wrong while checking the user of the trip person");
    }
};

export const createTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { from, to, departureTime, reachingTime, seats, car, price, instantBooking } = req.body;
    if(!from || !to || !departureTime || !reachingTime || !seats || !car || !price ||!instantBooking) throw new ApiError(400, "All fields are required");

    try {

        const reachingT = moment(reachingTime,"YYYY-MM--DD HH:mm").toDate();
        const departureT = moment(departureTime, "YYYY-MM-DD HH:mm").toDate();
        
        const trip = await Trip.create({
            user: req.user?._id,
            from,
            to,
            departureTime: departureT,
            reachingTime: reachingT,
            seats,
            car,
            price,
            instantBooking,
        });

        const conclusion = await Conclusion.create({
            tripId: trip._id,
            driverId: req.user?._id,
            date: trip.departureTime,
        });

        const user = await User.findById(req.user?._id).select( "-password -refreshToken");
        if(!user) throw new ApiError(404, "User not found");

        user.tripsArchive.push(conclusion._id);
        user.ridesPublished = user.ridesPublished + 1;
        await user.save();
    
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
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");
    
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

        const rt = trip.reachingTime.getHours() + ":" + trip.reachingTime.getMinutes();
        const dt  = trip.departureTime.getHours() + ":" + trip.departureTime.getMinutes();

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
                    day: { $dayOfWeek: "$departureTime" },
                    date: { $dayOfMonth: "$departureTime" },
                    month: { $month: "$departureTime" },
                    from: 1,
                    departureTime: dt,
                    to: 1,
                    reachingTime: rt,
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

export const updateTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");

    try {
        const check = await checkOrganiserOfTrip(tripId, req.user?._id)
        if(!check) throw new ApiError(401, "You are not authorised to update this trip");

        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        const { from, to, departureTime, reachingTime, seats, car, price, instantBooking } = req.body;
        if(!from && !to && !departureTime && !reachingTime && !seats && !car && !price && !instantBooking) 
            throw new ApiError(400, "Give some fields that are to be update");

        const reachingT = moment(reachingTime,"YYYY-MM--DD HH:mm").toDate();
        const departureT = moment(departureTime, "YYYY-MM-DD HH:mm").toDate();
        
        if(from) trip.from = from;
        if(to) trip.to = to;
        if(departureTime) trip.departureTime = departureT;
        if(reachingTime) trip.reachingTime = reachingT;
        if(seats) trip.seats = seats;
        if(car) trip.car = car;
        if(price) trip.price = price;
        if(instantBooking) trip.instantBooking = instantBooking;

        const updatedTrip = await trip.save();
        if(!updatedTrip) throw new ApiError(500, "Trip not updated");

        return res
            .status(200)
            .json(new ApiResponse(200, updatedTrip, "Trip updated successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong updating a trip"
        )
    }
});

export const sendRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");

    const {from, to, noOfSeat} = req.body;
    if(!from || !to || !noOfSeat) throw new ApiError(400, "All fields are required");

    try {
        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        const user = await User.findById(req.user?._id).select( "-password -refreshToken");
        if(!user) throw new ApiError(404, "User not found");



        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Request sent successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong sending a request"
        );
    }
});

export const bookYourTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");

    const {from, to, noOfSeat} = req.body;
    if(!from || !to || !noOfSeat) throw new ApiError(400, "All fields are required");

    try {
        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");
    
        const seatLeft : Number = trip.seats - noOfSeat;
    
        const newBooking = await Booking.create(
            {
                user: req.user?._id,
                tripId: trip._id,
                noOfSeat,
                from,
                to,
            }
        );

        if (!newBooking) throw new ApiError(500, "Booking failed");
        
        trip.seats = seatLeft as number;
        trip.customer.push(newBooking._id);
        await trip.save();


        const user = await User.findById(req.user?._id).select( "-password -refreshToken");
        if(!user) throw new ApiError(404, "User not found");

        const conclusion = await Conclusion.create({
            tripId: trip._id,
            date: trip.departureTime,
            bookingId: newBooking._id,
            travellerId: req.user?._id,
        });
        user.tripsArchive.push(conclusion._id);
        await user.save();
        
        return res
            .status(200)
            .json(new ApiResponse(200, newBooking, "Trip booked successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong booking a trip"
        );
        
    }

});

//todo      inform the travellers from message
export const cancelYourTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");

    try {
        const check = await checkOrganiserOfTrip(tripId, req.user?._id)
        if(!check) throw new ApiError(401, "You are not authorised to cancel this trip");

        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        trip.customer.map(async (customer: any) => {
            const booking = await Booking.findById(customer);
            if(!booking) throw new ApiError(404, "Booking not found");

            await cancelBooking(trip, booking, true, true);
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

//todo      inform the travellers from message
export const cancelOthersTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId, bookingId } = req.params;

    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");
    if(!bookingId || !isValidObjectId(bookingId)) throw new ApiError(400, "Booking id is required");

    try {

        const check = await checkOrganiserOfTrip(tripId, req.user?._id)
        if(!check) throw new ApiError(401, "You are not authorised to cancel this trip");

        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        const booking = await Booking.findById(bookingId);
        if(!booking) throw new ApiError(404, "Booking not found");

        const updatedTrip = await cancelBooking(trip, booking, true, false);
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
