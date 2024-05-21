import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import mongoose, {Schema, Document} from "mongoose";

export interface UserI extends Document {
    firstName: string;
    lastName: string;

    birthdate: string;
    email: string;
    number: string;

    avatar: string;
    public_id: string;

    password: string;
    about: string;
    nRating: number;
    ratingS: number;

    prefrence: number[];
    cancelledRides: number;
    ridesPublished: number;

    refreshToken: string;
    tripsArchive: Schema.Types.ObjectId[];

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

export const UserSchema : Schema<UserI> = new Schema(
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
        number: {
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
        prefrence: {
            type: [Number],
            default: [0, 0, 0, 0],
        },
        tripsArchive: [
            {
                type: Schema.Types.ObjectId,
                ref: "Conclusion",
            }
        ],

        about: String,
        refreshToken: String,
        
        cancelledRides: {
            type: Number,
            default: 0,
        },
        ridesPublished: {
            type: Number,
            default: 0,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isNumberVerified: {
            type: Boolean,
            default: false,
        },

        verirfyEmailToken: String,
        verirfyEmailTokenExpiry: Number,

        verirfyNumberToken: String,
        verirfyNumberTokenExpiry: Number,
        
        forgetPasswordToken: String,
        forgetPasswordTokenExpiry: Number,
    }, { timestamps: true }
);

UserSchema.pre<UserI>("save", async function (next) 
{
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
  
UserSchema.methods.isPasswordCorrect = async function (this: UserI, password: string) {
    return await bcrypt.compare(password, this.password);
};
  
UserSchema.methods.generateAccessToken = function (this: UserI) {
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
  
UserSchema.methods.generateRefreshToken = function (this: UserI) {
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

const User = mongoose.model<UserI> ("User", UserSchema);

export default User;
