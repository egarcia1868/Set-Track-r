import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("./.env") });

import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import concertRoutes from "./routes/concertRoutes.js";
import cookieParser from "cookie-parser";

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

app.use("/api/concerts", concertRoutes);

// Add a simple test route for backend
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

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
