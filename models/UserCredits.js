import mongoose from "mongoose";

const UserCreditsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  credits: {
    type: Number,
    default: 0,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  subscriptionId: {
    type: String,
    default: null,
  },
  subscriptionStatus: {
    type: String,
    enum: ["active", "canceled", "expired", null],
    default: null,
  },
  planStartDate: {
    type: Date,
    default: null,
  },
  planEndDate: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.models.UserCredits || mongoose.model("UserCredits", UserCreditsSchema);
