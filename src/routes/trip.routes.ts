import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJwtToken } from "../middlewares/auth.middlewares";
import { bookYourRide, showAllCustomers, cancelOthersTrip, cancelYourTrip, createTrip, getATrip, updateTrip, getOthersBooking } from "../controllers/trip.controller";

const router = Router();
router.use(verifyJwtToken);

router.route("/publish").post(createTrip);

router.route("/:tripId/travellers").get(showAllCustomers);
router.route("/:tripId/travellers/:bookingId")
    .get(getOthersBooking)
    .post(cancelOthersTrip);

router.route("/:tripId")
    .get(getATrip)
    .post(bookYourRide)
    .delete(cancelYourTrip)
    .patch(
        upload.fields([
        {
            name: "thumbnailFile",
            maxCount: 1,
        },
        ]),
        updateTrip
    )





export default router;