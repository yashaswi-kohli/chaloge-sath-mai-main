import { UserSchema, User } from "./user.model.js";
import mongoose, {Schema, Document} from "mongoose";

export interface Trip extends Document {
    user: User;
    customer: User[];
    from: string;
    to: string;
    car: string;
    departureTime: string;
    reachingTime: string;
    price: number;
    seats: [number];
    acceptBooking: boolean;
    instantBokking: boolean;
};

export const TripSchema : Schema<Trip> = new Schema(
    {
        user: UserSchema,
        customer: [UserSchema],
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
        acceptBooking: {
            type: Boolean,
            default: true,
        },
        seats: [Number],
        instantBokking: Boolean,
    }
);

const TripModel = mongoose.model<Trip> ("Trips", TripSchema);
export default TripModel;