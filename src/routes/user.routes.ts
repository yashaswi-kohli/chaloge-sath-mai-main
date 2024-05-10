import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.ts";
import { registerUser } from "../controllers/user.controller.ts";

const router = Router();

router.route("/regester").post(
    upload.fields([
      {
        name: "avatar",
        maxCount: 1,
      },
    ]),
    registerUser
);

router.route("/login");
router.route("/logout");
router.route("/show-user");
router.route("/update-user");
router.route("/update-avatar");
router.route("/change-password");
router.route("/forgot-password");



export default router;