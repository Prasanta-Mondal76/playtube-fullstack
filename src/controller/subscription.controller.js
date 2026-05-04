import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"
import { Subscription } from "../models/subscription.model.js"
import { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID.")

  if (!req.user?._id) throw new ApiError(401, "Unauthorized.")

  if (channelId === req.user._id.toString()) throw new ApiError(400, "You cannot subscribe to yourself.")

  const channelExists = await User.exists({ _id: channelId })
  if (!channelExists) throw new ApiError(404, "Channel not found")

  try {
    // Try to subscribe first
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId
    })

    return res.status(200).json(
      new ApiResponse(200, { subscribed: true }, "Subscribed.")
    )

  } catch (error) {
    // If already exists → unsubscribe
    if (error.code === 11000) {
      const deleted = await Subscription.findOneAndDelete({
        subscriber: req.user._id,
        channel: channelId
      })

      return res.status(200).json(
        new ApiResponse(
          200,
          { subscribed: deleted ? false : true },
          deleted ? "Unsubscribed." : "Already unsubscribed."
        )
      )
    }

    throw error
  }
})

// controller to return subscriber list of a channel
const getChannelSubscriberCount = asyncHandler(async (req, res) => {
  const { channelId } = req.params
  if (!isValidObjectId(channelId)) throw new ApiError(400, `Invalid channel ID.`)

  const channelExists = await User.exists({ _id: channelId })
  if (!channelExists) {
    throw new ApiError(404, "Channel not found")
  }

  const total = await Subscription.countDocuments({
    channel: channelId
  })

  return res.status(200).json(new ApiResponse(200, { totalSubscribers: total }, "Subscribers counted successfully."))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannelCount = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params
  if (!isValidObjectId(subscriberId)) throw new ApiError(400, `Invalid subscriber ID.`)
  if (!req.user?._id) throw new ApiError(401, "Unauthorized.")
  if (!req.user._id.equals(subscriberId)) throw new ApiError(403, "Forbidden.")
  const total = await Subscription.countDocuments({
    subscriber: subscriberId
  })

  return res.status(200).json(new ApiResponse(200, { totalSubscribed: total }, "Channels counted successfully."))
})

export {
  toggleSubscription,
  getChannelSubscriberCount,
  getSubscribedChannelCount
}