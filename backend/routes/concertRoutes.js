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
} from "../controllers/concertController.js";

// Temporary auth middleware to decode JWT tokens without verification
// TODO: Replace with proper Auth0 JWT verification once configuration is resolved
const checkJwt = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.sub) {
        req.auth = { payload: { sub: decoded.sub } };
      } else {
        return res.status(401).json({ error: "Invalid token format" });
      }
    } else {
      return res.status(401).json({ error: "Authorization token required" });
    }
    next();
  } catch (error) {
    console.error("Error decoding token:", error);
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

// DELETE a concert
router.delete("/:artistId/:concertId", checkJwt, deleteConcert);

// GET current user's profile (must come before the parameterized route)
router.get("/profile", checkJwt, getUserProfile);

// UPDATE user profile
router.put("/profile", checkJwt, updateProfile);

// GET public profile (no auth required) - this should come last
router.get("/profile/:shareableId", getPublicProfile);

// CURRENTLY UNUSED.  WOULD NEED TO BE REWORKED TO WORK WITH NEW CONCERT DATA
// PLAN IS TO USE THIS FOR EDITING A CONCERT (e.g. GOT TO CONCERT LATE OR LEFT EARLY)
// UPDATE a concert
// router.patch("/:id", (req, res) => {
//   res.json({ mssg: "UPDATE a concert" });
// });

export default router;
