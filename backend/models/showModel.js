const mongoose = require('mongoose')

const Schema = mongoose.Schema

const showSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  songList: {
    type: [String],
    required: true
  }
}, { timestamps: true })

module.exports = mongoose.model('Show', showSchema)