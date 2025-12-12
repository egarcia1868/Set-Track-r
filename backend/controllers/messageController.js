import Message from "../models/MessageModel.js";
import Conversation from "../models/ConversationModel.js";
import User from "../models/UserModel.js";

/**
 * Get all messages in a conversation with pagination
 * GET /api/messages/:conversationId?limit=50&before=messageId
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // Message ID to paginate from

    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.hasParticipant(currentUser._id)) {
      return res
        .status(403)
        .json({ message: "You are not part of this conversation" });
    }

    // Build query for pagination
    const query = { conversationId };
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    // Fetch messages sorted by most recent first
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "profile.displayName")
      .lean();

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

/**
 * Send a new message in a conversation
 * POST /api/messages/:conversationId
 * Body: { text: string }
 */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Message text is required" });
    }

    // Use pre-loaded data from checkBlockedInConversation middleware
    const currentUser = req.currentUser;
    const conversation = req.conversation;

    // Create new message
    const newMessage = new Message({
      conversationId,
      sender: currentUser._id,
      text: text.trim(),
      readBy: [{ userId: currentUser._id, readAt: new Date() }], // Sender has read it
    });

    await newMessage.save();

    // Update conversation's last message
    conversation.lastMessage = {
      text: text.trim(),
      sender: currentUser._id,
      sentAt: new Date(),
    };

    // Increment unread count for all other participants
    const unreadMap = conversation.unreadCount || new Map();
    conversation.participants.forEach((participant) => {
      if (!participant.userId.equals(currentUser._id)) {
        const currentCount = unreadMap.get(participant.userId.toString()) || 0;
        unreadMap.set(participant.userId.toString(), currentCount + 1);
      }
    });
    conversation.unreadCount = unreadMap;

    // Unarchive conversation for all recipients who have it archived
    const archivedByMap = conversation.archivedBy || new Map();
    conversation.participants.forEach((participant) => {
      if (!participant.userId.equals(currentUser._id)) {
        // If this participant has archived the conversation, unarchive it
        if (archivedByMap.get(participant.userId.toString())) {
          archivedByMap.set(participant.userId.toString(), false);
        }
      }
    });
    conversation.archivedBy = archivedByMap;

    await conversation.save();

    // Populate sender info before returning
    await newMessage.populate("sender", "profile.displayName");

    // Emit socket event to notify all participants
    const io = req.app.get("io");
    if (io) {
      const messageData = {
        ...newMessage.toObject(),
        conversationId: conversationId.toString(),
      };

      // Emit to conversation room (for users with chat open)
      io.to(conversationId.toString()).emit("message:new", messageData);

      // Also emit directly to each participant's personal socket (for global notifications)
      const connectedUsers = req.app.get("connectedUsers");
      if (connectedUsers) {
        conversation.participants.forEach((participant) => {
          // Don't send to the sender
          if (!participant.userId.equals(currentUser._id)) {
            const recipientSocketId = connectedUsers.get(
              participant.userId.toString()
            );
            if (recipientSocketId) {
              io.to(recipientSocketId).emit("message:new", messageData);
            }
          }
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error sending message" });
  }
};

/**
 * Mark messages as read in a conversation
 * PUT /api/messages/:conversationId/read
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.hasParticipant(currentUser._id)) {
      return res
        .status(403)
        .json({ message: "You are not part of this conversation" });
    }

    // Find all unread messages in this conversation
    const unreadMessages = await Message.find({
      conversationId,
      "readBy.userId": { $ne: currentUser._id },
    });

    // Mark each as read
    const markReadPromises = unreadMessages.map((msg) =>
      msg.markAsRead(currentUser._id),
    );
    await Promise.all(markReadPromises);

    // Reset unread count for current user
    const unreadMap = conversation.unreadCount || new Map();
    unreadMap.set(currentUser._id.toString(), 0);
    conversation.unreadCount = unreadMap;
    await conversation.save();

    res.json({
      message: "Messages marked as read",
      count: unreadMessages.length,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Server error marking messages as read" });
  }
};

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only the sender can delete their message
    if (!message.sender.equals(currentUser._id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    // If this was the last message in the conversation, update conversation
    const conversation = await Conversation.findById(message.conversationId);
    if (
      conversation &&
      conversation.lastMessage?.sender?.equals(currentUser._id)
    ) {
      // Find the new last message
      const newLastMessage = await Message.findOne({
        conversationId: message.conversationId,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (newLastMessage) {
        conversation.lastMessage = {
          text: newLastMessage.text,
          sender: newLastMessage.sender,
          sentAt: newLastMessage.createdAt,
        };
      } else {
        conversation.lastMessage = undefined;
      }

      await conversation.save();
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error deleting message" });
  }
};
