import app from "./app";
import cron from "node-cron";
import connectDB from "./db/connectDB";
import { checkTripsWhichAreToBeArchived } from "./controllers/trip.controller";

process.loadEnvFile();
const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log("Server is running on port: ", PORT);
        })
    })
    .catch((error) => {
        console.log("faced error while connecting db, ", error);
    })


const time = "5 15 * * * *";
cron.schedule(time, checkTripsWhichAreToBeArchived);