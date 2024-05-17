import mongoose, {Schema, Document} from "mongoose";

export interface RatingI extends Document {
    driver: Schema.Types.ObjectId;
    customer: Schema.Types.ObjectId;
    comment: string;
    rating: number;
};

export const RatingSchema : Schema<RatingI> = new Schema(
    {
        driver: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        comment: String,
        rating: {
            type: Number,
            require: true,
            min: 0,
            max: 5,
        }
    },
    {
        timestamps: true
    },
);

const Rating = mongoose.model<RatingI> ("Rating", RatingSchema);
export default Rating;