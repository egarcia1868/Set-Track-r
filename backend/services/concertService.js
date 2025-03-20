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

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = "https://api.setlist.fm/rest/1.0/";
const API_KEY = process.env.SETLIST_FM_API_KEY;

export const getConcertFromAPI = async (artistName, date) => {
    try {
        const response = await axios.get(`${API_URL}search/setlists/?artistName=${artistName}&date=${date}`, {
            headers: {
                "x-api-key": API_KEY,
                "Accept": "application/json",
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching concert from API:", error.response?.data || error.message);
        return null;
    }
};
