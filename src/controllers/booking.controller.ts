import Trip from "../models/trip.model";
import { Request, Response } from "express";
import User, { UserI } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import Booking from "../models/booking.model";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import Conclusion from "../models/conclusion.model";

export interface AuthenticatedRequest extends Request {
    user?: UserI;
}

export const cancelBooking = async function (tripId : string, bookingId: string, driverCancel: boolean, deleteTrip: boolean) {

        let conclusion : string;
        let updatedTrip : any = null;

        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");
        
        const booking = await Booking.findById(bookingId);
        if(!booking) throw new ApiError(404, "Booking not found");

        const driver = await User.findById(trip.user);
        if(!driver) throw new ApiError(404, "Driver not found");

        const user = await User.findById(booking.user);
        if(!user) throw new ApiError(404, "User not found");

    try {

        if(!deleteTrip) 
        {
            if(driverCancel) {
                conclusion = "The driver cancelled your ride.";
                driver.cancelledTrips = driver.cancelledTrips + 1;
                await driver.save();
            }
            else {
                conclusion = "You cancelled the trip.";
            }

            //* updating the seats of the trip
            const seatLeft = trip.seats + booking.noOfseat;
            const customerList = trip.customer.filter((customer: any) => customer !== booking);
            updatedTrip = await Trip.findByIdAndUpdate(
                booking.tripId,
                {
                    $set: {
                        seats: seatLeft,
                        customer: customerList,
                    }
                },
                {new: true},
            );
        }
        else {
            conclusion = "The driver cancelled the trip.";
            driver.cancelledTrips = driver.cancelledTrips + 1;
            await driver.save();
        }

        //* deleteing the booking of the user
        await Booking.findByIdAndDelete(bookingId);

        //* adding the trip to the archive of the user
        const archivedTrip = await Conclusion.create({ conclusion, tripId: tripId,});
        if(!archivedTrip) throw new ApiError(500, "something went wrong while creating conclusion of the trip");

        user.tripsArchive.push(archivedTrip._id);
        await user.save();

        return updatedTrip;
    }
    catch(error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while deleting a ride"
        );
    }
};

export const showAllBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
});

export const showBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

});

export const cancelYourBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;

    try {
        const updatedTrip = await cancelBooking(req.user?._id, bookingId, true, false);

        return res
            .status(200)
            .json(new ApiResponse(200, updatedTrip, "Booking cancelled successfully"));
    } 
    catch(error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while cancelling a ride"
        );
    }
});
