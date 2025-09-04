import { useState } from "react";

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

  return (
    <div className="grouped-concert-details">
      <div className="venue-header">
        <h3><strong>{venue}</strong></h3>
        <p>{city}, {state}, {country}</p>
        <p>{formatDate(date)}</p>
        
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
      </div>
    </div>
  );
};

export default GroupedConcertDetails;