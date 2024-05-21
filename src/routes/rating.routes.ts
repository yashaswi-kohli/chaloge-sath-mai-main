import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middlewares";
import { deleteRating, getAllRatings, giveARating, updateRating } from "../controllers/rating.controller";

const router = Router();

router.use(verifyJwtToken);
router.route("/:userId").get(getAllRatings);
router.route("/driverId").post(giveARating);
router.route("/:ratingId").delete(deleteRating).patch(updateRating);

export default router;