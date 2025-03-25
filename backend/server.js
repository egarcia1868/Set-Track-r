// require("dotenv").config();

// const express = require("express");
// const mongoose = require("mongoose");
// const concertRoutes = require("./routes/concerts");
// // const workoutRoutes = require("./routes/workouts");

// // express app
// const app = express();

// // middleware
// app.use(express.json());

// app.use((req, res, next) => {
//   console.log(req.path, req.method);
//   next();
// });

// // routes
// app.use("/api/concerts", concertRoutes);
// // app.use("/api/workouts", workoutRoutes);

// //connect to db
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     // listen for requests
//     app.listen(process.env.PORT, () => {
//       console.log("listening on port", process.env.PORT);
//     });
//   })
//   .catch((error) => {
//     console.log(error);
//   });


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
