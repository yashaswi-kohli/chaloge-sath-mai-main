import Trip from "../models/trip.model";
import { Request, Response } from "express";
import User, { UserI } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import Booking from "../models/booking.model";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import Conclusion from "../models/conclusion.model";
import mongoose, { isValidObjectId } from "mongoose";
import { sendDriverCancelDetail } from "../mails/sendDriverCacellingDetails";

export interface AuthenticatedRequest extends Request {
    user?: UserI;
}

export const cancelBooking = async function (trip : any, booking: any, driverCancel: boolean, deleteTrip: boolean) {

        let updatedTrip : any = null;

        const driver = await User.findById(trip.user);
        if(!driver) throw new ApiError(404, "Driver not found");

        const user = await User.findById(booking.user);
        if(!user) throw new ApiError(404, "User not found");

    try {

        const userConclusion = await Conclusion.findOne({ tripId: trip._id, travellerId: booking.user });
        if(!userConclusion) throw new ApiError(404, "User conclusion not found");

        userConclusion.archive = true;

        if(!deleteTrip) 
        {

            if(driverCancel) 
            {
                //* the driver cancelled the trip for the traveller
                driver.cancelledRides = driver.cancelledRides + 1;
                await driver.save();


                //* updating the conclusion for the user
                userConclusion.archive = true;
                userConclusion.conclusion = "The driver cancelled your ride.";
                await userConclusion.save();

            }
            else {
                //* updating the conclusion for the user
                userConclusion.archive = true;
                userConclusion.conclusion = "You cancelled the ride.";
                await userConclusion.save()
            }

            const bookingId = booking._id;

            //* updating the seats of the trip
            const seatLeft = trip.seats + booking.noOfSeat;
            const customerList = trip.customer.filter((customer: any) => {
                return customer._id.toString() !== bookingId.toString();
            });
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
            //* archiving the trip
            trip.archive = true;
            await trip.save();

            //* updating the conclusion for the user
            userConclusion.archive = true;
            userConclusion.conclusion = "The driver cancelled the trip.";
            await userConclusion.save();

            //* updating the cocnlusion for the driver
            const driverConclusion = await Conclusion.findOne({ tripId: trip._id, driverId: trip.user });
            if(!driverConclusion) throw new ApiError(404, "Driver conclusion not found");

            driverConclusion.archive = true;
            driverConclusion.conclusion = "You cancelled the trip.";
            await driverConclusion.save();

            //* increasing the cancelled rides of the driver
            driver.cancelledRides = driver.cancelledRides + 1;
            await driver.save();
        }

        //* deleteing the booking of the user
        await Booking.findByIdAndDelete(booking._id);

        return updatedTrip;
    }
    catch(error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while deleting a ride"
        );
    }
};

export const getAllYourBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    if(!userId || !isValidObjectId(userId)) throw new ApiError(400, "User id is required");

    try {
        if(userId !== (req.user?._id.toString()))
            throw new ApiError(401, "You are not authorised to view these bookings");

        //* showing all the bookings of the user
        const bookings = await Booking.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "trips",
                    localField: "tripId",
                    foreignField: "_id",
                    as: "trip",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                departureTime: 1,
                            },
                        },
                    ]
                },
            },
            {
                $project: {
                    _id: 1,
                    from: 1,
                    to: 1,
                    trip: 1,
                },
            }
        ]);

        //* showing all the trips of the user
        const trips = await Trip.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $project: {
                    _id: 1,
                    from: 1,
                    to: 1,
                    departureTime: 1,
                },
            },
        ]);

        const allBookings = {
            bookings,
            trips,
        };

        return res
            .status(200)
            .json(new ApiResponse(200, allBookings, "Bookings found successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while showing all bookings"
        );
    }
});

export const showBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
    const {tripId, bookingId} = req.body;
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");

    try {
            let fullBooking : any = null;
            const trip = await Trip.findById(tripId);
            if(!trip) throw new ApiError(404, "Trip not found");
    
            const day = trip.departureTime.getDay();
            const date = trip.departureTime.getDate();
            const month = trip.departureTime.getMonth();
    
            const rt = trip.reachingTime.getHours() + ":" + trip.reachingTime.getMinutes();
            const dt = trip.departureTime.getHours() + ":" + trip.departureTime.getMinutes();

            if(bookingId) 
            {
                if(!isValidObjectId(bookingId)) throw new ApiError(400, "Booking id is not valid id");
        
                const booking = await Booking.findById(bookingId);
                if(!booking) throw new ApiError(404, "Booking not found");

                fullBooking = await Booking.aggregate([
                    {
                        $match: {
                            tripId: new mongoose.Types.ObjectId(tripId),
                        },
                    },
                    {
                        $lookup: {
                            from: "trips",
                            localField: "tripId",
                            foreignField: "_id",
                            as: "tripDetails",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "users",
                                        localField: "user",
                                        foreignField: "_id",
                                        as: "driverDetails",
                                        pipeline: [
                                            {
                                                $project: {
                                                    firstName: 1,
                                                    lastName: 1,
                                                }
                                            },
                                        ]
                                    },
                                },
                                {

                                    $project: {
                                        _id: 1,
                                        user: 1,
                                        from: 1,
                                        to: 1,
                                        price: 1,
                                        driverDetails: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            fulldateTiming: {
                                day: day,
                                date: date,
                                month: month,
                                departureTime: dt,
                                reachingTime: rt,
                            }
                        },
                    },
                    {
                        $project: {
                            tripDetails: 1,
                            from: 1,
                            to: 1,
                            noOfSeat: 1,
                        }
                    },
                ]);
            }
            else {
                fullBooking = await Booking.aggregate([
                    {
                        $match: {
                            tripId: new mongoose.Types.ObjectId(tripId),
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "user",
                            foreignField: "_id",
                            as: "customerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        firstName: 1,
                                        lastName: 1,
                                    }
                                },
                            ]
                        },
                    },
                    {
                        $addFields: {
                            fulldate: {
                                day: day,
                                date: date,
                                month: month,
                                departureTime: dt,
                                reachingTime: rt,
                            }
                        },
                    },
                    {
                        $project: {
                            fulldate: 1,
                            from: 1,
                            to: 1,
                            customerDetails: 1,
                        }
                    }
                ]);

                
            }

            return res
                .status(200)
                .json(new ApiResponse(200, fullBooking, "Booking found successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while showing a ride"
        );
    }
});

export const cancelYourBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;
    if(!bookingId || !isValidObjectId(bookingId)) throw new ApiError(400, "Booking id is required");

    try {

        const booking = await Booking.findById(bookingId);
        if(!booking) throw new ApiError(404, "Booking not found")

        const tripId = booking.tripId;
        const trip = await Trip.findById(tripId.toString());
        if(!trip) throw new ApiError(404, "Trip not found");

        const driver = await User.findById(trip.user);
        if(!driver) throw new ApiError(404, "Driver not found");

        const updatedTrip = await cancelBooking(trip, booking, false, false);
        if(!updatedTrip) throw new ApiError(404, "Something went wrong while cancelling your ride");

        const user = await User.findById(booking.user);
        if(!user) throw new ApiError(404, "Traveller not found");

        const dateOfTrip = trip.departureTime.toDateString();
        const result = await sendDriverCancelDetail(driver.email, user.firstName, trip.from, trip.to, dateOfTrip);
        if(result.statusCode < 369) throw new ApiError(400, "Error while sending the cancellation email to traveller.");

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Booking cancelled successfully"));
    } 
    catch(error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while cancelling a ride"
        );
    }
});
