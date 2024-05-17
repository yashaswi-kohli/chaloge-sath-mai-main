import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { loginUser, registerUser } from "../controllers/user.controller";
// import { verifyJwtToken } from "../middlewares/auth.middlewares";

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

router.route("/login").post(loginUser);
// router.route("/logout").post(verifyJwtToken, logoutUser);
// router.route("/show-user");
// router.route("/update-user");
// router.route("/update-avatar");
// router.route("/change-password");
// router.route("/forgot-password");



export default router;