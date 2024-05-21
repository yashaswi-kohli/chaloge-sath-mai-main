import mongoose, {Schema, Document} from "mongoose";

export interface ConclustionI extends Document {
    archive: boolean;
    conclusion: string;
    tripId: Schema.Types.ObjectId;
    driverId: Schema.Types.ObjectId;
    bookingId: Schema.Types.ObjectId;
    travellerId: Schema.Types.ObjectId;
};

export const ConclustionSchema : Schema<ConclustionI> = new Schema({
    driverId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    travellerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    tripId: {
        type: Schema.Types.ObjectId,
        ref: "Trip",
    },
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
    },
    archive: {
        type: Boolean,
        default: false,
    },
    conclusion: {
        type: String,
    },
});

const Conclusion = mongoose.model<ConclustionI> ("Conclusion", ConclustionSchema);

export default Conclusion;