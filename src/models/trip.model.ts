import { UserSchema, User } from "./user.model.js";
import mongoose, {Schema, Document} from "mongoose";
import { RatingSchema, Rating } from "./rating.model.js";

export interface Trip extends Document {
    user: User;
    from: string;
    to: string;
    car: string;
    departureTime: string;
    reachingTime: string;
    price: number;
    seats: [number];
    acceptBooking: boolean;
    confirmBooking: boolean;
    instantBokking: boolean;
    Rating: Rating[];
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
        seats: [Number],
        acceptBooking: {
            type: Boolean,
            default: true,
        },
        instantBokking: {
            type: Boolean,
        },
        confirmBooking: {
            type: Boolean,
        },
        Rating: [RatingSchema],
    }
);

const TripModel = mongoose.model<Trip> ("Trips", TripSchema);
export default TripModel;