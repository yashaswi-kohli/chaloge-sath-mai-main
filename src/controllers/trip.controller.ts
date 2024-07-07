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
import { sendBookingDetail } from "../mails/sendBookingDetail";
import { sendTravellerCancelDetail } from "../mails/sendTravellerCancellingDetails";

export interface AuthenticatedRequest extends Request {
    user?: UserI;
}

const changingDateFormat = (date: Date) : string => {

    let departureDate : string;
    const yyyy = date.getFullYear().toString();
    
    let dd = date.getDate();
    let mm = date.getMonth() + 1;

    if (dd < 10) departureDate = "0" + dd + "/";
    else departureDate = dd + "/";

    if (mm < 10) departureDate  += "0" + mm  + "/" + yyyy;
    else departureDate += mm + "/" + yyyy;

    return departureDate;    
}

export const checkTripsWhichAreToBeArchived = async function () {
    try {
        const trips = await Trip.find({ reachingTime: { $lt: new Date() } });
        if(trips.length > 0) {
            trips.map(async (trip: any) => 
            {
                if(trip.customer.length > 0) 
                {
                    trip.customer.map(async (customer: any) => {
                        const booking = await Booking.findById(customer);
                        if(!booking) throw new ApiError(404, "Booking not found");

                        const customerConclusion = await Conclusion.findOne({ tripId: trip._id, travellerId: booking.user });
                        if(!customerConclusion) throw new ApiError(404, "Customer conclusion not found");

                        customerConclusion.archive = true;
                        customerConclusion.conclusion = "Trip is completed.";
                        await customerConclusion.save();

                        await Booking.findByIdAndDelete(customer);
                        
                    });
                }

                const driverConclusion = await Conclusion.findOne({ tripId: trip._id, driverId: trip.user });
                if(!driverConclusion) {
                    console.log("no driver conclusion found");
                    throw new ApiError(400, "Driver Conclusion not found")
                }

                driverConclusion.archive = true;
                driverConclusion.conclusion = "Trip is completed.";
                await driverConclusion.save();

                trip.archive = 0;
                await trip.save();

            });
        }
    }
    catch (error: any) {
        throw new ApiError(500, error?.message || "Something went wrong while checking the trips which are to be cancelled");
    }

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

    const { from, to, departureTime, reachingTime, seats, car, price, maxTwoSeatsAtBack } = req.body;
    if(!from || !to || !departureTime || !reachingTime || !seats || !car || !price ) 
        throw new ApiError(400, "All fields are required");


    try {
        const reachingT = moment(reachingTime,"YYYY-MM--DD HH:mm").toDate();
        const departureT = moment(departureTime, "YYYY-MM-DD HH:mm").toDate();

        const date = changingDateFormat(departureT);

        let timeDiff : number = (reachingT.valueOf() - departureT.valueOf());
        let minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
        let hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
        

        const tripTime = ((hours < 10) ? "0" + hours.toString() : hours.toString()) + 
                         ((minutes < 10) ? "0" + minutes.toString() : minutes.toString());
        
        const trip = await Trip.create({
            user: req.user?._id,
            from,
            to,
            tripTime,
            date,
            departureTime: departureT,
            reachingTime: reachingT,
            seats,
            car,
            price,
            maxTwoSeatsAtBack,
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

export const getAllTrips = asyncHandler(async (req: Request, res: Response) => {
    let { from, to, date, seats, sortBy, sortType, prefrence, timePeriod, maxTwoSeatsAtBack } = req.query;
    if(!from && !to && !date && !seats) throw new ApiError(400, "All fields are required");

    try {

        const pipeline : any = [];
        const dateFormat = moment(date as string, "YYYY-MM-DD").toDate();
        const fullDate = changingDateFormat(dateFormat);

        //* searching trips for exact from, to date and min give nubmer seats
        pipeline.push({
            $match: {
                to,
                from,
                date: fullDate,
                seats: { $gte: Number(seats) - 1},
            },
        });


        // //* when user want to have only max 2 people at the back
        if(maxTwoSeatsAtBack) {
            pipeline.push({
                $match: {
                    maxTwoSeatsAtBack: true,
                },
            });
        }


        // //* if user wnat to go between a particular time period
        if(timePeriod) {

            let tp = Number(timePeriod)
            let less = (tp * 6), greater = ((tp + 1) * 6);

            pipeline.push(
                {
                    $addFields: {
                        hour: {
                            $hour: {
                                date: "$departureTime",
                                timezone: "+0530",
                            }
                        }
                    }
                },
                {
                    $match: {
                        hour: {$gte: less, $lt: greater}
                    }
                },
            )
        }



        // //* if user want to sort the trips by departure time or lowest price or by the shortest time
        if(sortType && sortBy) {
            pipeline.push({
                $sort: {
                    [sortBy as string]: sortType === "asc" ? 1 : -1
                }
            });
        } else pipeline.push({ $sort: { createdAt: -1 } });


        // //* if user want to have a prefrence like allowing cigratte or with pets
        if(prefrence) {
            let pref = String(prefrence);

            let first = Number(pref[0]), second = 0;        
            let newPrefrence : [number] = [0];

            if(pref.length & 1) newPrefrence[0] = first;
            else {
                second = Number(pref[1]) + 3;
                newPrefrence.push(second);
            }

            pipeline.push(
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "userInfo",
                        pipeline: [
                            {
                                $match: {
                                    prefrence: { $all: newPrefrence }
                                  },
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    avatar: 1,
                                    ratingS: 1,
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        size: {
                            $size: "$userInfo"
                        }
                    }
                },
                {
                    $match: {
                        size: {$gt: 0}
                    }
                },
                {
                    $project: {
                        from: 1,
                        to: 1,
                        car: 1,
                        seats: 1,
                        userInfo: 1,
                        departureTime: 1,
                        reachingTime: 1,
                        timeDiff: 1,
                        price: 1,
                        maxTwoSeatsAtBack: 1,
                    }
                }
            );
        }
        else {
            pipeline.push(
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "userInfo",
                        pipeline: [
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    avatar: 1,
                                    ratingS: 1,
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        from: 1,
                        to: 1,
                        car: 1,
                        seats: 1,
                        userInfo: 1,
                        departureTime: 1,
                        reachingTime: 1,
                        timeDiff: 1,
                        price: 1,
                        maxTwoSeatsAtBack: 1,
                    }
                }
            );
        }

        const tripData = await Trip.aggregate(pipeline);

        return res
            .status(200)
            .json(new ApiResponse(200, tripData, "Trips found successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong updating a trip"
        )
    }

    
});

export const updateTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");

    try {
        const check = await checkOrganiserOfTrip(tripId, req.user?._id)
        if(!check) throw new ApiError(401, "You are not authorised to update this trip");

        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        const { from, to, departureTime, reachingTime, seats, car, price } = req.body;
        if(!from && !to && !departureTime && !reachingTime && !seats && !car && !price) 
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

export const bookYourTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");

    const {from, to, noOfSeat} = req.body;
    if(!from || !to || !noOfSeat) throw new ApiError(400, "All fields are required");

    try {
        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        const driver = await User.findById(trip.user);
        if(!driver) throw new ApiError(404, "Driver not found");
    
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

        const dateOfTrip = trip.departureTime.getDate().toString();
        const result = await sendBookingDetail(driver.email, user.firstName, noOfSeat, from, to, dateOfTrip);
        if(result.statusCode < 369) throw new ApiError(400, "Error while sending the verification code to email");
        
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

export const cancelYourTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tripId } = req.params;
    if(!tripId || !isValidObjectId(tripId)) throw new ApiError(400, "Trip id is required");

    try {
        const check = await checkOrganiserOfTrip(tripId, req.user?._id)
        if(!check) throw new ApiError(401, "You are not authorised to cancel this trip");

        const trip = await Trip.findById(tripId);
        if(!trip) throw new ApiError(404, "Trip not found");

        if(trip.customer.length > 0) {
            trip.customer.map(async (customer: any) => {
                const booking = await Booking.findById(customer);
                if(!booking) throw new ApiError(404, "Booking not found");
    
                const chk = await cancelBooking(trip, booking, true, true);
                if(!chk) throw new ApiError(500, "Booking not deleted");

                const traveller = await User.findById(booking.user);
                if(!traveller) throw new ApiError(404, "Traveller not found");

                const purpose = "the driver cancelled the whole tirp";
                const dateOfTrip = trip.departureTime.getDate().toString();
                const result = await sendTravellerCancelDetail(traveller.email, traveller.firstName, trip.from, trip.to, dateOfTrip, purpose);
                if(result.statusCode < 369) throw new ApiError(400, "Error while sending the cancellation email to traveller.");
            });
        }
        else {
            const driverConclusion = await Conclusion.findOne({ tripId: trip._id, driverId: trip.user });
            if(!driverConclusion) throw new ApiError(404, "Driver conclusion not found");

            driverConclusion.archive = true;
            driverConclusion.conclusion = "You cancelled the trip.";
            await driverConclusion.save();
        }

        

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Trip cancelled successfully"));
    } 
    catch (error: any) {
        throw new ApiError(
            500,
            error?.message || "something went wrong while cancelling a tri"
        )
    }
});

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

        const traveller = await User.findById(booking.user);
        if(!traveller) throw new ApiError(404, "Traveller not found");

        const purpose = "the driver cancelled the your booking.";
        const dateOfTrip = trip.departureTime.getDate().toString();

        const result = await sendTravellerCancelDetail(traveller.email, traveller.firstName, trip.from, trip.to, dateOfTrip, purpose);
        if(result.statusCode < 369) throw new ApiError(400, "Error while sending the cancellation email to traveller.");

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
