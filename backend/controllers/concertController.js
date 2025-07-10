import Artist from "../models/ArtistModel.js";
import User from "../models/UserModel.js";
import { getConcertFromAPI } from "../services/concertService.js";
import { saveConcertsForUser } from "../services/concertService.js";
// import mongoose from "mongoose";

// TODO: Fix structure to use services/controllers pattern correctly.

// TODO: setup to accept other search fields
// export const getConcert = async (req, res) => {
//   try {
//     const { artistName, date } = req.params;
//     const concertData = await getConcertFromAPI(artistName, date);

//     if (!concertData) {
//       return res.status(404).json({ error: "Concert not found from API" });
//     }

//     res.json(concertData);
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
export const getConcert = async (req, res) => {
  // const { artistName, venueName, city, date, p = 1 } = req.query;
  const params = req.query;

  // console.log("Received search params:", params);

  try {
    if (Object.keys(params).length < 1) {
      return res
        .status(400)
        .json({ error: "At least one search criteria must be provided." });
    }
    let concertData = null;
    concertData = await getConcertFromAPI(params);

    if (!concertData) {
      return res
        .status(404)
        .json({ error: "Concert not found with provided criteria." });
    }

    res.json(concertData);
  } catch (error) {
    console.error("Error fetching concert:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const saveConcerts = async (req, res) => {
  try {
    const result = await saveConcertsForUser({
      concertData: req.body.concertData,
      user: req.body.user,
    });

    res.status(201).json({
      message: "Concert saved for user successfully",
      // artist: result.artistDoc,
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
// export const getSavedConcert = async (req, res) => {
//   try {
//     const { concertId } = req.params;

//     if (!concertId) {
//       return res.status(400).json({ error: "concertId is required" });
//     }

//     const concerts = await Concert.findOne({ concertId });
//     if (!concert) {
//       return res.status(404).json({ error: "Concert not found" });
//     }

//     res.json(concerts);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Could not fetch concert" });
//   }
// };

// TODO: setup to work with reorganization of concert data.
export const getSavedConcerts = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized: no auth0 ID found" });
    }

    // console.log("Authenticated user:", auth0Id);
    const user = await User.findOne({ auth0Id });
    // .populate('attendedConcerts')
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const artistIds = user.artistsSeenLive.map((entry) => entry.artistId);

    // Find all artist docs that match user-attended artists
    const artistDocs = await Artist.find({ artistId: { $in: artistIds } });

    // Filter each artist’s concerts based on the user’s attended concerts
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
  try {
    const auth0Id = req.auth?.payload.sub;
    const { artistId, concertId } = req.params;
    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const artistEntry = user.artistsSeenLive.find(
      (entry) => entry.artistId === artistId,
    );
    if (!artistEntry) {
      return res
        .status(404)
        .json({ error: "Artist not found in user's attended concerts" });
    }
    console.log("Deleting concert:", artistEntry.concerts);
    artistEntry.concerts = artistEntry.concerts.filter(
      (id) => id !== concertId,
    );

    // If no more concerts for this artist, remove the artist entry entirely
    if (artistEntry.concerts.length === 0) {
      user.artistsSeenLive = user.artistsSeenLive.filter(
        (entry) => entry.artistId !== artistId,
      );
    }

    await user.save();
    return res
      .status(200)
      .json({ message: "Concert deleted successfully", user });

    // if (!mongoose.Types.ObjectId.isValid(artistId)) {
    //   return res.status(400).json({ error: "Invalid artist or concert ID" });
    // }

    // const artist = await Artist.findOneAndUpdate(
    //   { _id: artistId },
    //   { $pull: { concerts: { concertId } } },
    //   { new: true },
    // );

    // if (!artist) {
    //   return res.status(404).json({ error: "Artist not found" });
    // }

    // if (artist.concerts.length === 0) {
    //   await Artist.findByIdAndDelete(artistId);
    //   return res
    //     .status(200)
    //     .json({ message: "Artist deleted as there were no more concerts" });
    // }

    // // res.status(200).json(concerts)
    // res.status(200).json({ message: "Concert removed successfully", artist });
  } catch (error) {
    console.error("Error deleting concert:", error);
    res.status(500).json({ error: "Could not delete concert" });
  }
};
