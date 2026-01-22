import express from "express";
import {
  deleteConcert,
  getSavedConcerts,
  saveConcerts,
  getConcert,
  getPublicProfile,
  getAdditionalArtists,
  getTopAlbums,
} from "../controllers/concertController.js";
import { checkJwt } from "../middleware/auth.js";

const router = express.Router();

// GET all saved concerts
router.get("/user/saved", checkJwt, getSavedConcerts);

// GET a single concert from API
router.get("/", getConcert);

// GET top albums for an artist from Last.fm
router.get("/topalbums", getTopAlbums);

// GET additional artists by venue and date
router.get("/additional/:venueId/:eventDate", getAdditionalArtists);

// POST a new concert to DB (requires auth)
router.post("/", checkJwt, saveConcerts);

// DELETE a concert (must come after more specific routes to avoid conflicts)
router.delete("/:artistId/:concertId", checkJwt, deleteConcert);

// GET public profile (no auth required) - this should come last
router.get("/profile/:username", getPublicProfile);

export default router;
