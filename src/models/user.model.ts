import mongoose, {Schema, Document} from "mongoose";
import { Rating, RatingSchema } from "./rating.model.js";

export interface ProfileImage extends Document {
    url: string,
    public_id: String,
};

export const ProfileImageSchema : Schema<ProfileImage> = new Schema(
    {
        url: {
            type: String,
            required: true,
        },
        public_id: {
            type: String,
            required: true,
        }
    }
);
export interface User extends Document {
    firstName: string;
    lastName: string;
    birthdate: string;
    email: string;
    image: ProfileImage;
    password: string;
    about: string;
    ratings: Rating[];
    prefrence: number[];
    isEmailVerified: boolean;
    isNumberVerified: boolean;
    verirfyEmailToken: string;
    verirfyEmailTokenExpiry: Date;
    verirfyNumberToken: string;
    verirfyNumberTokenExpiry: Date;
    forgetPasswordToken: string;
    forgetPasswordTokenExpiry: Date;
};

export const UserSchema : Schema<User> = new Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        image: ProfileImageSchema,
        birthdate: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            index: true,
            required: true,
            match: [/.+\@.+\..+/, "Please use valid email"]
        },
        password: {
            type: String,
            required: [true, "Password is require"],
        },
        about: {
            type: String,
        },
        prefrence: [Number],
        ratings: [
            RatingSchema,
        ],
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isNumberVerified: {
            type: Boolean,
            default: false,
        },
        verirfyEmailToken: String,
        verirfyEmailTokenExpiry: Date,
        verirfyNumberToken: String,
        verirfyNumberTokenExpiry: Date,
        forgetPasswordToken: String,
        forgetPasswordTokenExpiry: Date,
    }, { timestamps: true }
);

const UserModel = mongoose.model<User> ("Users", UserSchema);
export default UserModel;