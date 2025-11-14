import express from "express";
import jwt from "jsonwebtoken";
import {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getFollowStatus,
  searchUsers,
} from "../controllers/concertController.js";

// Simple middleware to extract user ID from Auth0 token
const checkJwt = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    // For encrypted JWE tokens, we need to get the user info from Auth0's userinfo endpoint
    const parts = token.split(".");
    if (parts.length === 5) {
      // JWE format
      try {
        // Make request to Auth0 userinfo endpoint to get user details
        const userinfoUrl = `https://${process.env.AUTH0_DOMAIN}/userinfo`;
        const response = await fetch(userinfoUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userInfo = await response.json();
          req.auth = { payload: { sub: userInfo.sub } };
        } else {
          return res
            .status(401)
            .json({ error: "Invalid token - could not get user info" });
        }
      } catch (e) {
        console.error("Error getting user info:", e);
        return res.status(401).json({ error: "Invalid token format" });
      }
    } else {
      // Try regular JWT decode
      const decoded = jwt.decode(token);
      if (decoded && decoded.sub) {
        req.auth = { payload: { sub: decoded.sub } };
      } else {
        return res.status(401).json({ error: "Invalid token format" });
      }
    }
    next();
  } catch (error) {
    console.error("Token processing error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

const router = express.Router();

// User profile routes
router.get("/profile", checkJwt, getUserProfile);
router.put("/profile", checkJwt, updateProfile);

// Following/followers routes
router.post("/follow/:displayName", checkJwt, followUser);
router.delete("/follow/:displayName", checkJwt, unfollowUser);
router.get("/following", checkJwt, getFollowing);
router.get("/followers/:displayName?", checkJwt, getFollowers); // Requires auth
router.get("/follow-status/:displayName", checkJwt, getFollowStatus);

// User search
router.get("/search", searchUsers);

export default router;
