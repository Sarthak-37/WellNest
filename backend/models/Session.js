import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  youtube_url: {
    type: String,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },
  imageUrl: {
    type: String,
    default: ""
  },
  likes: {
    type: Number,
    min: 0,
    default: 0
  },
  // NEW: Array to store IDs of users who liked this session
  likedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User", // Assuming you have a 'User' model
    default: []
  },
},{
  timestamps: true // This will automatically add createdAt and updatedAt
});


const Session = mongoose.model("Session", SessionSchema);

export default Session;