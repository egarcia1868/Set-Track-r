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
  getFeaturedUsers,
} from "../controllers/concertController.js";

// Cache for Auth0 userinfo responses to avoid rate limiting
const userInfoCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple middleware to extract user ID from Auth0 token
const checkJwt = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ error: "Authorization token required" });
    }

    // Try to decode the token locally first (works for both JWT and some JWE formats)
    const decoded = jwt.decode(token);

    if (decoded && decoded.sub) {
      // Successfully decoded locally
      console.log(`✅ Decoded token locally for: ${decoded.sub}`);
      req.auth = { payload: { sub: decoded.sub } };
    } else {
      // Token couldn't be decoded locally, check cache first
      const cached = userInfoCache.get(token);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`✅ Using cached user info for: ${cached.sub}`);
        req.auth = { payload: { sub: cached.sub } };
      } else {
        // Last resort: fetch from Auth0 (for encrypted JWE tokens)
        try {
          const userinfoUrl = `https://${process.env.AUTH0_DOMAIN}/userinfo`;
          console.log(`🔍 Fetching user info from Auth0 (token couldn't be decoded locally)`);
          const response = await fetch(userinfoUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(`🔍 Auth0 userinfo response status: ${response.status}`);
          if (response.ok) {
            const userInfo = await response.json();
            console.log(`✅ Got user info from Auth0 for: ${userInfo.sub}`);

            // Cache the result by token
            userInfoCache.set(token, {
              sub: userInfo.sub,
              timestamp: Date.now(),
            });

            // Clean up old cache entries periodically
            if (userInfoCache.size > 100) {
              const now = Date.now();
              for (const [key, value] of userInfoCache.entries()) {
                if (now - value.timestamp >= CACHE_TTL) {
                  userInfoCache.delete(key);
                }
              }
            }

            req.auth = { payload: { sub: userInfo.sub } };
          } else {
            const errorText = await response.text();
            console.error(`❌ Auth0 rejected token: ${response.status} - ${errorText}`);
            return res
              .status(401)
              .json({ error: "Invalid token - could not get user info" });
          }
        } catch (e) {
          console.error("❌ Error getting user info:", e);
          return res.status(401).json({ error: "Invalid token format" });
        }
      }
    }
    next();
  } catch (error) {
    console.error("❌ Token processing error:", error);
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
router.get("/search", checkJwt, searchUsers);
router.get("/featured", checkJwt, getFeaturedUsers);

export default router;
