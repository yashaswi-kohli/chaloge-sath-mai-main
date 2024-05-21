import { Router } from "express";
import { getAllYourBookings } from "../controllers/booking.controller";

const router = Router();
router.route("/:userId").get(getAllYourBookings);

export default router;