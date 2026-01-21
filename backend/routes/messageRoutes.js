import express from "express";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
} from "../controllers/messageController.js";
import { checkBlockedInConversation } from "../middleware/checkBlocked.js";
import { checkJwt } from "../middleware/auth.js";

const router = express.Router();

// Get messages in a conversation (with pagination)
router.get("/:conversationId", checkJwt, getMessages);

// Send a message in a conversation
router.post("/:conversationId", checkBlockedInConversation, sendMessage);

// Mark all messages in a conversation as read
router.put("/:conversationId/read", markMessagesAsRead);

// Delete a specific message
router.delete("/:messageId", deleteMessage);

export default router;
