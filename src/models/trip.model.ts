import { UserSchema, User } from "./user.model.js";
import mongoose, {Schema, Document} from "mongoose";
import { BookingDetails, BookingDetailSchema } from "./booking.model.js";

export interface Location extends Document {
    place: string;
    state: string;
    city: string;
    district: string;
}

export const LocationSchema: Schema<Location> = new Schema({
    place: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    district: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
});


export interface Trip extends Document {
    user: User;
    customer: BookingDetails[];
    from: Location;
    to: Location;
    car: string;
    departureTime: string;
    reachingTime: string;
    date: Date;
    price: number;
    seats: number;
    about: string;
    acceptBooking: boolean;
    instantBokking: boolean;
};

export const TripSchema : Schema<Trip> = new Schema(
    {
        user: {
            type: UserSchema,
            required: true,
        },
        customer: [BookingDetailSchema],
        from: {
            type: LocationSchema,
            required: true,
        },
        to: {
            type: LocationSchema,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        car: {
            type: String,
            required: true,
        },
        departureTime: {
            type: String,
            required: true,
        },
        reachingTime: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        acceptBooking: {
            type: Boolean,
            default: true,
        },
        about: String,
        seats: [Number],
        instantBokking: Boolean,
    }, { timestamps: true, }
);

const TripModel = mongoose.model<Trip> ("Trips", TripSchema);
export default TripModel;