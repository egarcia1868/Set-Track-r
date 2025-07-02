import Artist from "../models/ArtistModel.js";
import User from "../models/UserModel.js";
import { getConcertFromAPI } from "../services/concertService.js";
import { saveConcertForUser } from "../services/concertService.js";
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
    const result = await saveConcertForUser({
      concertData: req.body.concertData,
      user: req.body.user,
    });

    res.status(201).json({
      message: "Concert saved for artist and user successfully",
      artist: result.artistDoc,
      user: result.userDoc,
    });
  } catch (error) {
    console.error("Error adding concert:", error);
    res
      .status(500)
      .json({ error: error.message || "Could not save concert data." });
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
// export const getSavedConcerts = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // console.log('userId: ', userId);

//     const concerts = await Artist.find();

//     res.json(concerts);
//   } catch (error) {
//     res.status(500).json({ error: "Could not fetch concerts" });
//   }
// };
export const getSavedConcerts = async (req, res) => {
  // try {
  //   const { userId } = req.params;
  //   const user = await User.findOne({ auth0Id: userId });
  //   if (!user) {
  //     return res.status(404).json({ error: "User not found" });
  //   }

  //   const artistIds = user.artistsSeenLive.map(artist => artist.artistId);

  //   const artistDocs = await Artist.find({ artistId: { $in: artistIds } });

  //   const filtered =
  try {
    const { userId } = req.params;

    // 1. Find the user by Auth0 ID
    const user = await User.findOne({ auth0Id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const artistIds = user.artistsSeenLive.map((entry) => entry.artistId);

    // 2. Find all artist docs that match user-attended artists
    const artistDocs = await Artist.find({ artistId: { $in: artistIds } });

    // 3. Filter each artist’s concerts based on the user’s attended concerts
    const filtered = artistDocs.map((artist) => {
      const userArtistEntry = user.artistsSeenLive.find(
        (entry) => entry.artistId === artist.artistId,
      );

      const userConcertIds = userArtistEntry?.concerts || [];

      return {
        _id: artist._id,
        artistName: artist.artistName,
        artistId: artist.artistId,
        concerts: artist.concerts.filter((concert) =>
          userConcertIds.includes(concert.concertId),
        ),
      };
    });

    res.json(filtered);
  } catch (error) {
    console.error("Error fetching saved concerts:", error);
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
