import mongoose, {Schema, Document} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface TripI extends Document {
    user: Schema.Types.ObjectId;
    customer: [Schema.Types.ObjectId];
    from: string;
    to: string;
    car: string;
    date: string;
    tripTime: string;
    maxTwoSeatsAtBack: boolean;
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
        tripTime: {
            type: String,
            requried: true,
        },
        maxTwoSeatsAtBack: {
            type: Boolean,
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
        date: {
            type: String,
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

TripSchema.index({ from: "text", to: "text" });
TripSchema.plugin(mongooseAggregatePaginate);

const Trip = mongoose.model<TripI> ("Trip", TripSchema);
export default Trip;