import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import concertRoutes from "./routes/concertRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/concerts", concertRoutes);


//connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // listen for requests
    app.listen(process.env.PORT, () => {
      console.log("listening on port", process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });
