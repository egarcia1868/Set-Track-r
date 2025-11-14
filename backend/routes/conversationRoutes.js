import express from "express";
import {
  getConversations,
  createOrGetConversation,
  getConversationById,
  deleteConversation,
} from "../controllers/conversationController.js";
import { checkBlocked } from "../middleware/checkBlocked.js";

const router = express.Router();

// Get all conversations for current user
router.get("/", getConversations);

// Create or get existing conversation with another user
router.post("/", checkBlocked, createOrGetConversation);

// Get specific conversation by ID
router.get("/:conversationId", getConversationById);

// Delete a conversation
router.delete("/:conversationId", deleteConversation);

export default router;
