import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware"
import {
  getChannelStats,
  getChannelVideos,
} from "../controller/dashboard.controller"


const router = Router()

router.route("channel/:channelId").get(getChannelStats)
router.route("/channel/:channelId/all-videos").get(getChannelVideos)

export default router