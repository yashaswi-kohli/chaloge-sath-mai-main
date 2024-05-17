import cors from "cors";
import express, {Express} from "express";
import cookieParser from "cookie-parser";

process.loadEnvFile();
const app : Express = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes";

app.use("/api/v1/users", userRouter);

export default app;