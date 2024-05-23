import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middlewares";
import { bookYourTrip, cancelOthersTrip, cancelYourTrip, createTrip, getATrip, updateTrip } from "../controllers/trip.controller";

const router = Router();
router.use(verifyJwtToken);

router.route("/publish").post(createTrip);
router.route("/:tripId/:bookingId").delete(cancelOthersTrip);

router.route("/:tripId")
    .get(getATrip)
    .post(bookYourTrip)
    .delete(cancelYourTrip)
    .patch(updateTrip)

export default router;