import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import Artist from "../models/ArtistModel.js";
import User from "../models/UserModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_URL =
  process.env.REACT_APP_API_URL || "https://api.setlist.fm/rest/1.0/";
const API_KEY = process.env.SETLIST_FM_API_KEY;

const LASTFM_API_URL = "http://ws.audioscrobbler.com/2.0/";
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

export const saveConcertsForUser = async ({ concertData, user }) => {
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
    // Get the initial search results
    const response = await axios.get(
      `${API_URL}search/setlists/?${queryString}`,
      {
        headers: {
          "x-api-key": API_KEY,
          Accept: "application/json",
        },
      },
    );

    const initialData = response.data;
    if (!initialData.setlist || initialData.setlist.length === 0) {
      return initialData;
    }

    // Add metadata about potential additional artists without making the API calls
    const enhancedSetlists = initialData.setlist.map((setlist) => ({
      ...setlist,
      _venueMetadata: {
        venueId: setlist.venue.id,
        venueName: setlist.venue.name,
        eventDate: setlist.eventDate,
        hasMoreArtists: true, // We assume there might be more artists
      },
    }));

    return {
      ...initialData,
      setlist: enhancedSetlists,
    };
  } catch (error) {
    console.error(
      "Error fetching concert from API:",
      error.response?.data || error.message,
    );
    return null;
  }
};

export const getAdditionalArtistsByVenueDate = async (venueId, eventDate) => {
  try {
    const venueSearchParams = new URLSearchParams({
      venueId: venueId,
      date: eventDate,
    });

    const response = await axios.get(
      `${API_URL}search/setlists/?${venueSearchParams.toString()}`,
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
      "Error fetching additional artists from API:",
      error.response?.data || error.message,
    );
    return null;
  }
};

export const getArtistTopAlbums = async (artistName) => {
  try {
    const params = new URLSearchParams({
      method: "artist.gettopalbums",
      artist: artistName,
      api_key: LASTFM_API_KEY,
      format: "json",
    });

    const response = await axios.get(
      `${LASTFM_API_URL}?${params.toString()}`,
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching top albums from Last.fm:",
      error.response?.data || error.message,
    );
    return null;
  }
};
