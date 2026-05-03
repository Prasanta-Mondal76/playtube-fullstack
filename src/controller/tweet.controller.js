import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"
import { Tweet } from "../models/tweet.model.js"
import mongoose from "mongoose"

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body

  if (!req.user?._id) throw new ApiError(401, "Unauthorized. Please login first.")
  if (!content?.trim()) throw new ApiError(400, "Tweet content is required.")

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id
  })

  return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully."))
})

const getUserTweets = asyncHandler(async (req, res) => {

  let { limit = 10, sortBy = "createdAt", sortType = "asc", lastValue, lastId } = req.query

  if (!req.user?._id) throw new ApiError(401, "Unauthorized. Please login first.")
  const filter = { owner: req.user._id }

  limit = Math.min(50, Math.max(1, parseInt(limit) || 10))
  sortType = sortType === "asc" ? 1 : -1;
  const allowedFields = ["content", "updatedAt", "createdAt"];
  if (!allowedFields.includes(sortBy)) {
    sortBy = "createdAt";
  }

  let parsedLastId = null
  if (lastId && mongoose.Types.ObjectId.isValid(lastId)) parsedLastId = new mongoose.Types.ObjectId(lastId)

  if ((sortBy === "createdAt" || sortBy === "updatedAt") && lastValue) {
    const date = new Date(lastValue)
    if (!isNaN(date)) lastValue = date
  }

  if (lastValue && parsedLastId) {
    const operator = sortType === 1 ? "$gt" : "$lt"

    filter.$or = [
      { [sortBy]: { [operator]: lastValue } },
      {
        [sortBy]: lastValue,
        _id: { [operator]: parsedLastId }
      }
    ]
  }

  const tweets = await Tweet.find(filter).sort({ [sortBy]: sortType, _id: sortType }).limit(limit)

  return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully."))
})

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!req.user?._id) throw new ApiError(401, "Unauthorized. Please login first.")
  if (!mongoose.Types.ObjectId.isValid(tweetId)) throw new ApiError(400, "Invalid tweet ID.")
  if (!content?.trim()) throw new ApiError(400, "Tweet content is required.")

  const tweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: req.user._id
    },
    {
      $set: {
        content: content.trim()
      }
    },
    {
      returnDocument: 'after',
      runValidators: true
    }
  )
  if (!tweet) throw new ApiError(404, "Tweet not found")

  return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully."))
})

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!req.user?._id) throw new ApiError(401, "Unauthorized. Please login first.")
  if (!mongoose.Types.ObjectId.isValid(tweetId)) throw new ApiError(400, "Invalid tweet ID.")

  const tweet = await Tweet.findOneAndDelete(
    {
      _id: tweetId,
      owner: req.user._id
    }
  )
  if (!tweet) throw new ApiError(404, "Tweet not found")

  return res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted successfully."))
})

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
}
