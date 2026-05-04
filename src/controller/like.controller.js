import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"
import { Like } from "../models/like.model.js"
import { isValidObjectId } from "mongoose"


const toggleLike = async (Id, field, userId) => {

  const allowedFields = ["video", "comment", "tweet"]
  if (!allowedFields.includes(field)) {
    throw new ApiError(400, "Invalid like field type")
  }

  if (!isValidObjectId(Id)) {
    throw new ApiError(400, `Invalid ${field} ID.`)
  }

  const deletedLike = await Like.findOneAndDelete({
    [field]: Id,
    likedBy: userId
  })

  if (!deletedLike) {
    try {
      await Like.create({
        [field]: Id,
        likedBy: userId
      })

      return { liked: true }
    } catch (error) {
      if (error.code === 11000) {
        return { liked: true }
      }
      throw error
    }
  }

  return { liked: false }
}


const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthenticated.")
  }

  const result = await toggleLike(videoId, "video", req.user._id)

  return res.status(200).json(new ApiResponse(
    200,
    result,
    result.liked ? "Video liked." : "Video unliked."
  ))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthenticated.")
  }

  const result = await toggleLike(commentId, "comment", req.user._id)

  return res.status(200).json(new ApiResponse(
    200,
    result,
    result.liked ? "Comment liked." : "Comment unliked."
  ))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthenticated.")
  }

  const result = await toggleLike(tweetId, "tweet", req.user._id)

  return res.status(200).json(new ApiResponse(
    200,
    result,
    result.liked ? "Tweet liked." : "Tweet unliked."
  ))
})

const getLikedVideos = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthenticated.")
  }

  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 50)
  const skip = (page - 1) * limit

  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $ne: null }
  }).populate("video").select("video").skip(skip).limit(limit).sort({ createdAt: -1 })

  const videos = likedVideos.map(item => item.video)
  return res.status(200).json( new ApiResponse(200, {page: page, limit: limit, result: videos}, "Liked videos fetched.") )
})

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos
}