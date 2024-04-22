import mongoose from "mongoose";
import { DB_NAME } from "../constants";

process.loadEnvFile();

async function connectDB() : Promise<void>  {
    try {
        const connection = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        console.log("Database connected successfully ", connection);
    } 
    catch (error) {
        console.log("MongoDB connection error: ", error);
        process.exit(1);
    }
}

export default connectDB;