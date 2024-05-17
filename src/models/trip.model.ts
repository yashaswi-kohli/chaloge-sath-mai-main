import mongoose, {Schema, Document} from "mongoose";

export interface TripI extends Document {
    user: Schema.Types.ObjectId;
    from: string;
    to: string;
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

export const TripSchema : Schema<TripI> = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        from: {
            type: String,
            required: true,
        },
        to: {
            type: String,
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

const Trip = mongoose.model<TripI> ("Trip", TripSchema);
export default Trip;