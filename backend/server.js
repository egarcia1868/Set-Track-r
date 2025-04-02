import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import cors from 'cors';
// import { connectDB } from "./config/db.js";
import { fileURLToPath } from 'url';
import concertRoutes from "./routes/concertRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dotenv.config({ path: new URL('./.env', import.meta.url).pathname});
// dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  methods: ['GET', 'POST'],
  credentials: true,
};

if (process.env.NODE_ENV === "production") {
  // Allow only the frontend URL when in production
  corsOptions.origin = 'https://set-trackr-frontend.onrender.com';
} else {
  // Allow local frontend to access the backend during development
  corsOptions.origin = 'http://localhost:3000';  // Update this if your local frontend runs on a different port
}
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/concerts", concertRoutes);

// const __dirname = path.resolve();

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "/frontend/build")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
//   });
// }

// Add a simple test route for backend
app.get("/", (req, res) => {
  res.send("Backend is running!");
});


// console.log("Mongo URI:", process.env.MONGO_URI);

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
// app.listen(PORT, () => {
// 	connectDB();
// 	console.log("Server started at http://localhost:" + PORT);
// });