import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middlewares";
import { deleteRating, getAllRatings, giveARating, updateRating } from "../controllers/rating.controller";

const router = Router();

router.use(verifyJwtToken);
router.route("/r/add").post(giveARating);
router.route("/:userId").get(getAllRatings);
router.route("/r/:ratingId").delete(deleteRating).patch(updateRating);

export default router;