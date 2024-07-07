import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJwtToken } from "../middlewares/auth.middlewares";

import { 
	getCurrentUser, getArchiveTrips,
	loginUser, logoutUser, registerUser, 
	updateUserAvatar, updateUserDetails,
	sendCodeForEmail, verifyCodeForEmail,
	sendCodeForNumber,verifyCodeForNumber,
	changePassword, sendCodeForForgetPassword, verifyCodeForForgetPassword,
	getUserById,
	refereshAccessToken,
} from "../controllers/user.controller";

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

router.route("/update-avatar").patch(
	verifyJwtToken,
    upload.fields([
		{ 
			name: "avatar", 
			maxCount: 1 
		}
	]),
  	updateUserAvatar
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwtToken, logoutUser);

router.route("/refresh-token").post(refereshAccessToken);
router.route("/show/:userId").patch(verifyJwtToken, getUserById);
router.route("/current-user").get(verifyJwtToken, getCurrentUser);

router.route("/trip-history").get(verifyJwtToken, getArchiveTrips);
router.route("/update-user").patch(verifyJwtToken, updateUserDetails);

router.route("/send-code/email").post(verifyJwtToken, sendCodeForEmail);
router.route("/verify-code/email").post(verifyJwtToken, verifyCodeForEmail);

router.route("/send-code/number").post(verifyJwtToken, sendCodeForNumber);
router.route("/verify-code/number").post(verifyJwtToken, verifyCodeForNumber);

router.route("/change-password").post(verifyJwtToken, changePassword);
router.route("/send-code/forgot-password").post(sendCodeForForgetPassword);
router.route("/verify-code/forgot-password").post(verifyCodeForForgetPassword);

export default router;