import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.REACT_APP_API_URL || "https://api.setlist.fm/rest/1.0/";
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
