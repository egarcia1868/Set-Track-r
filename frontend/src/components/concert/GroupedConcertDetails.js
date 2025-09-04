import { useState } from "react";
import { BASE_URL } from "../../utils/config";

const GroupedConcertDetails = ({ 
  venueGroup, 
  selectedConcerts, 
  onConcertToggle, 
  onSelectAll,
  isAuthenticated,
  userConcerts 
}) => {
  const [showSetLists, setShowSetLists] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [additionalArtists, setAdditionalArtists] = useState([]);
  const [loadingAdditional, setLoadingAdditional] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  const { venue, city, state, country, date, concerts } = venueGroup;
  
  const toggleSetList = (concertId) => {
    setShowSetLists(prev => ({
      ...prev,
      [concertId]: !prev[concertId]
    }));
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    onSelectAll(venueGroup, newSelectAll);
  };

  const formatDate = (dateString) => {
    const [day, month, year] = dateString.split("-");
    const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);
    
    return formattedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isAlreadySaved = (concert) => {
    return userConcerts.some(artist => 
      artist.concerts?.some(savedConcert => 
        savedConcert.concertId === concert.id
      )
    );
  };

  const loadAdditionalArtists = async () => {
    if (concerts.length === 0) return;
    
    setLoadingAdditional(true);
    try {
      const firstConcert = concerts[0];
      const venueId = firstConcert._venueMetadata?.venueId;
      const eventDate = firstConcert._venueMetadata?.eventDate;
      
      if (!venueId || !eventDate) {
        console.error("Missing venue metadata");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/concerts/additional/${venueId}/${eventDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        // Filter out artists already in the initial results
        const existingIds = new Set(concerts.map(c => c.id));
        const newArtists = data.setlist?.filter(setlist => !existingIds.has(setlist.id)) || [];
        
        setAdditionalArtists(newArtists);
        setShowAdditional(true);
      } else {
        console.error("Failed to load additional artists");
      }
    } catch (error) {
      console.error("Error loading additional artists:", error);
    } finally {
      setLoadingAdditional(false);
    }
  };

  return (
    <div className="grouped-concert-details">
      <div className="venue-header">
        <div className="venue-info">
          <h3><strong>{venue}</strong></h3>
          <p>{city}, {state}, {country}</p>
          <p>{formatDate(date)}</p>
        </div>
        
        <div className="venue-actions">
          {isAuthenticated && concerts.length > 1 && (
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              Select all artists
            </label>
          )}
          
          {!showAdditional && (
            <button 
              className="load-more-button"
              onClick={loadAdditionalArtists}
              disabled={loadingAdditional}
            >
              {loadingAdditional ? "Loading..." : "Show other artists"}
            </button>
          )}
        </div>
      </div>

      <div className="artists-list">
        {concerts.map((concert) => {
          const isSelected = selectedConcerts.includes(concert.id);
          const alreadySaved = isAlreadySaved(concert);
          const showSetList = showSetLists[concert.id];

          return (
            <div key={concert.id} className="artist-item">
              <div className="artist-header">
                <div className="artist-info">
                  <span className="artist-name">{concert.artist.name}</span>
                </div>
                
                {isAuthenticated && (
                  <div className="artist-actions">
                    {alreadySaved ? (
                      <span className="already-in-collection-text">
                        Already in collection
                      </span>
                    ) : (
                      <label className="checkbox-label">
                        Add to my sets!
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onConcertToggle(concert.id)}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
        
        {/* Additional artists loaded on demand */}
        {showAdditional && additionalArtists.map((concert) => {
          const isSelected = selectedConcerts.includes(concert.id);
          const alreadySaved = isAlreadySaved(concert);

          return (
            <div key={concert.id} className="artist-item additional-artist">
              <div className="artist-header">
                <div className="artist-info">
                  <span className="artist-name">{concert.artist.name}</span>
                </div>
                
                {isAuthenticated && (
                  <div className="artist-actions">
                    {alreadySaved ? (
                      <span className="already-in-collection-text">
                        Already in collection
                      </span>
                    ) : (
                      <label className="checkbox-label">
                        Add to my sets!
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onConcertToggle(concert.id)}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupedConcertDetails;