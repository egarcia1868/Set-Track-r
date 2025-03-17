// const Workout = require("../models/workoutModel");
const Show = require("../models/showModel");
const mongoose = require("mongoose");


const showModel = new Show(process.env.SETLIST_FM_API_KEY);

// get all workouts
const getWorkouts = async (req, res) => {
  // const workouts = await Workout.find({}).sort({ createdAt: -1 });

  // res.status(200).json(workouts);
};

// get a single workout
const getShow = async (req, res) => {
//   try {
//   const { id } = req.params;

//   // if (!mongoose.Types.ObjectId.isValid(id)) {
//   //   return res.status(404).json({ error: "No such show" });
//   // }

//   const show = await Show.getConcertById(id);

//   if (!show) {
//     return res.status(404).json({ error: "No such show" });
//   }

//   res.status(200).json(show);
// }
try {
  const { id } = req.params; // Get show ID from request parameters

  if (!id) {
      return res.status(400).json({ error: "Show ID is required" });
  }

  const concertData = await showModel.getConcertById(id);

  if (!concertData) {
      return res.status(404).json({ error: "Concert not found" });
  }

  res.json(concertData);
}
 catch (error) {
  console.error("Error in ConcertController:", error);
  res.status(500).json({ error: "Internal server error" });
}
};

// create new workout
const createWorkout = async (req, res) => {
  // const { title, load, reps } = req.body;

  // // add doc to db
  // try {
  //   const workout = await Workout.create({ title, load, reps });
  //   res.status(200).json(workout);
  // } catch (error) {
  //   res.status(400).json({ error: error.message });
  // }
};

// delete a workout
const deleteWorkout = async (req, res) => {
  // const { id } = req.params;

  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "No such workout" });
  // }

  // const workout = await Workout.findOneAndDelete({ _id: id });

  // if (!workout) {
  //   return res.status(404).json({ error: "No such workout" });
  // }

  // res.status(200).json(workout);
};

// update a workout
const updateWorkout = async (req, res) => {
  // const { id } = req.params;

  // if (!mongoose.Types.ObjectId.isValid(id)) {
  //   return res.status(404).json({ error: "No such workout" });
  // }

  // const workout = await Workout.findOneAndUpdate({ _id: id }, { ...req.body });

  // if (!workout) {
  //   return res.status(404).json({ error: 'No such workout'})
  // }

  // res.status(200).json(workout)
};

module.exports = {
  createWorkout,
  getShow,
  getWorkouts,
  deleteWorkout,
  updateWorkout
};
