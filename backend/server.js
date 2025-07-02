import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("./.env") });
import { auth } from "express-oauth2-jwt-bearer";
import mongoose from "mongoose";
import checkJwt from "./middleware/auth.js";
import path from "path";
import cors from "cors";
import concertRoutes from "./routes/concertRoutes.js";
import cookieParser from "cookie-parser";
import ensureUserExists from "./middleware/ensureUserExists.js";

console.log("Working directory:", process.cwd());

const app = express();
const PORT = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV;

const corsOptions = {
  methods: ["GET", "POST", "DELETE", "UPDATE"],
  credentials: true,
};

if (nodeEnv === "production") {
  // Allow only the frontend URL when in production
  corsOptions.origin = "https://set-trackr.onrender.com";
} else {
  // Allow local frontend to access the backend during development
  corsOptions.origin = "http://localhost:3000"; // Update this if your local frontend runs on a different port
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// app.use(
// const requireAuth = auth({
//   audience: process.env.AUTH0_AUDIENCE,
//   issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
// })
// );

app.use("/api/concerts", concertRoutes);

// Add a simple test route for backend
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/api/protected", checkJwt, ensureUserExists, (req, res) => {
  res.json({ message: "You accessed a protected route!", user: req.auth });
});


// app.get("/set-cookies", (req, res) => {
//   // res.setHeader('Set-Cookie', 'newUser=true');
//   res.cookie("newUser", false);
//   res.cookie("isEmployee", true, {
//     maxAge: 1000 * 60 * 60 * 24,
//     httpOnly: nodeEnv === "production" ? true : false,
//   });

//   res.send("you got the cookies!");
// });

// app.get("/read-cookies", (req, res) => {
//   const cookies = req.cookies;

//   console.log("cookies: ", cookies.newUser);
//   res.json(cookies);
// });

//connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // listen for requests
    app.listen(PORT, () => {
      console.log("listening on port", PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });
