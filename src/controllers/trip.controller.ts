import {Request, Response} from "express";
import { ApiError } from "../utils/ApiError.ts";
import TripModel from "../models/trip.model.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/AsyncHandler.ts";
import UserModel, { User } from "../models/user.model.ts";
import BookingModel, { BookingDetails } from "../models/booking.model.ts";
export interface AuthenticatedRequest extends Request {
    user?: User;
}

export const createTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { from, to, departureTime, reachingTime, seats, car, price, instantBokking } = req.body;
    
        if(!from || !to || !departureTime || !reachingTime || !seats || !car || !price || !instantBokking) throw new ApiError(400, "All fields are required");
    
        const trip = await TripModel.create({
            user: req.user?._id,
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
    } 
    catch (error) {
        throw new ApiError(
            500,
            error?.message || "something went wrong creating a trip"
        );
    }
});

export const getATrip = asyncHandler(async (req: Request, res: Response) => {
    const tripId = req.params;
    
    try {
        const trip = await TripModel.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");
    
        const user = await UserModel.findById(trip?.user);
        if(!user) throw new ApiError(404, "User not found");
    
        let coTravellers : any = [];

        for(const traveller of trip.customer) {
            if(traveller) {
                const user = await UserModel.findById(traveller.user);
                if(!user) throw new ApiError(404, "User not found");
                const tName =  user.firstName + " " + user.lastName;

                coTravellers.push({
                    id: traveller.user,
                    from : traveller.from.city,
                    to: traveller.from.city, 
                    name: tName,
                });
            }
        }
    
        const tripData = {
            day: trip.date.getDay(),
            date: trip.date.getDate(),
            month: trip.date.getMonth(),
    
            from: trip.from,
            departureTime: trip.departureTime,
            to: trip.to,
            reachingTime: trip.reachingTime,
    
            price: trip.price,
            userId: user._id,
            name: user.firstName + " " + user.lastName,
            rating: user.ratingS,
            nRatings: user.nRating,
    
            car: trip.car,
            aboutTrip: user.about,
            prefrence: user.prefrence,
            instantBooking: trip.instantBokking,
        }
    
        if(coTravellers.length > 0) tripData['coTravellers'] = coTravellers;
    
        return res
            .status(200)
            .json(new ApiResponse(200, tripData, "Trip found successfully"));
    } 
    catch (error) {
        throw new ApiError(
            500,
            error?.message || "something went wrong showing a particular ride"
        );
    }
    
})

export const getAllTrips = asyncHandler(async (req: Request, res: Response) => {

});

export const cancelYourTrip = asyncHandler(async (req: Request, res: Response) => {

});

export const cancelOthersTrip = asyncHandler(async (req: Request, res: Response) => {

});

export const updateTrip = asyncHandler(async (req: Request, res: Response) => {
    
});

export const bookYourTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tripId = req.params;

    const {from, to, noOfseat} = req.body;
    if(!from || !to || !noOfseat) throw new ApiError(400, "All fields are required");

    try {
        const trip = await TripModel.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");
    
        const seatLeft = trip.seats - noOfseat;
    
        const newBooking = await BookingModel.create({
            user: req.user?._id,
            tripId: trip._id,
            noOfseat,
            from ,
            to,
        });
    
        const updatedTrip = await TripModel.findByIdAndUpdate(
            tripId,
            {
                $set: {
                    seats: seatLeft,
                    customer: newBooking,
                }
            },
            {new: true},
        );
    
        return res
            .status(200)
            .json(new ApiResponse(200, updatedTrip, "Trip booked successfully"));
    } 
    catch (error) {
        throw new ApiError(
            500,
            error?.message || "something went wrong booking a trip"
        );
        
    }

});

export const cancelYourBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params;

    try {

        const booking = await BookingModel.findById(bookingId);
        if(!booking) throw new ApiError(404, "Booking not found");

        const trip = await TripModel.findById(booking.tripId);
        if(!trip) throw new ApiError(404, "Trip not found");
    
        const seatLeft = trip.seats + booking.noOfseat;
        const customerList = trip.customer.filter((customer: any) => customer !== booking);
    
        const updatedTrip = await TripModel.findByIdAndUpdate(
            bookingId.tripId,
            {
                $set: {
                    seats: seatLeft,
                    customer: customerList,
                }
            },
            {new: true},
        );

        await BookingModel.findByIdAndDelete(bookingId);

        return res
            .status(200)
            .json(new ApiResponse(200, updatedTrip, "Booking cancelled successfully"));
    } 
    catch(error) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while cancelling a ride"
        );
    }
        

    

});