import cors from "cors";
import express, {Express} from "express";
import cookieParser from "cookie-parser";

process.loadEnvFile();
const app : Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));


import userRouter from "./routes/user.routes";
import tripRouter from "./routes/trip.routes";
import ratingRouter from "./routes/rating.routes";
import bookingRouter from "./routes/booking.routes";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/trips", tripRouter);
app.use("/api/v1/ratings", ratingRouter);
app.use("/api/v1/bookings", bookingRouter);

export default app;