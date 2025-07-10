import express from "express";
import {
  // getSavedConcert,
  deleteConcert,
  getSavedConcerts,
  saveConcerts,
  getConcert,
} from "../controllers/concertController.js";
import getCheckJwt from "../middleware/auth.js";

const checkJwt = getCheckJwt();
const router = express.Router();

// GET all saved concerts
router.get("/user/saved", checkJwt, getSavedConcerts);

// UNSURE WHY I CREATED THIS, BUT IT'S NOT USED
// GET a single concert from DB
// router.get("/:id", getSavedConcert);

// GET a single concert from API
// router.get("/:artistName/:date", getConcert);
router.get("/", getConcert);

// POST a new concert to DB
router.post("/", saveConcerts);

// DELETE a concert
router.delete("/:artistId/:concertId", checkJwt, deleteConcert);

// CURRENTLY UNUSED.  WOULD NEED TO BE REWORKED TO WORK WITH NEW CONCERT DATA
// PLAN IS TO USE THIS FOR EDITING A CONCERT (e.g. GOT TO CONCERT LATE OR LEFT EARLY)
// UPDATE a concert
// router.patch("/:id", (req, res) => {
//   res.json({ mssg: "UPDATE a concert" });
// });

export default router;
