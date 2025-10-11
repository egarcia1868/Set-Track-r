import Artist from "../models/ArtistModel.js";
import User from "../models/UserModel.js";
import {
  getConcertFromAPI,
  getAdditionalArtistsByVenueDate,
  getArtistTopAlbums,
} from "../services/concertService.js";
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
    const auth0Id = req.auth?.payload?.sub;
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
    console.log(
      `Public profile request for username: ${username} (decoded: ${decodedUsername})`,
    );

    // First try to find by displayName (new username-based URLs)
    let user = await User.findOne({
      "profile.displayName": decodedUsername,
      "profile.isPublic": true,
    });

    // If not found, try to find by shareableId (backward compatibility)
    if (!user) {
      console.log(`No user found by displayName, trying shareableId...`);
      user = await User.findOne({
        "profile.shareableId": decodedUsername,
        "profile.isPublic": true,
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
        topAlbumImage: artist.topAlbumImage,
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
        totalConcerts: concertData.reduce(
          (sum, artist) => sum + artist.concerts.length,
          0,
        ),
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
        name: "",
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

    const { displayName, name, bio, isPublic } = req.body;
    const user = await User.findOne({ auth0Id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize profile if it doesn't exist
    if (!user.profile) {
      user.profile = {
        displayName: "",
        name: "",
        bio: "",
        isPublic: false,
      };
    }

    // Check for display name uniqueness if displayName is being updated
    if (
      displayName &&
      displayName.trim() &&
      displayName !== user.profile.displayName
    ) {
      console.log(
        `Checking uniqueness for display name: "${displayName.trim()}"`,
      );
      console.log(`Current user's display name: "${user.profile.displayName}"`);

      const existingUser = await User.findOne({
        "profile.displayName": displayName.trim(),
        auth0Id: { $ne: auth0Id }, // Exclude current user
      });

      console.log(
        `Found existing user with same display name:`,
        existingUser ? "Yes" : "No",
      );

      if (existingUser) {
        console.log(
          `Rejecting duplicate display name: "${displayName.trim()}"`,
        );
        return res.status(400).json({
          error:
            "This display name is already taken. Please choose another name.",
        });
      }
    }

    user.profile.displayName = displayName || user.profile.displayName;
    user.profile.name = name !== undefined ? name : user.profile.name;
    user.profile.bio = bio !== undefined ? bio : user.profile.bio;
    user.profile.isPublic =
      isPublic !== undefined ? isPublic : user.profile.isPublic;

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

export const followUser = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { displayName } = req.params;

    // Find the current user
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the user to follow by display name
    const userToFollow = await User.findOne({
      "profile.displayName": displayName,
      "profile.isPublic": true,
    });

    if (!userToFollow) {
      return res
        .status(404)
        .json({ error: "User not found or profile not public" });
    }

    if (currentUser._id.equals(userToFollow._id)) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if already following
    const alreadyFollowing = currentUser.following.some((follow) =>
      follow.userId.equals(userToFollow._id),
    );

    if (alreadyFollowing) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Add to current user's following list
    currentUser.following.push({
      userId: userToFollow._id,
      displayName: userToFollow.profile.displayName,
    });

    // Add to target user's followers list
    userToFollow.followers.push({
      userId: currentUser._id,
      displayName: currentUser.profile.displayName || "Music Fan",
    });

    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.json({ message: "Successfully followed user" });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ error: "Could not follow user" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { displayName } = req.params;

    // Find the current user
    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the user to unfollow by display name
    const userToUnfollow = await User.findOne({
      "profile.displayName": displayName,
    });

    if (!userToUnfollow) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove from current user's following list
    currentUser.following = currentUser.following.filter(
      (follow) => !follow.userId.equals(userToUnfollow._id),
    );

    // Remove from target user's followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (follower) => !follower.userId.equals(currentUser._id),
    );

    await Promise.all([currentUser.save(), userToUnfollow.save()]);

    res.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Could not unfollow user" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findOne({ auth0Id }).populate(
      "following.userId",
      "profile.displayName profile.isPublic profile.bio",
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter to only show public profiles
    const publicFollowing = user.following
      .filter((follow) => follow.userId && follow.userId.profile.isPublic)
      .map((follow) => ({
        displayName: follow.displayName,
        bio: follow.userId.profile.bio,
        followedAt: follow.followedAt,
      }));

    res.json({ following: publicFollowing });
  } catch (error) {
    console.error("Error fetching following list:", error);
    res.status(500).json({ error: "Could not fetch following list" });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { displayName } = req.params;
    const decodedDisplayName = decodeURIComponent(displayName);
    const auth0Id = req.auth?.payload?.sub;

    let user;

    // If authenticated and no displayName provided, get current user's followers
    if (auth0Id && !displayName) {
      user = await User.findOne({ auth0Id }).populate(
        "followers.userId",
        "profile.displayName profile.isPublic profile.bio",
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    } else {
      // Get followers for a specific public profile
      user = await User.findOne({
        "profile.displayName": decodedDisplayName,
        "profile.isPublic": true,
      }).populate(
        "followers.userId",
        "profile.displayName profile.isPublic profile.bio",
      );

      if (!user) {
        return res.status(404).json({ error: "Public profile not found" });
      }
    }

    // Filter to only show public profiles
    const publicFollowers = user.followers
      .filter((follower) => follower.userId && follower.userId.profile.isPublic)
      .map((follower) => ({
        displayName: follower.displayName,
        bio: follower.userId.profile.bio,
        followedAt: follower.followedAt,
      }));

    res.json({ followers: publicFollowers });
  } catch (error) {
    console.error("Error fetching followers list:", error);
    res.status(500).json({ error: "Could not fetch followers list" });
  }
};

export const getFollowStatus = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { displayName } = req.params;

    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.some(
      (follow) => follow.displayName === displayName,
    );

    res.json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ error: "Could not check follow status" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }

    // Search for users with public profiles that match the query
    const users = await User.find({
      "profile.isPublic": true,
      "profile.displayName": { $regex: q.trim(), $options: "i" },
      auth0Id: { $ne: auth0Id }, // Exclude current user
    })
      .select("profile.displayName profile.bio")
      .limit(20);

    const results = users.map((user) => ({
      displayName: user.profile.displayName,
      bio: user.profile.bio,
    }));

    res.json({ users: results });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Could not search users" });
  }
};

export const getAdditionalArtists = async (req, res) => {
  const { venueId, eventDate } = req.params;

  try {
    if (!venueId || !eventDate) {
      return res
        .status(400)
        .json({ error: "venueId and eventDate are required." });
    }

    const concertData = await getAdditionalArtistsByVenueDate(
      venueId,
      eventDate,
    );

    if (!concertData) {
      return res
        .status(404)
        .json({ error: "No additional artists found for this venue/date." });
    }

    res.json(concertData);
  } catch (error) {
    console.error("Error fetching additional artists:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTopAlbums = async (req, res) => {
  const { artistName } = req.query;

  try {
    if (!artistName) {
      return res
        .status(400)
        .json({ error: "artistName query parameter is required." });
    }

    const albumData = await getArtistTopAlbums(artistName);

    if (!albumData) {
      return res
        .status(404)
        .json({ error: "No albums found for this artist." });
    }

    res.json(albumData);
  } catch (error) {
    console.error("Error fetching top albums:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
