import mongoose, {Schema, Document} from "mongoose";

export interface ConclustionI extends Document {
    conclusion: string;
    tripId: Schema.Types.ObjectId;
};

export const ConclustionSchema : Schema<ConclustionI> = new Schema({
    conclusion: {
        type: String,
        reqired: true,
    },
    tripId: {
        type: Schema.Types.ObjectId,
        ref: "Trip",
    }
});

const Conclusion = mongoose.model<ConclustionI> ("TripConclusion", ConclustionSchema);

export default Conclusion;