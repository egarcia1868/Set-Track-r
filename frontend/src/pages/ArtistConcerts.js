import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { BASE_URL } from "../utils/config";
import ConcertItemDetailed from "../components/concert/ConcertItemDetailed";
import SongsDetails from "../components/concert/SongsDetails";

const ArtistConcerts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0();

  const { artist = {} } = location.state || {};
  const { artistName } = artist;
  const [concertList, setConcertList] = useState(artist?.concerts || []);
  const [expandTracks, setExpandTracks] = useState(false);
  const [expandedSetlists, setExpandedSetlists] = useState(new Set());
  const [otherArtistsData, setOtherArtistsData] = useState({});
  const [loadingOtherArtists, setLoadingOtherArtists] = useState({});
  const [userConcerts, setUserConcerts] = useState([]);

  useEffect(() => {
    if (!location.state) navigate("/");
  }, [location.state, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserConcerts();
    }
  }, [isAuthenticated]);

  const fetchUserConcerts = async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts/user/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserConcerts(data);
      }
    } catch (error) {
      console.error("Error fetching user concerts:", error);
    }
  };

  const isAlreadySaved = (setlist) => {
    return userConcerts.some(artist => 
      artist.concerts?.some(concert => 
        concert.concertId === setlist.id
      )
    );
  };

  const handleAddToMySets = async (setlistData) => {
    if (!isAuthenticated) {
      alert("You must be logged in to add concerts to your collection.");
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          concertData: [setlistData],
          user: user,
        }),
      });
      
      if (response.ok) {
        alert(`Added ${setlistData.artist?.name || "concert"} to your collection!`);
        // Refresh user concerts to update the UI
        fetchUserConcerts();
      } else {
        const errorData = await response.json();
        console.error("Failed to add concert:", errorData);
        alert(`Failed to add concert: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding concert:", error);
      alert("Error adding concert to your collection.");
    }
  };

  const handleShowOtherArtists = async (concert) => {
    const concertKey = concert.concertId;
    
    // If already loaded, toggle dropdown
    if (otherArtistsData[concertKey]) {
      setOtherArtistsData(prev => ({
        ...prev,
        [concertKey]: null
      }));
      return;
    }

    try {
      setLoadingOtherArtists(prev => ({ ...prev, [concertKey]: true }));
      
      const venue = typeof concert.venue === "object" ? concert.venue?.name : concert.venue;
      const date = concert.eventDate;
      
      const response = await fetch(`${BASE_URL}/api/concerts?date=${encodeURIComponent(date)}&venueName=${encodeURIComponent(venue)}`);
      
      if (response.ok) {
        const concertData = await response.json();
        const setlists = concertData.setlist || [];
        
        setOtherArtistsData(prev => ({
          ...prev,
          [concertKey]: setlists
        }));
      } else {
        console.error("Failed to fetch other artists:", response.status);
        setOtherArtistsData(prev => ({
          ...prev,
          [concertKey]: []
        }));
      }
    } catch (error) {
      console.error("Error fetching other artists:", error);
      setOtherArtistsData(prev => ({
        ...prev,
        [concertKey]: []
      }));
    } finally {
      setLoadingOtherArtists(prev => ({ ...prev, [concertKey]: false }));
    }
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

  // Sort concerts by date (descending order)
  const sortedConcerts = useMemo(
    () =>
      [...concertList].sort(
        (a, b) =>
          new Date(...b.eventDate.split("-").reverse()) -
          new Date(...a.eventDate.split("-").reverse()),
      ),
    [concertList],
  );

  // Extract unique years from sorted concerts
  const sortedConcertYears = useMemo(
    () => [
      ...new Set(
        sortedConcerts.map((concert) => concert.eventDate.split("-")[2]),
      ),
    ],
    [sortedConcerts],
  );

  const [expandedYears, setExpandedYears] = useState(
    new Set(sortedConcertYears),
  );

  const toggleYear = (year) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      newSet.has(year) ? newSet.delete(year) : newSet.add(year);
      return newSet;
    });
  };

  const expandOrCollapseAll = () => {
    setExpandedYears(
      expandedYears.size > 0 ? new Set() : new Set(sortedConcertYears),
    );
  };

  if (!location.state) return null;

  return (
    <>
      <h1>{artistName}</h1>
      <div className="concerts">
        <h2>
          Songs By # Of Times Seen{" "}
          <span
            style={{ fontSize: ".5rem", cursor: "pointer", color: "#1a0dab" }}
            onClick={() => setExpandTracks((prev) => !prev)}
          >
            {expandTracks ? "collapse" : "expand"}
          </span>
        </h2>
        {expandTracks ? <SongsDetails concerts={concertList} /> : null}

        <h2>
          Concerts By Year{" "}
          <span
            style={{ fontSize: ".5rem", cursor: "pointer", color: "#1a0dab" }}
            onClick={expandOrCollapseAll}
          >
            {expandedYears.size > 0 ? "collapse all" : "expand all"}
          </span>
        </h2>

        {sortedConcertYears.length > 0 ? (
          sortedConcertYears.map((year) => (
            <div key={year}>
              <h3
                style={{ cursor: "pointer", margin: "10px 0" }}
                onClick={() => toggleYear(year)}
              >
                {year} {expandedYears.has(year) ? "▼" : "▲"}
              </h3>

              {expandedYears.has(year) && (
                <div>
                  {sortedConcerts
                    .filter(
                      (concert) => concert.eventDate.split("-")[2] === year,
                    )
                    .map((concert) => (
                      <ConcertItemDetailed
                        key={concert.concertId || concert.id}
                        concert={concert}
                        expandedSetlists={expandedSetlists}
                        toggleSetlist={toggleSetlist}
                        handleShowOtherArtists={handleShowOtherArtists}
                        otherArtistsData={otherArtistsData}
                        loadingOtherArtists={loadingOtherArtists}
                        isAlreadySaved={isAlreadySaved}
                        handleAddToMySets={handleAddToMySets}
                        isAuthenticated={isAuthenticated}
                      />
                    ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No concerts for this artist</p>
        )}
      </div>
    </>
  );
};

export default ArtistConcerts;
