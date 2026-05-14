import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js"
import { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID.")

  const isOwner = req.user?._id?.equals(channelId)

  const channelDetails = await User.findById(channelId)
    .select(
      isOwner
        ? "-password -refreshToken -forgotPasswordToken -forgotPasswordExpiry"
        : "-password -refreshToken -forgotPasswordToken -forgotPasswordExpiry -watchHistory -totalVideos"
    )

  if (!channelDetails) throw new ApiError(404, "Channel not found.")

  return res.status(200).json(new ApiResponse(
    200,
    channelDetails,
    "Channel status fetched successfully."
  ))
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params

  if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID.")

  const isOwner = req.user?._id?.equals(channelId)

  const channelVideos = await Video.find(
    isOwner
      ? { owner: channelId }
      : { owner: channelId, isPublished: true }
  ).sort({ createdAt: -1 }).lean()

  return res.status(200).json(new ApiResponse(
    200,
    channelVideos,
    "Videos fetched successfully."
  ))
})

export {
  getChannelStats,
  getChannelVideos
}