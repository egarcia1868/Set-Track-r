import Artist from "../models/ArtistModel.js";
import User from "../models/UserModel.js";
import { getConcertFromAPI } from "../services/concertService.js";
import mongoose from "mongoose";

// TODO: Fix structure to use services/controllers pattern correctly.

// TODO: setup to accept other search fields
export const getConcert = async (req, res) => {
  try {
    const { artistName, date } = req.params;
    const concertData = await getConcertFromAPI(artistName, date);

    if (!concertData) {
      return res.status(404).json({ error: "Concert not found from API" });
    }

    res.json(concertData);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const saveConcert = async (req, res) => {
  try {
    const {
      id: concertId,
      eventDate,
      artist,
      venue,
      sets: { set: sets },
      url,
    } = req.body.concertData;
    const { name: artistName, mbid: artistId } = artist;
    
    const { sub: userId } = req.body.user;

    if (!concertId || !userId) {
      return res.status(400).json({ error: "concertId and userId are required" });
    }

    // Check if the artist already exists in the database
    let artistDoc = await Artist.findOne({ artistId });

    // If the artist does not exist, create a new artist entry
    if (!artistDoc) {
      artistDoc = new Artist({
        artistName,
        artistId,
        concerts: [],
      });
    }

    // Check if the concert already exists for the artist
    const existingConcert = artistDoc.concerts.find(
      (c) => c.concertId === concertId,
    );

    // If the concert does not exist, add it to the artist's concerts
    if (!existingConcert) {
      artistDoc.concerts.push({
        concertId,
        eventDate,
        venue,
        sets,
        url,
      });
    }

    await artistDoc.save();

    let userDoc = await User.findOne({ auth0Id: userId });

    // If the user does not exist, create a new user entry
    if (!userDoc) {
      userDoc = new User({
        auth0Id: userId,
        artistsSeenLive: []
      });
    }

    const artistEntryInUserDoc = userDoc.artistsSeenLive.find((ac) => ac.artistId === artistId);
    if (artistEntryInUserDoc) {
      const hasConcert = artistEntryInUserDoc.concerts.includes(concertId);

      if (!hasConcert) {
        artistEntryInUserDoc.concerts.push(concertId);
      }
    } else {
      userDoc.artistsSeenLive.push({
        artistId,
        concerts: [concertId],
      });
    }

    await userDoc.save();
    res.status(201).json({
      message: 'Concert saved for artist and user successfully',
      artist: artistDoc,
      user: userDoc,
    });

  } catch (error) {
    console.error("Error adding concert:", error);
    res.status(500).json({ error: "Could not save concert data." });
  }
};

// TODO: setup to work with reorganization of concert data.
export const getSavedConcert = async (req, res) => {
  try {
    const { concertId } = req.params;

    if (!concertId) {
      return res.status(400).json({ error: "concertId is required" });
    }

    const concerts = await Concert.findOne({ concertId });
    if (!concert) {
      return res.status(404).json({ error: "Concert not found" });
    }

    res.json(concerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch concert" });
  }
};

// TODO: setup to work with reorganization of concert data.
export const getSavedConcerts = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('userId: ', userId);

    const concerts = await Artist.find();

    res.json(concerts);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch concerts" });
  }
};

// TODO: setup to work with reorganization of concert data.
export const deleteConcert = async (req, res) => {
  const { artistId, concertId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({ error: "Invalid artist or concert ID" });
  }

  const artist = await Artist.findOneAndUpdate(
    { _id: artistId },
    { $pull: { concerts: { concertId } } },
    { new: true },
  );

  if (!artist) {
    return res.status(404).json({ error: "Artist not found" });
  }

  if (artist.concerts.length === 0) {
    await Artist.findByIdAndDelete(artistId);
    return res
      .status(200)
      .json({ message: "Artist deleted as there were no more concerts" });
  }

  // res.status(200).json(concerts)
  res.status(200).json({ message: "Concert removed successfully", artist });
};
