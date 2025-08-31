import { useEffect, useState, useCallback } from "react";
import { BASE_URL } from "../utils/config";
import ArtistDetails from "../components/artist/ArtistDetails";
import { useConcertsContext } from "../hooks/useConcertsContext";
import ConcertSearchForm from "../components/concert/ConcertSearchForm";
import ProfileSettings from "../components/common/ProfileSettings";
import FollowingList from "../components/common/FollowingList";
import FollowersList from "../components/common/FollowersList";
import { useAuth0 } from "@auth0/auth0-react";

const Dashboard = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const { artists, dispatch } = useConcertsContext();
  const [isFetchingConcerts, setIsFetchingConcerts] = useState(true);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConcertSearchModal, setShowConcertSearchModal] = useState(false);

  // Handle modal body scroll prevention
  useEffect(() => {
    if (showConcertSearchModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showConcertSearchModal]);

  const fetchConcerts = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts/user/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();

      console.log("Dashboard: API response status:", response.status);
      console.log("Dashboard: API response data:", json);

      if (response.ok) {
        console.log("Dashboard: Setting artists data:", json);
        dispatch({ type: "UPDATE_ARTISTS", payload: [...json] });
      } else {
        console.error("Error fetching concerts:", json);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setIsFetchingConcerts(false);
    }
  }, [dispatch, getAccessTokenSilently]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      console.log("User not authenticated or loading, skipping fetch.");
      return;
    }
    fetchConcerts();
  }, [isAuthenticated, isLoading, fetchConcerts]);

  // Helper function to get sort name (ignoring "The" prefix)
  const getSortName = (artistName) => {
    if (artistName.toLowerCase().startsWith("the ")) {
      return artistName.substring(4); // Remove "The " prefix
    }
    return artistName;
  };

  // Filter and sort artists
  const filteredArtists = artists.filter((artist) =>
    artist.artistName.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  filteredArtists.sort((a, b) =>
    getSortName(a.artistName).localeCompare(getSortName(b.artistName)),
  );

  return (
    <div className="home">
      <div className="concerts">
        <div className="dashboard-header">
          <div className="desktop-search-field">
            {artists.length > 0 && (
              <input
                type="text"
                placeholder="Search your artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="artist-search-input-inline"
              />
            )}
          </div>
          <div className="header-buttons">
            <div className="primary-actions">
              <div className="mobile-search-btn-header">
                <button
                  className="mobile-search-btn-small"
                  onClick={() => setShowConcertSearchModal(true)}
                >
                  Find new setlist
                </button>
              </div>
              <button
                className="profile-settings-btn"
                onClick={() => setShowProfileSettings(true)}
              >
                Profile settings
              </button>
            </div>
            <div className="social-actions">
              <button
                className="following-list-btn"
                onClick={() => setShowFollowingList(true)}
              >
                Following
              </button>
              <button
                className="followers-list-btn"
                onClick={() => setShowFollowersList(true)}
              >
                Followers
              </button>
            </div>
          </div>
        </div>

        <div className="mobile-search-field">
          {artists.length > 0 && (
            <input
              type="text"
              placeholder="Search artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="artist-search-input-inline mobile-search-input"
            />
          )}
        </div>

        {searchTerm && artists.length > 0 && (
          <div className="search-results-info">
            {filteredArtists.length} of {artists.length} artists
          </div>
        )}

        {isFetchingConcerts ? (
          <div>Loading...</div>
        ) : artists.length === 0 ? (
          <h3>No Saved Concerts yet</h3>
        ) : filteredArtists.length === 0 ? (
          <h3>No artists found matching "{searchTerm}"</h3>
        ) : (
          <div className="artists-grid">
            {filteredArtists.map((artist) => (
              <ArtistDetails key={artist._id} artist={artist} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop form - hidden on mobile */}
      <div className="desktop-search-form">
        <ConcertSearchForm refreshConcerts={fetchConcerts} />
      </div>

      {/* Mobile modal */}
      {showConcertSearchModal && (
        <div className="modal-overlay">
          <div className="concert-search-modal">
            <div className="modal-header">
              <h2>Find new setlist</h2>
              <button
                className="close-btn"
                onClick={() => setShowConcertSearchModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <ConcertSearchForm
                refreshConcerts={fetchConcerts}
                onClose={() => setShowConcertSearchModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />

      <FollowingList
        isOpen={showFollowingList}
        onClose={() => setShowFollowingList(false)}
      />

      <FollowersList
        isOpen={showFollowersList}
        onClose={() => setShowFollowersList(false)}
      />
    </div>
  );
};

export default Dashboard;
