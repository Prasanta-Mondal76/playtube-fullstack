import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"
import { Like } from "../models/like.model.js"
import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"


const toggleLike = async (modelId, fieldName, userId, model) => {

  const allowedFields = ["video", "comment", "tweet"]
  if (!allowedFields.includes(fieldName)) throw new ApiError(400, "Invalid like field type")

  if (!isValidObjectId(modelId)) throw new ApiError(400, `Invalid ${fieldName} ID.`)


  const session = await mongoose.startSession()
  let existingDocument;
  try {
    session.startTransaction()

    existingDocument = await model.findById(modelId, null, {session})
    if (!existingDocument) throw new ApiError(404, `${fieldName} not found`)
    // Try to delete first
    const deletedLike = await Like.findOneAndDelete({
      [fieldName]: modelId,
      likedBy: userId
    }, { session })

    //If nothing found in deletedLike then create a new like.
    if (!deletedLike) {
      await Like.create(
        [{
          [fieldName]: modelId,
          likedBy: userId
        }],
        { session })

      const result = await model.findByIdAndUpdate(
        modelId,
        {
          $inc: {
            likes: 1
          }
        },
        {
          returnDocument: "after",
          session
        }
      )

      await session.commitTransaction()
      return { liked: true, totalLikes: result.likes }
    }

    const result = await model.findByIdAndUpdate(
      modelId,
      {
        $inc: {
          likes: -1
        }
      },
      {
        returnDocument: "after",
        session
      }
    )

    await session.commitTransaction()
    return { liked: false, totalLikes: result.likes }
  }
  catch (error) {
    await session.abortTransaction()
    if (error.code === 11000) {
      return { liked: true, totalLikes: existingDocument.likes + 1 }
    }
    throw error
  }
  finally {
    await session.endSession()
  }
}


const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthenticated.")
  }

  const result = await toggleLike(videoId, "video", req.user._id, Video)

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

  const result = await toggleLike(commentId, "comment", req.user._id, Comment)

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

  const result = await toggleLike(tweetId, "tweet", req.user._id, Tweet)

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
    video: { $ne: null },
    likedBy: req.user._id
  })
    .populate("video", "title thumbnail views duration")
    .select("video")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean()

  const videos = likedVideos.map(item => item.video).filter(Boolean)
  return res.status(200).json(new ApiResponse(200, { page: page, limit: limit, result: videos }, "Liked videos fetched."))
})

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos
}