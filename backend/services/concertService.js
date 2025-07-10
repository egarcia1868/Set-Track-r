import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import Artist from "../models/ArtistModel.js";
import User from "../models/UserModel.js";

dotenv.config({ path: path.resolve(".env") });

const API_URL =
  process.env.REACT_APP_API_URL || "https://api.setlist.fm/rest/1.0/";
const API_KEY = process.env.SETLIST_FM_API_KEY;

export const saveConcertsForUser = async ({ concertData, user }) => {
  console.log("STARTING", concertData);
  const userId = user.sub;

  let userDoc = await User.findOne({ auth0Id: userId });

  if (!userDoc) {
    userDoc = new User({ auth0Id: userId, artistsSeenLive: [] });
  }

  for (let concert of concertData) {
    const {
      id: concertId,
      eventDate,
      artist,
      venue,
      sets: { set: sets },
      url,
    } = concert;
    const { name: artistName, mbid: artistId } = artist;

    if (!concertId || !userId) {
      throw new Error("concertId and userId are required");
    }

    let artistDoc = await Artist.findOne({ artistId });

    if (!artistDoc) {
      artistDoc = new Artist({ artistName, artistId, concerts: [] });
    }

    const existingConcert = artistDoc.concerts.find(
      (c) => c.concertId === concertId,
    );

    if (!existingConcert) {
      artistDoc.concerts.push({ concertId, eventDate, venue, sets, url });
    }

    await artistDoc.save();

    const artistEntry = userDoc.artistsSeenLive.find(
      (ac) => ac.artistId === artistId,
    );
    if (artistEntry) {
      if (!artistEntry.concerts.includes(concertId)) {
        artistEntry.concerts.push(concertId);
      }
    } else {
      userDoc.artistsSeenLive.push({
        artistName,
        artistId,
        concerts: [concertId],
      });
    }
  }
  await userDoc.save();

  return {
    userDoc,
  };
};

export const getConcertFromAPI = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  try {
    const response = await axios.get(
      `${API_URL}search/setlists/?${queryString}`,
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
