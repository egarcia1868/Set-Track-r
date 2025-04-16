import express from "express";
import {
  signupPost,
  loginGet,
  loginPost,
  signupGet,
} from "../controllers/authController.js";

const router = express.Router();

router.get("/signup", signupGet);
router.post("/signup", signupPost);

router.get("/login", loginGet);
router.post("/login", loginPost);

export default router;
