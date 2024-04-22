import app from "./app";
import connectDB from "./db/connectDB";

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
