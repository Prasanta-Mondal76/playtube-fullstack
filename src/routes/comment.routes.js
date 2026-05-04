import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
  addComment,
  updateComment,
  deleteComment,
  getVideoComments
} from "../controller/comment.controller.js"

const router = Router()

router.get("/get/:videoId", getVideoComments) // public

router.use(verifyJWT)

router.post("/add/:videoId", addComment)
router.patch("/update/:commentId", updateComment)
router.delete("/delete/:commentId", deleteComment)


export default router