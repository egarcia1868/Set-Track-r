import User from "../models/UserModel.js";
import Conversation from "../models/ConversationModel.js";

/**
 * Get list of blocked users for current user
 * GET /api/blocks
 */
export const getBlockedUsers = async (req, res) => {
  try {
    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub })
      .populate("blockedUsers.userId", "profile.displayName profile.name")
      .lean();

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(currentUser.blockedUsers || []);
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res.status(500).json({ message: "Server error fetching blocked users" });
  }
};

/**
 * Block a user
 * POST /api/blocks/:userId
 */
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to block self
    if (currentUser._id.equals(userId)) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    // Check if user exists
    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({ message: "User to block not found" });
    }

    // Check if already blocked
    const alreadyBlocked = currentUser.blockedUsers.some((blocked) =>
      blocked.userId.equals(userId),
    );

    if (alreadyBlocked) {
      return res.status(400).json({ message: "User is already blocked" });
    }

    // Add to blocked list
    currentUser.blockedUsers.push({
      userId: userToBlock._id,
      blockedAt: new Date(),
    });

    await currentUser.save();

    // Optionally: Find and mark any existing conversations as blocked
    // or delete them (depending on your UX preference)
    const conversations = await Conversation.find({
      "participants.userId": { $all: [currentUser._id, userToBlock._id] },
    });

    // You could delete conversations here if desired:
    // await Conversation.deleteMany({ _id: { $in: conversations.map(c => c._id) } });

    res.json({
      message: "User blocked successfully",
      blockedUser: {
        userId: userToBlock._id,
        displayName: userToBlock.profile.displayName,
        blockedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Server error blocking user" });
  }
};

/**
 * Unblock a user
 * DELETE /api/blocks/:userId
 */
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is blocked
    const blockedIndex = currentUser.blockedUsers.findIndex((blocked) =>
      blocked.userId.equals(userId),
    );

    if (blockedIndex === -1) {
      return res.status(400).json({ message: "User is not blocked" });
    }

    // Remove from blocked list
    currentUser.blockedUsers.splice(blockedIndex, 1);
    await currentUser.save();

    res.json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "Server error unblocking user" });
  }
};

/**
 * Check if a user is blocked
 * GET /api/blocks/check/:userId
 */
export const checkBlockStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findOne({ auth0Id: req.auth.payload.sub });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current user blocked the other user
    const hasBlockedOther = currentUser.blockedUsers.some((blocked) =>
      blocked.userId.equals(userId),
    );

    // Check if other user blocked current user
    const isBlockedByOther = otherUser.blockedUsers.some((blocked) =>
      blocked.userId.equals(currentUser._id),
    );

    res.json({
      hasBlockedOther,
      isBlockedByOther,
      canMessage: !hasBlockedOther && !isBlockedByOther,
    });
  } catch (error) {
    console.error("Error checking block status:", error);
    res.status(500).json({ message: "Server error checking block status" });
  }
};
