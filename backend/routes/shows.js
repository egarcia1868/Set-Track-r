const express = require('express');
const {
  getPersonalShows,
  // getShow, 
  getPersonalShow, 
  // createShow, 
  deletePersonalShow, 
  updatePersonalShow
} = require('../controllers/showController');

const router = express.Router();

// GET all personal shows
router.get('/', getPersonalShows);

// // Get specific show from api
// router.get('/api/setlists', getShow);

// GET a single personal show
router.get('/:id', getPersonalShow);

// POST a new Show
// router.post('/', createShow);

// DELETE a personal show
router.delete('/:id', deletePersonalShow);

// UPDATE a personal show
router.patch('/:id', updatePersonalShow);

module.exports = router;