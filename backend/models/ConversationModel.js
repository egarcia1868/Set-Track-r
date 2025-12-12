import mongoose from "mongoose";

const { Schema, model } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        displayName: {
          type: String,
          required: true,
        },
      },
    ],
    lastMessage: {
      text: String,
      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      sentAt: Date,
    },
    // Track unread message count per user
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    // Track which users have archived this conversation
    archivedBy: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true },
);

// Index for efficient participant lookups
conversationSchema.index({ "participants.userId": 1 });

// Method to check if a user is a participant
conversationSchema.methods.hasParticipant = function (userId) {
  return this.participants.some((p) => p.userId.equals(userId));
};

// Static method to find conversation between specific users
conversationSchema.statics.findBetweenUsers = async function (userIds) {
  return this.findOne({
    "participants.userId": { $all: userIds },
    "participants.2": { $exists: false }, // Ensure only 2 participants
  });
};

export default model("Conversation", conversationSchema);
