import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../utils/config";

const PublicProfile = () => {
  const { shareableId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedArtists, setExpandedArtists] = useState(new Set());
  const [expandedSetlists, setExpandedSetlists] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPublicProfile();
  }, [shareableId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleArtist = (artistId) => {
    setExpandedArtists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(artistId)) {
        newSet.delete(artistId);
      } else {
        newSet.add(artistId);
      }
      return newSet;
    });
  };

  const toggleSetlist = (concertId) => {
    setExpandedSetlists(prev => {
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
      const allArtistIds = profileData.concerts.map(artist => artist.artistId);
      setExpandedArtists(new Set(allArtistIds));
    }
  };

  const collapseAll = () => {
    setExpandedArtists(new Set());
  };

  const allExpanded = profileData?.concerts ? 
    profileData.concerts.every(artist => expandedArtists.has(artist.artistId)) : false;

  // Filter artists based on search term
  const filteredArtists = profileData?.concerts?.filter(artist =>
    artist.artistName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const fetchPublicProfile = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/concerts/profile/${shareableId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Public profile data:", data);
        if (data.concerts && data.concerts.length > 0) {
          console.log("First artist concerts:", data.concerts[0].concerts);
          // Log date formats to debug Invalid Date issue
          const firstConcerts = data.concerts[0].concerts;
          if (firstConcerts && firstConcerts.length > 0) {
            console.log("Date formats found:");
            firstConcerts.slice(0, 3).forEach((concert, i) => {
              console.log(`Concert ${i}: eventDate = "${concert.eventDate}" (type: ${typeof concert.eventDate})`);
              console.log(`Concert ${i} full structure:`, concert);
              console.log(`Concert ${i} has sets:`, !!concert.sets, 'Sets length:', concert.sets?.length);
              console.log(`Concert ${i} venue structure:`, concert.venue);
              console.log(`Concert ${i} city structure:`, concert.city);
            });
          }
        }
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

  const formatDate = (dateString) => {
    if (!dateString) return "Date unknown";
    
    // Handle different date formats
    let date;
    
    if (dateString.includes('-')) {
      // Handle formats like "DD-MM-YYYY" or "YYYY-MM-DD"
      const parts = dateString.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD format - use UTC to avoid timezone offset
          const [year, month, day] = parts;
          date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        } else {
          // DD-MM-YYYY format (common in some APIs)
          const [day, month, year] = parts;
          date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        }
      } else {
        date = new Date(dateString + 'T00:00:00Z');
      }
    } else {
      date = new Date(dateString + 'T00:00:00Z');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return "Date unknown";
    }
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
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
      <div className="profile-header">
        <h1>{profileData.profile.displayName}</h1>
        {profileData.profile.bio && (
          <p className="profile-bio">{profileData.profile.bio}</p>
        )}
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-number">{profileData.stats.totalConcerts}</span>
            <span className="stat-label">Concerts</span>
          </div>
          <div className="stat">
            <span className="stat-number">{profileData.stats.totalArtists}</span>
            <span className="stat-label">Artists</span>
          </div>
        </div>
      </div>

      <div className="concerts-section">
        <div className="concerts-header">
          {profileData.concerts.length > 0 && (
            <input
              type="text"
              placeholder="Search artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="artist-search-input-inline"
            />
          )}
          <h2>Concert History</h2>
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
          <p className="no-concerts">No concerts recorded yet.</p>
        ) : filteredArtists.length === 0 ? (
          <p className="no-concerts">No artists found matching "{searchTerm}"</p>
        ) : (
          <div className="artists-list">
            {filteredArtists
              .sort((a, b) => a.artistName.localeCompare(b.artistName))
              .map((artist) => {
                const isExpanded = expandedArtists.has(artist.artistId);
                return (
                  <div key={artist.artistId} className="artist-card">
                    <div 
                      className="artist-header"
                      onClick={() => toggleArtist(artist.artistId)}
                    >
                      <h3 className="artist-name">{artist.artistName}</h3>
                      <div className="artist-summary">
                        <span className="concert-count">
                          {artist.concerts.length} concert{artist.concerts.length !== 1 ? "s" : ""}
                        </span>
                        <span className="expand-icon">
                          {isExpanded ? "▼" : "▲"}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="concerts-list">
                        {artist.concerts
                          .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
                          .map((concert) => {
                            const setlistExpanded = expandedSetlists.has(concert.concertId);
                            const hasSetlist = concert.sets && concert.sets.length > 0;
                            
                            // Flatten all songs from all sets into a single array
                            const allSongs = hasSetlist ? 
                              concert.sets.flatMap(set => 
                                set.song ? set.song.map(song => song.name) : []
                              ) : [];
                            
                            return (
                              <div key={concert.concertId} className="concert-item-detailed">
                                <div className="concert-main-info">
                                  <div className="concert-header-info">
                                    <div className="concert-venue">
                                      {typeof concert.venue === 'object' 
                                        ? concert.venue?.name || 'Unknown Venue' 
                                        : concert.venue || 'Unknown Venue'}
                                    </div>
                                    <div className="concert-location">
                                      {concert.venue?.city ? (
                                        `${concert.venue.city.name}, ${concert.venue.city.state}, ${concert.venue.city.country.name}`
                                      ) : concert.city ? (
                                        typeof concert.city === 'object' ? concert.city?.name || 'Unknown City' : concert.city
                                      ) : (
                                        'Unknown Location'
                                      )}
                                    </div>
                                    <div className="concert-date">{formatDate(concert.eventDate)}</div>
                                  </div>
                                  
                                  {hasSetlist && (
                                    <button 
                                      className="setlist-toggle-btn"
                                      onClick={() => toggleSetlist(concert.concertId)}
                                    >
                                      <span className="setlist-text">
                                        Setlist ({allSongs.length} songs)
                                      </span>
                                      <span className="setlist-arrow">
                                        {setlistExpanded ? "▼" : "▲"}
                                      </span>
                                    </button>
                                  )}
                                  
                                  {!hasSetlist && (
                                    <div className="no-setlist">
                                      Setlist unavailable
                                    </div>
                                  )}
                                </div>
                                
                                {hasSetlist && setlistExpanded && (
                                  <div className="setlist-content">
                                    <ol className="songs-list">
                                      {allSongs.map((song, index) => (
                                        <li key={index} className="song-item">
                                          {song}
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;