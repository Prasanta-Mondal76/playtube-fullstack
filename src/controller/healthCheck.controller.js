import { asyncHandler, ApiResponse } from "../utils/index.js";
import redisClient from "../db/redis.js"
import { v2 as cloudinary } from 'cloudinary';
import mongoose from "mongoose";


const healthCheck = asyncHandler(async (req, res) => {

  // redisClient.isReady | Return true if redis connected else return false.
  const start = Date.now()

  // Cloudinary responding or not
  const cloudinaryStatus = await cloudinary.api.ping()
  const cloudStats = cloudinaryStatus.status


  res.status(200).json(new ApiResponse(
    200,
    {
      //Redis Connection Check
      redis: await redisClient.ping() === "PONG" ? "Redis Connected." : "Redis Connection Error.",

      // Heap Memory Usage Check
      memoryUsage: process.memoryUsage().heapUsed,

      // Total uptime of the application
      uptime: `${Math.floor(process.uptime())} sec.`,

      // Check in which mode app running, development or production
      appRunningMode: process.env.NODE_ENV,

      // Checking DB status. DB is responding or not
      databaseStatus: await mongoose.connection.db.admin().ping(),

      cloudinary: cloudStats,

      responseTime: `${Date.now() - start} ms`,

    },
    "System Checked Successfully."
  ))
})

export { healthCheck }