import mongoose, {Schema, Document} from "mongoose";

export interface TripI extends Document {
    user: Schema.Types.ObjectId;
    customer: [Schema.Types.ObjectId];
    from: string;
    to: string;
    car: string;
    departureTime: Date;
    reachingTime: Date;
    price: number;
    seats: number;
    about: string;
    archive: boolean;
    instantBooking: boolean;
};

export const TripSchema : Schema<TripI> = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        customer: {
               type: [Schema.Types.ObjectId],
                ref: "Booking", 
        },
        from: {
            type: String,
            required: true,
        },
        to: {
            type: String,
            required: true,
        },
        departureTime: {
            type: Date,
            required: true,
        },
        reachingTime: {
            type: Date,
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
        instantBooking: {
            type: Boolean,
            required: true,
        },
        car: {
            type: String,
            required: true,
        },
        archive: {
            type: Boolean,
            default: false,
        },
    }, { timestamps: true, }
);

const Trip = mongoose.model<TripI> ("Trip", TripSchema);
export default Trip;