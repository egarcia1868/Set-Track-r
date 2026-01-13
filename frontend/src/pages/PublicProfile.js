import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUserConcerts } from "../context/UserConcertsContext";
import { useChat } from "../context/ChatContext";
import { BASE_URL } from "../utils/config";
import ArtistStatsModal from "../components/common/ArtistStatsModal";
import AllSongsModal from "../components/common/AllSongsModal";
import PublicFollowersList from "../components/common/PublicFollowersList";
import ConcertItemDetailed from "../components/concert/ConcertItemDetailed";
import ArtistImageCarousel from "../components/common/ArtistImageCarousel";

const PublicProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth();
  const { startConversation } = useChat();
  const {
    // isAlreadySaved,
    // addConcertToCollection,
    removeConcertFromCollection,
  } = useUserConcerts();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedArtists, setExpandedArtists] = useState(new Set());
  const [expandedSetlists, setExpandedSetlists] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [showAllSongsModal, setShowAllSongsModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [otherArtistsData, setOtherArtistsData] = useState({});
  const [loadingOtherArtists, setLoadingOtherArtists] = useState({});
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    fetchPublicProfile();
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated && profileData) {
      checkFollowStatus();
      fetchCurrentUserProfile();
    }
  }, [isAuthenticated, profileData]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleArtist = (artistId) => {
    setExpandedArtists((prev) => {
      const newSet = new Set();
      if (prev.has(artistId)) {
        // Clicking same artist collapses it
        return newSet;
      } else {
        // Clicking different artist shows only that one
        newSet.add(artistId);
        return newSet;
      }
    });
  };

  const toggleSetlist = (concertId) => {
    setExpandedSetlists((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(concertId)) {
        newSet.delete(concertId);
      } else {
        newSet.add(concertId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (profileData?.concerts) {
      const allArtistIds = profileData.concerts.map(
        (artist) => artist.artistId,
      );
      setExpandedArtists(new Set(allArtistIds));
    }
  };

  const collapseAll = () => {
    setExpandedArtists(new Set());
  };

  const allExpanded = profileData?.concerts
    ? profileData.concerts.every((artist) =>
        expandedArtists.has(artist.artistId),
      )
    : false;

  // Filter artists based on search term
  const filteredArtists =
    profileData?.concerts?.filter((artist) =>
      artist.artistName.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const fetchPublicProfile = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/concerts/profile/${encodeURIComponent(username)}`,
      );

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else if (response.status === 404) {
        setError("Profile not found or not public");
      } else {
        setError("Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching public profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserProfile = async () => {
    if (!isAuthenticated) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUserProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching current user profile:", error);
    }
  };

  const checkFollowStatus = async () => {
    if (!profileData?.profile?.displayName) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${BASE_URL}/api/users/follow-status/${encodeURIComponent(profileData.profile.displayName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      } else {
        console.error(
          "Follow status check failed with status:",
          response.status,
        );
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!profileData?.profile?.displayName) return;

    setFollowLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${BASE_URL}/api/users/follow/${encodeURIComponent(profileData.profile.displayName)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setIsFollowing(true);
      } else {
        try {
          const data = await response.json();
          console.error("Follow error:", data.error);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
    //console.log("Setting followLoading to false");
    setFollowLoading(false);
  };

  const handleShowOtherArtists = async (concert) => {
    const concertKey = concert.concertId;

    // If already loaded, toggle dropdown
    if (otherArtistsData[concertKey]) {
      setOtherArtistsData((prev) => ({
        ...prev,
        [concertKey]: null,
      }));
      return;
    }

    try {
      setLoadingOtherArtists((prev) => ({ ...prev, [concertKey]: true }));

      const venue =
        typeof concert.venue === "object" ? concert.venue?.name : concert.venue;
      const date = concert.eventDate;

      //console.log("Searching for other artists at:", { date, venueName: venue });

      const response = await fetch(
        `${BASE_URL}/api/concerts?date=${encodeURIComponent(date)}&venueName=${encodeURIComponent(venue)}`,
      );

      if (response.ok) {
        const concertData = await response.json();

        // Store the full setlist data (not just artist names)
        const setlists = concertData.setlist || [];

        setOtherArtistsData((prev) => ({
          ...prev,
          [concertKey]: setlists,
        }));
      } else {
        console.error("Failed to fetch other artists:", response.status);
        setOtherArtistsData((prev) => ({
          ...prev,
          [concertKey]: [],
        }));
      }
    } catch (error) {
      console.error("Error fetching other artists:", error);
      setOtherArtistsData((prev) => ({
        ...prev,
        [concertKey]: [],
      }));
    } finally {
      setLoadingOtherArtists((prev) => ({ ...prev, [concertKey]: false }));
    }
  };

  const handleUnfollow = async () => {
    if (!profileData?.profile?.displayName) return;

    setFollowLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${BASE_URL}/api/users/follow/${encodeURIComponent(profileData.profile.displayName)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setIsFollowing(false);
      } else {
        try {
          const data = await response.json();
          console.error("Unfollow error:", data.error);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
    setFollowLoading(false);
  };

  const handleMessage = async () => {
    console.log("handleMessage clicked");
    console.log("profileData:", profileData);
    console.log("userId:", profileData?.profile?.userId);

    if (!profileData?.profile?.userId) {
      console.error("No userId found in profileData");
      return;
    }

    setMessageLoading(true);
    try {
      console.log("Starting conversation with userId:", profileData.profile.userId);
      await startConversation(profileData.profile.userId);
      console.log("Conversation started, navigating to chat...");
      navigate("/chat");
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Profile Not Found</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="error-container">
        <h2>No Profile Data</h2>
        <p>Unable to load profile information</p>
      </div>
    );
  }

  return (
    <div className="public-profile">
      <ArtistImageCarousel concerts={profileData?.concerts || []} />
      <div className="profile-header">
        <div className="profile-header-top">
          <h1>{profileData.profile.displayName}</h1>
          {isAuthenticated &&
            profileData?.profile?.displayName &&
            user?.sub &&
            currentUserProfile &&
            currentUserProfile?.displayName !==
              profileData?.profile?.displayName && (
              <button
                className="message-btn"
                onClick={handleMessage}
                disabled={messageLoading}
                title="Send message"
              >
                {messageLoading ? "..." : "💬"}
              </button>
            )}
        </div>
        <div className="profile-actions">
          {isAuthenticated &&
            profileData?.profile?.displayName &&
            user?.sub &&
            currentUserProfile &&
            currentUserProfile?.displayName !==
              profileData?.profile?.displayName && (
              <button
                className={`follow-btn ${isFollowing ? "following" : ""}`}
                onClick={isFollowing ? handleUnfollow : handleFollow}
                disabled={followLoading}
              >
                {followLoading
                  ? "Loading..."
                  : isFollowing
                    ? "Following"
                    : "Follow"}
              </button>
            )}
          <button
            className="followers-btn"
            onClick={() => setShowFollowersList(true)}
          >
            Followers
          </button>
        </div>
        {profileData.profile.bio && (
          <div className="profile-bio-container">
            <p className={`profile-bio ${!bioExpanded ? "bio-truncated" : ""}`}>
              {profileData.profile.bio}
            </p>
            {profileData.profile.bio.length > 150 && (
              <button
                className="bio-toggle-btn"
                onClick={() => setBioExpanded(!bioExpanded)}
              >
                {bioExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
        <div className="profile-stats" onClick={() => setShowStatsModal(true)}>
          <div className="stat-row">
            <div className="stat">
              <span className="stat-number">
                {profileData.stats.totalConcerts}
              </span>
              <span className="stat-label">Performances</span>
            </div>
            <div className="stat">
              <span className="stat-number">
                {profileData.stats.totalArtists}
              </span>
              <span className="stat-label">Artists</span>
            </div>
          </div>
          <div className="stats-indicator">
            <span className="chart-icon">📊</span>
            <span className="click-hint">Click for chart view</span>
          </div>
        </div>
      </div>

      <div className="concerts-section">
        <div className="concerts-header">
          <h2>Concert History</h2>
          {profileData.concerts.length > 0 && (
            <input
              type="text"
              placeholder="Search artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="artist-search-input-inline"
            />
          )}
          {profileData.concerts.length > 0 && (
            <button
              className="expand-collapse-all-btn"
              onClick={allExpanded ? collapseAll : expandAll}
            >
              {allExpanded ? "Collapse All" : "Expand All"}
            </button>
          )}
        </div>

        {searchTerm && profileData.concerts.length > 0 && (
          <div className="search-results-info">
            {filteredArtists.length} of {profileData.concerts.length} artists
          </div>
        )}

        {profileData.concerts.length === 0 ? (
          <div className="no-concerts">
            <p>🎵 No concerts yet</p>
            <p>{profileData.name || "This user"} hasn't added any shows to their collection</p>
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="no-concerts">
            <p>No matches for "{searchTerm}"</p>
            <p>{profileData.name || "This user"} hasn't seen them yet!</p>
          </div>
        ) : (
          <div className="artists-layout">
            <div className="artists-sidebar">
              {filteredArtists
                .sort((a, b) => {
                  // Helper function to get sort name (ignoring "The" prefix)
                  const getSortName = (artistName) => {
                    if (artistName.toLowerCase().startsWith("the ")) {
                      return artistName.substring(4); // Remove "The " prefix
                    }
                    return artistName;
                  };
                  return getSortName(a.artistName).localeCompare(
                    getSortName(b.artistName),
                  );
                })
                .map((artist) => {
                  const isExpanded = expandedArtists.has(artist.artistId);
                  return (
                    <div key={artist.artistId}>
                      <div
                        className={`artist-card ${isExpanded ? "expanded" : ""}`}
                        onClick={() => toggleArtist(artist.artistId)}
                      >
                        <h3 className="artist-name">{artist.artistName}</h3>
                        <div className="artist-summary">
                          <span className="concert-count">
                            {artist.concerts.length} concert
                            {artist.concerts.length !== 1 ? "s" : ""}
                          </span>
                          <span className="expand-icon">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mobile-concerts-container">
                          {artist.concerts.length > 1 && (
                            <button
                              className="see-all-songs-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArtist(artist);
                                setShowAllSongsModal(true);
                              }}
                            >
                              See all songs
                            </button>
                          )}
                          <div className="concerts-list">
                            {artist.concerts
                              .sort(
                                (a, b) =>
                                  new Date(b.eventDate) - new Date(a.eventDate),
                              )
                              .map((concert) => (
                                <ConcertItemDetailed
                                  key={concert.concertId}
                                  concert={concert}
                                  expandedSetlists={expandedSetlists}
                                  toggleSetlist={toggleSetlist}
                                  handleShowOtherArtists={
                                    handleShowOtherArtists
                                  }
                                  otherArtistsData={otherArtistsData}
                                  loadingOtherArtists={loadingOtherArtists}
                                  handleRemoveFromMySets={
                                    removeConcertFromCollection
                                  }
                                  currentArtistName={null}
                                />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
            <div className="artist-details-panel">
              {filteredArtists
                .filter((artist) => expandedArtists.has(artist.artistId))
                .map((artist) => (
                  <div key={artist.artistId} className="artist-details-content">
                    <div className="artist-details-header">
                      <div className="header-content-wrapper">
                        <span className="artist-details-title">
                          {artist.artistName}
                        </span>
                        {artist.concerts.length > 1 && (
                          <button
                            className="see-all-songs-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedArtist(artist);
                              setShowAllSongsModal(true);
                            }}
                          >
                            See all songs
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="concerts-list">
                      {artist.concerts
                        .sort(
                          (a, b) =>
                            new Date(b.eventDate) - new Date(a.eventDate),
                        )
                        .map((concert) => (
                          <ConcertItemDetailed
                            key={concert.concertId}
                            concert={concert}
                            expandedSetlists={expandedSetlists}
                            toggleSetlist={toggleSetlist}
                            handleShowOtherArtists={handleShowOtherArtists}
                            otherArtistsData={otherArtistsData}
                            loadingOtherArtists={loadingOtherArtists}
                            handleRemoveFromMySets={removeConcertFromCollection}
                            currentArtistName={null}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              {filteredArtists.filter((artist) =>
                expandedArtists.has(artist.artistId),
              ).length === 0 && (
                <div className="no-selection">
                  <p>Select an artist to view their concerts</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ArtistStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        concerts={profileData?.concerts || []}
      />

      <AllSongsModal
        isOpen={showAllSongsModal}
        onClose={() => {
          setShowAllSongsModal(false);
          setSelectedArtist(null);
        }}
        artist={selectedArtist}
      />

      <PublicFollowersList
        isOpen={showFollowersList}
        onClose={() => setShowFollowersList(false)}
        displayName={profileData?.profile?.displayName}
      />
    </div>
  );
};

export default PublicProfile;
