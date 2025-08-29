import Artist from "../models/ArtistModel.js";
import User from "../models/UserModel.js";
import { getConcertFromAPI } from "../services/concertService.js";
import { saveConcertsForUser } from "../services/concertService.js";

export const getConcert = async (req, res) => {
  const params = req.query;

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
      user: result.userDoc,
    });
  } catch (error) {
    console.error("Error adding concert:", error);
    res
      .status(500)
      .json({ error: error.message || "Could not save concert data." });
  }
};

export const getSavedConcerts = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized: no auth0 ID found" });
    }

    const user = await User.findOne({ auth0Id });
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
  } catch (error) {
    console.error("Error deleting concert:", error);
    res.status(500).json({ error: "Could not delete concert" });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const decodedUsername = decodeURIComponent(username);
    console.log(`Public profile request for username: ${username} (decoded: ${decodedUsername})`);
    
    // First try to find by displayName (new username-based URLs)
    let user = await User.findOne({ 
      "profile.displayName": decodedUsername,
      "profile.isPublic": true 
    });
    
    // If not found, try to find by shareableId (backward compatibility)
    if (!user) {
      console.log(`No user found by displayName, trying shareableId...`);
      user = await User.findOne({ 
        "profile.shareableId": decodedUsername,
        "profile.isPublic": true 
      });
    }
    
    if (!user) {
      console.log(`No public profile found for: ${decodedUsername}`);
      return res.status(404).json({ error: "Profile not found or not public" });
    }
    
    console.log(`Found public profile for user: ${user._id}`);

    const artistIds = user.artistsSeenLive.map((entry) => entry.artistId);
    const artistDocs = await Artist.find({ artistId: { $in: artistIds } });

    const concertData = artistDocs.map((artist) => {
      const userArtistEntry = user.artistsSeenLive.find(
        (entry) => entry.artistId === artist.artistId,
      );
      const userConcertIds = userArtistEntry?.concerts || [];

      return {
        artistName: artist.artistName,
        artistId: artist.artistId,
        concerts: artist.concerts.filter((concert) =>
          userConcertIds.includes(concert.concertId),
        ),
      };
    });

    res.json({
      profile: {
        displayName: user.profile.displayName || "Music Fan",
        bio: user.profile.bio,
      },
      concerts: concertData,
      stats: {
        totalConcerts: concertData.reduce((sum, artist) => sum + artist.concerts.length, 0),
        totalArtists: concertData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    res.status(500).json({ error: "Could not fetch profile" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findOne({ auth0Id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      profile: user.profile || {
        displayName: "",
        bio: "",
        isPublic: false,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Could not fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { displayName, bio, isPublic } = req.body;
    const user = await User.findOne({ auth0Id });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize profile if it doesn't exist
    if (!user.profile) {
      user.profile = {
        displayName: "",
        bio: "",
        isPublic: false,
      };
    }

    // Check for display name uniqueness if displayName is being updated
    if (displayName && displayName.trim() && displayName !== user.profile.displayName) {
      const existingUser = await User.findOne({ 
        "profile.displayName": displayName.trim(),
        auth0Id: { $ne: auth0Id } // Exclude current user
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          error: "This display name is already taken. Please choose another name." 
        });
      }
    }


    user.profile.displayName = displayName || user.profile.displayName;
    user.profile.bio = bio !== undefined ? bio : user.profile.bio;
    user.profile.isPublic = isPublic !== undefined ? isPublic : user.profile.isPublic;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      profile: user.profile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Could not update profile" });
  }
};
