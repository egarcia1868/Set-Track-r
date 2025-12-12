import Conversation from "../models/ConversationModel.js";
import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";

/**
 * Get all conversations for the current user
 * GET /api/conversations
 */
export const getConversations = async (req, res) => {
  try {
    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
      "participants.userId": currentUser._id,
    })
      .sort({ "lastMessage.sentAt": -1 }) // Most recent first
      .lean();

    // Filter out archived conversations and add unread count for current user
    const conversationsWithUnread = conversations
      .filter((conv) => {
        // Handle both Map and plain object formats for archivedBy
        const archivedByMap = conv.archivedBy instanceof Map
          ? conv.archivedBy
          : new Map(Object.entries(conv.archivedBy || {}));

        // Only include conversations not archived by this user
        return !archivedByMap.get(currentUser._id.toString());
      })
      .map((conv) => {
        // Handle both Map and plain object formats for unreadCount
        const unreadMap = conv.unreadCount instanceof Map
          ? conv.unreadCount
          : new Map(Object.entries(conv.unreadCount || {}));

        return {
          ...conv,
          unreadCount: unreadMap.get(currentUser._id.toString()) || 0,
        };
      });

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Server error fetching conversations" });
  }
};

/**
 * Get or create a conversation between current user and another user
 * POST /api/conversations
 * Body: { recipientId: ObjectId }
 */
export const createOrGetConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    // Use pre-loaded users from checkBlocked middleware
    const currentUser = req.currentUser;
    const otherUser = req.otherUser;

    // Check if conversation already exists between these two users
    const existingConversation = await Conversation.findBetweenUsers([
      currentUser._id,
      otherUser._id,
    ]);

    if (existingConversation) {
      // Unarchive the conversation for both users if it was archived
      let wasUpdated = false;

      if (existingConversation.archivedBy.get(currentUser._id.toString())) {
        existingConversation.archivedBy.set(currentUser._id.toString(), false);
        wasUpdated = true;
      }

      if (existingConversation.archivedBy.get(otherUser._id.toString())) {
        existingConversation.archivedBy.set(otherUser._id.toString(), false);
        wasUpdated = true;
      }

      if (wasUpdated) {
        await existingConversation.save();
      }

      return res.json(existingConversation);
    }

    // Create new conversation
    const newConversation = new Conversation({
      participants: [
        {
          userId: currentUser._id,
          displayName: currentUser.profile.displayName || "Anonymous",
        },
        {
          userId: otherUser._id,
          displayName: otherUser.profile.displayName || "Anonymous",
        },
      ],
      unreadCount: new Map([
        [currentUser._id.toString(), 0],
        [otherUser._id.toString(), 0],
      ]),
    });

    await newConversation.save();
    res.status(201).json(newConversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "Server error creating conversation" });
  }
};

/**
 * Get a specific conversation by ID
 * GET /api/conversations/:conversationId
 */
export const getConversationById = async (req, res) => {
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

    // Verify user is a participant
    if (!conversation.hasParticipant(currentUser._id)) {
      return res
        .status(403)
        .json({ message: "You are not part of this conversation" });
    }

    res.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Server error fetching conversation" });
  }
};

/**
 * Delete a conversation
 * DELETE /api/conversations/:conversationId
 */
export const deleteConversation = async (req, res) => {
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

    // Verify user is a participant
    if (!conversation.hasParticipant(currentUser._id)) {
      return res
        .status(403)
        .json({ message: "You are not part of this conversation" });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ message: "Server error deleting conversation" });
  }
};

/**
 * Archive a conversation (hide it from the list without deleting it)
 * PUT /api/conversations/:conversationId/archive
 */
export const archiveConversation = async (req, res) => {
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

    // Verify user is a participant
    if (!conversation.hasParticipant(currentUser._id)) {
      return res
        .status(403)
        .json({ message: "You are not part of this conversation" });
    }

    // Mark conversation as archived for this user
    conversation.archivedBy.set(currentUser._id.toString(), true);
    await conversation.save();

    res.json({ message: "Conversation archived successfully" });
  } catch (error) {
    console.error("Error archiving conversation:", error);
    res.status(500).json({ message: "Server error archiving conversation" });
  }
};
