import express from "express";
import jwt from "jsonwebtoken";
import {
  deleteConcert,
  getSavedConcerts,
  saveConcerts,
  getConcert,
  getPublicProfile,
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getPublicFollowers,
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
    const parts = token.split('.');
    if (parts.length === 5) { // JWE format
      try {
        // Make request to Auth0 userinfo endpoint to get user details
        console.log("Making userinfo request to:", `https://${process.env.AUTH0_DOMAIN}/userinfo`);
        const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log("Userinfo response status:", response.status);
        if (response.ok) {
          const userInfo = await response.json();
          console.log("User info received:", userInfo);
          req.auth = { payload: { sub: userInfo.sub } };
        } else {
          const errorText = await response.text();
          console.log("Userinfo error:", errorText);
          return res.status(401).json({ error: "Invalid token - could not get user info" });
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

// GET all saved concerts
router.get("/user/saved", checkJwt, getSavedConcerts);

// UNSURE WHY I CREATED THIS, BUT IT'S NOT USED
// GET a single concert from DB
// router.get("/:id", getSavedConcert);

// GET a single concert from API
router.get("/", getConcert);

// POST a new concert to DB
router.post("/", saveConcerts);

// GET current user's profile (must come before the parameterized route)
router.get("/profile", checkJwt, getUserProfile);

// UPDATE user profile
router.put("/profile", checkJwt, updateProfile);

// Follow/unfollow routes (must come before the parameterized routes)
router.post("/follow/:displayName", checkJwt, followUser);
router.delete("/follow/:displayName", checkJwt, unfollowUser);
router.get("/following", checkJwt, getFollowing);
router.get("/followers", checkJwt, getFollowers);
router.get("/follow-status/:displayName", checkJwt, getFollowStatus);
router.get("/search-users", checkJwt, searchUsers);

// DELETE a concert (must come after more specific routes to avoid conflicts)
router.delete("/:artistId/:concertId", checkJwt, deleteConcert);

// GET public profile (no auth required) - this should come last
router.get("/profile/:username", getPublicProfile);

// GET public followers (no auth required)
router.get("/profile/:displayName/followers", getPublicFollowers);

// CURRENTLY UNUSED.  WOULD NEED TO BE REWORKED TO WORK WITH NEW CONCERT DATA
// PLAN IS TO USE THIS FOR EDITING A CONCERT (e.g. GOT TO CONCERT LATE OR LEFT EARLY)
// UPDATE a concert
// router.patch("/:id", (req, res) => {
//   res.json({ mssg: "UPDATE a concert" });
// });

export default router;
