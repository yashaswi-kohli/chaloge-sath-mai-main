import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.ts";
import { logoutUser, registerUser } from "../controllers/user.controller.ts";
import { verifyJwtToken } from "../middlewares/auth.middlewares.ts";

const router = Router();

router.route("/register").post(
    upload.fields([
      {
        name: "avatar",
        maxCount: 1,
      },
    ]),
    registerUser
);

router.route("/login");
router.route("/logout").post(verifyJwtToken, logoutUser);
router.route("/show-user");
router.route("/update-user");
router.route("/update-avatar");
router.route("/change-password");
router.route("/forgot-password");



export default router;