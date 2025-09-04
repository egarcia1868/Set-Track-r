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

    // For each concert, try to find other artists who performed at the same venue on the same date
    const enhancedSetlists = [];
    const processedVenueDates = new Set();

    for (const setlist of initialData.setlist) {
      const venueId = setlist.venue.id;
      const eventDate = setlist.eventDate;
      const venueDate = `${venueId}-${eventDate}`;

      // Add the original setlist
      enhancedSetlists.push(setlist);

      // Skip if we've already processed this venue/date combination
      if (processedVenueDates.has(venueDate)) {
        continue;
      }
      processedVenueDates.add(venueDate);

      try {
        // Search for other setlists at the same venue on the same date
        const venueSearchParams = new URLSearchParams({
          venueId: venueId,
          date: eventDate
        });

        const venueResponse = await axios.get(
          `${API_URL}search/setlists/?${venueSearchParams.toString()}`,
          {
            headers: {
              "x-api-key": API_KEY,
              Accept: "application/json",
            },
          },
        );

        if (venueResponse.data.setlist) {
          // Add any additional artists from the same venue/date that aren't already included
          for (const venueSetlist of venueResponse.data.setlist) {
            const isDuplicate = enhancedSetlists.some(existing => 
              existing.id === venueSetlist.id
            );
            
            if (!isDuplicate) {
              enhancedSetlists.push(venueSetlist);
            }
          }
        }
      } catch (venueError) {
        // If venue search fails, just continue with the original setlist
        console.error("Error fetching additional artists for venue:", venueError.message);
      }
    }

    return {
      ...initialData,
      setlist: enhancedSetlists
    };
  } catch (error) {
    console.error(
      "Error fetching concert from API:",
      error.response?.data || error.message,
    );
    return null;
  }
};
