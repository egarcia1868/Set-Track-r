import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first
dotenv.config({ path: path.resolve(__dirname, "./.env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import concertRoutes from "./routes/concertRoutes.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 4000;
const nodeEnv = process.env.NODE_ENV;

const corsOptions = {
  methods: ["GET", "POST", "PUT", "DELETE", "UPDATE"],
  credentials: true,
};

if (nodeEnv === "production") {
  // Allow multiple frontend URLs in production
  corsOptions.origin = [
    "https://set-trackr.onrender.com",
    "https://set-trackr.netlify.app",
    "https://settrackr.netlify.app",
    // Add any other frontend deployment URLs here
  ];
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
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
// trigger restart - updated
