// // const Workout = require("../models/workoutModel");
// const Concert = require("../models/concertModel");
// const mongoose = require("mongoose");


// const concertModel = new Concert(process.env.SETLIST_FM_API_KEY);

// // get all workouts
// const getWorkouts = async (req, res) => {
//   // const workouts = await Workout.find({}).sort({ createdAt: -1 });

//   // res.status(200).json(workouts);
// };

// // get a single workout
// const getConcert = async (req, res) => {
// //   try {
// //   const { id } = req.params;

// //   // if (!mongoose.Types.ObjectId.isValid(id)) {
// //   //   return res.status(404).json({ error: "No such concert" });
// //   // }

// //   const concert = await Concert.getConcertById(id);

// //   if (!concert) {
// //     return res.status(404).json({ error: "No such concert" });
// //   }

// //   res.status(200).json(concert);
// // }
// try {
//   const { id } = req.params; // Get concert ID from request parameters

//   if (!id) {
//       return res.status(400).json({ error: "Concert ID is required" });
//   }

//   const concertData = await concertModel.getConcertById(id);

//   if (!concertData) {
//       return res.status(404).json({ error: "Concert not found" });
//   }

//   res.json(concertData);
// }
//  catch (error) {
//   console.error("Error in ConcertController:", error);
//   res.status(500).json({ error: "Internal server error" });
// }
// };

// // create new concert
// const createConcert = async (req, res) => {
//   const { title, load, reps } = req.body;

//   // // add doc to db
//   try {
//     const concert = await Concert.create({ title, load, reps });
//     res.status(200).json(workout);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // delete a workout
// const deleteWorkout = async (req, res) => {
//   // const { id } = req.params;

//   // if (!mongoose.Types.ObjectId.isValid(id)) {
//   //   return res.status(404).json({ error: "No such workout" });
//   // }

//   // const workout = await Workout.findOneAndDelete({ _id: id });

//   // if (!workout) {
//   //   return res.status(404).json({ error: "No such workout" });
//   // }

//   // res.status(200).json(workout);
// };

// // update a workout
// const updateWorkout = async (req, res) => {
//   // const { id } = req.params;

//   // if (!mongoose.Types.ObjectId.isValid(id)) {
//   //   return res.status(404).json({ error: "No such workout" });
//   // }

//   // const workout = await Workout.findOneAndUpdate({ _id: id }, { ...req.body });

//   // if (!workout) {
//   //   return res.status(404).json({ error: 'No such workout'})
//   // }

//   // res.status(200).json(workout)
// };

// module.exports = {
//   createConcert,
//   getConcert,
//   getWorkouts,
//   deleteWorkout,
//   updateWorkout
// };



import Concert from '../models/concertModel.js';
import { getConcertFromAPI } from '../services/concertService.js';

export const getConcert = async (req, res) => {
    try {
        const { artistName, date } = req.params;
        const concertData = await getConcertFromAPI(artistName, date);

        if (!concertData) {
            return res.status(404).json({ error: "Concert not found from API" });
        }

        res.json(concertData);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

export const saveConcert = async (req, res) => {
  console.log(req.body);
    try {
        const { apiId, artist, eventDate, city, state, country, sets } = req.body;
        const existingConcert = await Concert.findOne({ apiId });

        if (existingConcert) {
            return res.status(409).json({ error: "Concert already saved" });
        }

        const newConcert = new Concert({ apiId, artist, eventDate, city, state, country, sets });
        await newConcert.save();
        res.status(201).json(newConcert);
    } catch (error) {
        console.error('error: ', error);
        res.status(500).json({ error: "Could not save concert" });
    }
};

export const getSavedConcert = async (req, res) => {
    try {
      //  const { showId } = req.params;
        const concerts = await Concert.find();
        res.json(concerts);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch concerts" });
    }
};
