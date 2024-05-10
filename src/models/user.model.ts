import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
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
    phoneNumber: string;
    image: ProfileImage;
    password: string;
    about: string;
    ratings: Rating[];
    prefrence: number[];
    refreshToken: string;
    isEmailVerified: boolean;
    isNumberVerified: boolean;
    verirfyEmailToken: string;
    verirfyEmailTokenExpiry: Date;
    verirfyNumberToken: string;
    verirfyNumberTokenExpiry: Date;
    forgetPasswordToken: string;
    forgetPasswordTokenExpiry: Date;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
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
        phoneNumber: {
            type: String,
            unique: true,
            index: true,
            required: true,
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
        },
        isNumberVerified: {
            type: Boolean,
        },
        refreshToken: {
            type: String,
        },
        verirfyEmailToken: String,
        verirfyEmailTokenExpiry: Date,
        verirfyNumberToken: String,
        verirfyNumberTokenExpiry: Date,
        forgetPasswordToken: String,
        forgetPasswordTokenExpiry: Date,
    }, { timestamps: true }
);

UserSchema.pre<User>("save", async function (next) 
{
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
  
UserSchema.methods.isPasswordCorrect = async function (this: User, password: string) {
    return await bcrypt.compare(password, this.password);
};
  
UserSchema.methods.generateAccessToken = function (this: User) {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
  
UserSchema.methods.generateRefreshToken = function (this: User) {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
  };

const UserModel = mongoose.model<User> ("Users", UserSchema);

export default UserModel;
