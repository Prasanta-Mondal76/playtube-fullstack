import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"
import { Subscription } from "../models/subscription.model.js"
import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID.")
  if (!req.user?._id) throw new ApiError(401, "Unauthorized.")
  if (req.user._id.equals(channelId)) throw new ApiError(400, "You cannot subscribe to yourself.")

  const channelExists = await User.exists({ _id: channelId })
  if (!channelExists) throw new ApiError(404, "Channel not found")

  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    const deletedSubscription = await Subscription.findOneAndDelete({
      subscriber: req.user._id,
      channel: channelId
    }, { session })

    if (!deletedSubscription) {
      await Subscription.create(
        [
          {
            subscriber: req.user._id,
            channel: channelId
          }
        ],
        { session }
      )
      // Update channels total subscriber count
      await User.findByIdAndUpdate(
        channelId,
        {
          $inc: {
            totalSubscribers: 1
          }
        },
        { session }
      )
      // Update users total subscribed count
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: {
            totalSubscribedChannels: 1
          }
        },
        { session }
      )

      await session.commitTransaction()
      return res.status(201).json(
        new ApiResponse(201, { subscribed: true }, "Subscribed successfully.")
      )
    }

    await User.findByIdAndUpdate(
      channelId,
      {
        $inc: {
          totalSubscribers: -1
        }
      },
      { session }
    )
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          totalSubscribedChannels: -1
        }
      },
      { session }
    )
    await session.commitTransaction()
    return res.status(200).json(
      new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully.")
    )
  } catch (error) {
    await session.abortTransaction()

    // E11000 duplicate key error catching
    if (error.code === 11000) throw new ApiError(409, "Subscription already exists.")

    throw error
  }
  finally {
    await session.endSession()
  }

})

const getSubscriptionStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID.")
  if (!req.user?._id) {
    return res.status(200).json(new ApiResponse(
      200,
      {
        subscribed: false
      },
      "Guest User."
    ))
  }

  const subscribed = await Subscription.exists({
    subscriber: req.user._id,
    channel: channelId
  })

  return res.status(200).json(new ApiResponse(
    200,
    {
      subscribed: !!subscribed
    },
    "Subscription status fetched successfully."
  ))
})

export {
  toggleSubscription,
  getSubscriptionStats,
}