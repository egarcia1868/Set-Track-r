import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserConcerts } from "../context/UserConcertsContext";
import { BASE_URL } from "../utils/config";
import ConcertItemDetailed from "../components/concert/ConcertItemDetailed";
import SongsDetails from "../components/concert/SongsDetails";

const ArtistConcerts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { artistName: urlArtistName } = useParams();
  const { isAuthenticated, getAccessTokenSilently } = useAuth();
  const { 
    userConcerts, 
    isAlreadySaved, 
    addConcertToCollection, 
    removeConcertFromCollection 
  } = useUserConcerts();

  const [artist, setArtist] = useState({});
  const [concertList, setConcertList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get artist name from URL or state
  const artistName = urlArtistName ? decodeURIComponent(urlArtistName) : artist?.artistName;
  const [expandTracks, setExpandTracks] = useState(false);
  const [expandedSetlists, setExpandedSetlists] = useState(new Set());
  const [otherArtistsData, setOtherArtistsData] = useState({});
  const [loadingOtherArtists, setLoadingOtherArtists] = useState({});
  const [expandedYears, setExpandedYears] = useState(new Set());

  useEffect(() => {
    const loadArtistData = async () => {
      setLoading(true);
      
      // If we have artist data from navigation state, use it
      if (location.state?.artist) {
        setArtist(location.state.artist);
        setConcertList(location.state.artist.concerts || []);
        setLoading(false);
        return;
      }
      
      // If we have artistName from URL, fetch the data
      if (urlArtistName && isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(`${BASE_URL}/api/concerts/user/saved`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const decodedArtistName = decodeURIComponent(urlArtistName);
            const foundArtist = data.find(a => a.artistName === decodedArtistName);
            
            if (foundArtist) {
              setArtist(foundArtist);
              setConcertList(foundArtist.concerts || []);
            } else {
              // Artist not found in user's collection
              navigate("/");
            }
          }
        } catch (error) {
          console.error('Error fetching artist data:', error);
          navigate("/");
        }
      } else if (!urlArtistName) {
        navigate("/");
      }
      
      setLoading(false);
    };

    loadArtistData();
  }, [urlArtistName, location.state, isAuthenticated, getAccessTokenSilently, navigate]);

  const handleRemoveFromMySets = async (setlistData) => {
    const success = await removeConcertFromCollection(setlistData);
    
    // If the removed concert belongs to the current artist, remove it from the display
    if (success && setlistData.artist?.name && 
        setlistData.artist.name.toLowerCase() === artistName.toLowerCase()) {
      setConcertList(prev => prev.filter(concert => 
        concert.concertId !== setlistData.id && concert.id !== setlistData.id
      ));
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

  // Expand all years when concert data is loaded
  useEffect(() => {
    if (sortedConcertYears.length > 0) {
      setExpandedYears(new Set(sortedConcertYears));
    }
  }, [sortedConcertYears]);

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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '1.2rem'
      }}>
        Loading artist...
      </div>
    );
  }

  if (!artistName) return null;

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
                        handleRemoveFromMySets={handleRemoveFromMySets}
                        currentArtistName={artistName}
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
