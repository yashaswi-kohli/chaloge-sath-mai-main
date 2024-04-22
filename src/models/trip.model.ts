import { UserSchema, User } from "./user.model.js";
import mongoose, {Schema, Document} from "mongoose";

export interface Trip extends Document {
    user: User;
    from: string;
    to: string;
    car: string;
    departureTime: string;
    reachingTime: string;
    price: number;
    seats: number;
    seatLocation: string;
    confirmBooking: boolean;
};

export const TripSchema : Schema<Trip> = new Schema(
    {
        user: UserSchema,
        from: {
            type: String,
            required: true,
        },
        to: {
            type: String,
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
        seats: {
            type: Number,
            required: true,
        },
        seatLocation: {
            type: String,
            required: true,
        },
        confirmBooking: {
            type: Boolean,
            required: true,
        }

    }
);

const TripModel = mongoose.model<Trip> ("Trips", TripSchema);
export default TripModel;