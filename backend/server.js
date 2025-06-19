import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import concertRoutes from "./routes/concertRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from 'cookie-parser';

dotenv.config({ path: path.resolve(".env") });

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
app.use("/api/auth", authRoutes);

// Add a simple test route for backend
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get('/set-cookies', (req, res) => {
  // res.setHeader('Set-Cookie', 'newUser=true');
  res.cookie('newUser', false);
  res.cookie('isEmployee', true, { maxAge: 1000 * 60 * 60 * 24, httpOnly: nodeEnv === 'production' ? true : false });

  res.send('you got the cookies!');

})

app.get('/read-cookies', (req, res) => {
  const cookies = req.cookies;

  console.log('cookies: ', cookies.newUser);
  res.json(cookies);
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
