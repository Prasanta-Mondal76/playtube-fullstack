import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { 
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
 } from "../controller/tweet.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/tweet").post(createTweet)
router.route("/tweets").get(getUserTweets)
router.route("/tweets/:tweetId").patch(updateTweet)
router.route("/tweets/:tweetId").delete(deleteTweet)

export default router;