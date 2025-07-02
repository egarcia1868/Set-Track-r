import dotenv from "dotenv";
import axios from "axios";
import path from "path";
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(".env") });

// dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL =
  process.env.REACT_APP_API_URL || "https://api.setlist.fm/rest/1.0/";
const API_KEY = process.env.SETLIST_FM_API_KEY;

//TODO: set up to allow more than just artistName and date
export const getConcertFromAPI = async (artistName, date) => {
  try {
    const response = await axios.get(
      `${API_URL}search/setlists/?artistName=${artistName}&date=${date}`,
      {
        headers: {
          "x-api-key": API_KEY,
          Accept: "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching concert from API:",
      error.response?.data || error.message,
    );
    return null;
  }
};
