import express from "express";
import {
  getBlockedUsers,
  blockUser,
  unblockUser,
  checkBlockStatus,
} from "../controllers/blockController.js";

const router = express.Router();

// Get all blocked users for current user
router.get("/", getBlockedUsers);

// Block a user
router.post("/:userId", blockUser);

// Unblock a user
router.delete("/:userId", unblockUser);

// Check block status with another user
router.get("/check/:userId", checkBlockStatus);

export default router;
