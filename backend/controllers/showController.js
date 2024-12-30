const Show = require('../models/showModel');
const mongoose = require('mongoose');

// get all personal shows
const getPersonalShows = async (req, res) => {
  const shows = await Show.find({}).sort({createdAt: -1});

  res.status(200).json(shows);
};

// 

// get a personal set list
const getPersonalShow = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'No such show'})
  };

  const show = await Show.findById(id);
  // const show = await Show.findOne({ date: specificDate, artist: specificArtist });


  if (!show) {
    return res.status(404).json({error: 'No such show'});
  };

  res.status(200).json(show);
};

// create a new show
// const createShow = async (req, res) => {
//   const {title, load, reps} = req.body;

//   let emptyFields = [];

//   if (!title) {
//     emptyFields.push('title');
//   };
//   if (!load) {
//     emptyFields.push('load');
//   };
//   if (!reps) {
//     emptyFields.push('reps');
//   };
//   if (emptyFields.length > 0) {
//     return res.status(400).json({ error: 'Please fill in all fields', emptyFields });
//   };

//   // add to the database
//   try {
//     const show = await Show.create({ title, load, reps });
//     res.status(200).json(show);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   };
// };

// delete a personal show
const deletePersonalShow = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({error: 'No such show'})
  }

  const show = await Show.findOneAndDelete({_id: id})

  if(!show) {
    return res.status(400).json({error: 'No such show'})
  }

  res.status(200).json(show)
}

// update a personal show
const updatePersonalShow = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({error: 'No such show'})
  }

  const show = await Show.findOneAndUpdate({_id: id}, {
    ...req.body
  })

  if (!show) {
    return res.status(400).json({error: 'No such show'})
  }

  res.status(200).json(show)
}

module.exports = {
  getPersonalShows,
  getPersonalShow,
  // createShow,
  deletePersonalShow,
  updatePersonalShow
}