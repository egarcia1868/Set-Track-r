import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import Artist from "../models/ArtistModel.js";
import User from "../models/UserModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SETLIST_FM_API_URL =
  process.env.SETLIST_FM_API_URL || "https://api.setlist.fm/rest/1.0/";
const API_KEY = process.env.SETLIST_FM_API_KEY;

const LASTFM_API_URL = "http://ws.audioscrobbler.com/2.0/";
const LASTFM_API_KEY = process.env.LAST_FM_API_KEY;

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

    const isNewArtist = !artistDoc;

    if (!artistDoc) {
      artistDoc = new Artist({ artistName, artistId, concerts: [] });
    }

    const existingConcert = artistDoc.concerts.find(
      (c) => c.concertId === concertId,
    );

    if (!existingConcert) {
      artistDoc.concerts.push({ concertId, eventDate, venue, sets, url });
    }

    // Fetch and save top album image for new artists
    if (isNewArtist) {
      try {
        const topAlbumsData = await getArtistTopAlbums(artistName);
        if (topAlbumsData && topAlbumsData.topalbums && topAlbumsData.topalbums.album) {
          const albums = topAlbumsData.topalbums.album;

          // Find the album with the highest playcount
          let topAlbum = null;
          let maxPlaycount = 0;

          for (const album of albums) {
            const playcount = parseInt(album.playcount || 0);
            if (playcount > maxPlaycount) {
              maxPlaycount = playcount;
              topAlbum = album;
            }
          }

          // Extract the extralarge image URL
          if (topAlbum && topAlbum.image && Array.isArray(topAlbum.image)) {
            const extralargeImage = topAlbum.image.find(img => img.size === 'extralarge');
            if (extralargeImage && extralargeImage['#text'] && extralargeImage['#text'].trim() !== '') {
              artistDoc.topAlbumImage = extralargeImage['#text'];
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching top album image for ${artistName}:`, error);
        // Continue without the image if there's an error
      }
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
      `${SETLIST_FM_API_URL}search/setlists/?${queryString}`,
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
      `${SETLIST_FM_API_URL}search/setlists/?${venueSearchParams.toString()}`,
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
