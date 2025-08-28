import { useEffect, useState, useCallback } from "react";
import { BASE_URL } from "../utils/config";
import ArtistDetails from "../components/artist/ArtistDetails";
import { useConcertsContext } from "../hooks/useConcertsContext";
import ConcertSearchForm from "../components/concert/ConcertSearchForm";
import ProfileSettings from "../components/common/ProfileSettings";
import { useAuth0 } from "@auth0/auth0-react";

const Dashboard = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const { artists, dispatch } = useConcertsContext();
  const [isFetchingConcerts, setIsFetchingConcerts] = useState(true);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const fetchConcerts = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts/user/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
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

  artists.sort((a, b) => a.artistName.localeCompare(b.artistName));

  return (
    <div className="home">
      <div className="concerts">
        <div className="dashboard-header">
          <button 
            className="profile-settings-btn"
            onClick={() => setShowProfileSettings(true)}
          >
            Profile Settings
          </button>
        </div>
        {isFetchingConcerts ? (
          <div>Loading...</div>
        ) : artists.length > 0 ? (
          artists.map((artist) => (
            <ArtistDetails key={artist._id} artist={artist} />
          ))
        ) : (
          <h3>No Saved Concerts yet</h3>
        )}
      </div>
      <ConcertSearchForm refreshConcerts={fetchConcerts} />
      <ProfileSettings 
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />
    </div>
  );
};

export default Dashboard;
