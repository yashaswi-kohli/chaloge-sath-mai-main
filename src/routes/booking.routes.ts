import { Router } from "express";
import { cancelYourBooking, getAllYourBookings, showBooking } from "../controllers/booking.controller";

const router = Router();
router.route("/show").get(showBooking);
router.route("/:userId").get(getAllYourBookings);
router.route("/:bookingId").delete(cancelYourBooking);

export default router;