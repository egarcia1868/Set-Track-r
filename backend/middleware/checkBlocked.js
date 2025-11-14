import User from "../models/UserModel.js";

/**
 * Middleware to check if users have blocked each other
 * Prevents messaging between blocked users
 */
export const checkBlocked = async (req, res, next) => {
  try {
    // Get current user
    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the other user's ID from params or body
    const otherUserId = req.params.userId || req.body.recipientId;
    if (!otherUserId) {
      return res
        .status(400)
        .json({ message: "Recipient user ID is required" });
    }

    // Check if current user has blocked the other user
    const hasBlockedOther = currentUser.blockedUsers.some((blocked) =>
      blocked.userId.equals(otherUserId),
    );
    if (hasBlockedOther) {
      return res.status(403).json({
        message: "You have blocked this user",
        blocked: true,
        direction: "outgoing",
      });
    }

    // Check if other user has blocked current user
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: "Recipient user not found" });
    }

    const isBlockedByOther = otherUser.blockedUsers.some((blocked) =>
      blocked.userId.equals(currentUser._id),
    );
    if (isBlockedByOther) {
      return res.status(403).json({
        message: "This user has blocked you",
        blocked: true,
        direction: "incoming",
      });
    }

    // No blocks detected, attach user data to request for use in routes
    req.currentUser = currentUser;
    req.otherUser = otherUser;

    next();
  } catch (error) {
    console.error("Error checking blocked status:", error);
    res.status(500).json({ message: "Server error checking blocked status" });
  }
};

/**
 * Middleware to check if user is blocked in a conversation context
 * Use this when you already have a conversation ID
 */
export const checkBlockedInConversation = async (req, res, next) => {
  try {
    const Conversation = (
      await import("../models/ConversationModel.js")
    ).default;

    // Get current user
    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get conversation
    const conversationId = req.params.conversationId || req.body.conversationId;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if current user is a participant
    if (!conversation.hasParticipant(currentUser._id)) {
      return res
        .status(403)
        .json({ message: "You are not part of this conversation" });
    }

    // Get the other participant(s)
    const otherParticipants = conversation.participants.filter(
      (p) => !p.userId.equals(currentUser._id),
    );

    // Check if any blocks exist
    for (const participant of otherParticipants) {
      // Check if current user blocked this participant
      const hasBlockedOther = currentUser.blockedUsers.some((blocked) =>
        blocked.userId.equals(participant.userId),
      );
      if (hasBlockedOther) {
        return res.status(403).json({
          message: `You have blocked ${participant.displayName}`,
          blocked: true,
          direction: "outgoing",
        });
      }

      // Check if this participant blocked current user
      const otherUser = await User.findById(participant.userId);
      if (otherUser) {
        const isBlockedByOther = otherUser.blockedUsers.some((blocked) =>
          blocked.userId.equals(currentUser._id),
        );
        if (isBlockedByOther) {
          return res.status(403).json({
            message: `${participant.displayName} has blocked you`,
            blocked: true,
            direction: "incoming",
          });
        }
      }
    }

    // No blocks detected
    req.currentUser = currentUser;
    req.conversation = conversation;

    next();
  } catch (error) {
    console.error("Error checking blocked status in conversation:", error);
    res.status(500).json({ message: "Server error checking blocked status" });
  }
};
