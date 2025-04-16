import express from "express";
import {
  getSavedConcert,
  deleteConcert,
  getSavedConcerts,
  saveConcert,
  getConcert,
} from "../controllers/concertController.js";

const router = express.Router();

// GET all saved concerts
router.get("/", getSavedConcerts);

// GET a single concert from DB
router.get("/:id", getSavedConcert);

// GET a single concert from API
router.get("/:artistName/:date", getConcert);

// POST a new concert to DB
router.post("/", saveConcert);

// DELETE a concert
router.delete("/:artistId/:concertId", deleteConcert);

// UPDATE a concert
router.patch("/:id", (req, res) => {
  res.json({ mssg: "UPDATE a concert" });
});

export default router;
