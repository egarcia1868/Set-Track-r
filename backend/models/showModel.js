// const mongoose = require('mongoose')

// const Schema = mongoose.Schema

// const showSchema = new Schema({
//   date: {
//     type: Date,
//     required: true
//   },
//   location: {
//     type: String,
//     required: true
//   },
//   songList: {
//     type: [String],
//     required: true
//   }
// }, { timestamps: true })

// module.exports = mongoose.model('Show', showSchema)

const axios = require('axios');
require('dotenv').config(); // Load API key from environment variables

class Show {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = "https://api.setlist.fm/rest/1.0/setlist/";
    }

    async getConcertById(showId) {
        try {
            const response = await axios.get(`${this.baseUrl}${showId}`, {
                headers: {
                    "x-api-key": this.apiKey,
                    "Accept": "application/json",
                },
            });

            return response.data; // Returning concert details
        } catch (error) {
            console.error("Error fetching concert data:", error.response?.data || error.message);
            return null;
        }
    }
}

// // Usage example:
// const show = new Show(process.env.SETLIST_FM_API_KEY);
// show.getConcertById("63de4613").then(data => console.log(data));

module.exports = Show;