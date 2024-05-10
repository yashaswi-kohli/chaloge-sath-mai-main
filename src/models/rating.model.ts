import { UserSchema, User } from "./user.model.js";
import mongoose, {Schema, Document} from "mongoose";

export interface Rating extends Document {
    user: User;
    sender: User;
    comment: string;
    rating: number;
};

export const RatingSchema : Schema<Rating> = new Schema(
    {
        user: UserSchema,
        sender: UserSchema,
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

const RatingModel = mongoose.model<Rating> ("Ratings", RatingSchema);
export default RatingModel;