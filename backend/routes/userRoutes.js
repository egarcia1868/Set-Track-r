import express from "express";
import {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getFollowStatus,
  searchUsers,
  getFeaturedUsers,
} from "../controllers/concertController.js";
import { checkJwt } from "../middleware/auth.js";

const router = express.Router();

// User profile routes
router.get("/profile", checkJwt, getUserProfile);
router.put("/profile", checkJwt, updateProfile);

// Following/followers routes
router.post("/follow/:displayName", checkJwt, followUser);
router.delete("/follow/:displayName", checkJwt, unfollowUser);
router.get("/following", checkJwt, getFollowing);
router.get("/followers/:displayName?", checkJwt, getFollowers);
router.get("/follow-status/:displayName", checkJwt, getFollowStatus);

// User search
router.get("/search", checkJwt, searchUsers);
router.get("/featured", checkJwt, getFeaturedUsers);

export default router;
