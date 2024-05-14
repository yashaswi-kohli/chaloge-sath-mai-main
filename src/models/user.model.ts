import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import {Trip, TripSchema} from "./trip.model.ts"
import mongoose, {Schema, Document} from "mongoose";

export interface User extends Document {
    firstName: string;
    lastName: string;
    birthdate: string;
    email: string;
    phoneNumber: string;
    avatar: string;
    public_id: string;
    password: string;
    about: string;
    nRating: number;
    ratingS: number;
    prefrence: number[];
    refreshToken: string;
    tripsHistory: Trip[];
    isEmailVerified: boolean;
    isNumberVerified: boolean;
    verirfyEmailToken: string;
    verirfyEmailTokenExpiry: number;
    verirfyNumberToken: string;
    verirfyNumberTokenExpiry: number;
    forgetPasswordToken: string;
    forgetPasswordTokenExpiry: number;
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
        avatar: {
            type: String,
            required: true,
        },
        public_id: {
            type: String,
            required: false,
        },
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
        ratingS: {
            type: Number,
            default: 0,
        },
        nRating: {
            type: Number,
            default: 0,
        },
        about: String,
        prefrence: [Number],
        tripsHistory: [TripSchema],

        refreshToken: String,
        isEmailVerified: Boolean,
        isNumberVerified: Boolean,

        verirfyEmailToken: String,
        verirfyEmailTokenExpiry: Number,

        verirfyNumberToken: String,
        verirfyNumberTokenExpiry: Number,
        
        forgetPasswordToken: String,
        forgetPasswordTokenExpiry: Number,
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
