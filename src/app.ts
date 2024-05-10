import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

process.loadEnvFile();
const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

import userRouter from "./routes/user.routes.ts";

app.use("/api/users", userRouter);

export default app;