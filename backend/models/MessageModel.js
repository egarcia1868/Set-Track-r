import mongoose from "mongoose";

const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true, // Critical for performance when querying messages
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

// Compound index for efficient message queries (sorted by time)
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Method to mark message as read by a user
messageSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some((r) => r.userId.equals(userId));
  if (!alreadyRead) {
    this.readBy.push({ userId, readAt: new Date() });
  }
  return this.save();
};

export default model("Message", messageSchema);
