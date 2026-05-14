import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 5000
  },

  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
    index: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  likes:{
    type: Number,
    default: 0
  },
}, { timestamps: true })


commentSchema.plugin(mongooseAggregatePaginate)
commentSchema.index({
  video: 1,
  createdAt: -1,
  _id: -1
})

export const Comment = mongoose.model("Comment", commentSchema)