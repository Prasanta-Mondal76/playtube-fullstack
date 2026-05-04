import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { 
  
} from "../controller/subscription.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/videos/:videoId").post(toggleVideoLike)
router.route("/tweets/:tweetId").post(toggleTweetLike)
router.route("/comments/:commentId").post(toggleCommentLike)
router.route("/videos").get(getLikedVideos)

export default router;