// // const mongoose = require('mongoose')

// // const Schema = mongoose.Schema

// // const concertSchema = new Schema({
// //   date: {
// //     type: Date,
// //     required: true
// //   },
// //   location: {
// //     type: String,
// //     required: true
// //   },
// //   songList: {
// //     type: [String],
// //     required: true
// //   }
// // }, { timestamps: true })

// // module.exports = mongoose.model('Concert', concertSchema)









// const axios = require('axios');
// require('dotenv').config(); // Load API key from environment variables

// class Concert {
//     constructor(apiKey) {
//         this.apiKey = apiKey;
//         this.baseUrl = "https://api.setlist.fm/rest/1.0/setlist/";
//     }

//     async getConcertById(concertId) {
//         try {
//             const response = await axios.get(`${this.baseUrl}${concertId}`, {
//                 headers: {
//                     "x-api-key": this.apiKey,
//                     "Accept": "application/json",
//                 },
//             });

//             return response.data; // Returning concert details
//         } catch (error) {
//             console.error("Error fetching concert data:", error.response?.data || error.message);
//             return null;
//         }
//     }
// }

// // // Usage example:
// // const concert = new Concert(process.env.SETLIST_FM_API_KEY);
// // concert.getConcertById("63de4613").then(data => console.log(data));

// module.exports = Concert;

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const concertSchema = new Schema({
  apiId: { type: String, unique: true },
  artist: { type: String, required: true },
  sortName: { type: String, required: true },
  eventDate: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  sets: {
    type: [{
        name: { type: String},
        encore: { type: String },
        songs : { type: [{
            name: { type: String, required: true },
            info: { type: String }
        }]},
    }],
    required: true
  }
}, { timestamps: true });

export default model('Concert', concertSchema);
