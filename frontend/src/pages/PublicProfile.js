import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../utils/config";

const PublicProfile = () => {
  const { shareableId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedArtists, setExpandedArtists] = useState(new Set());

  useEffect(() => {
    fetchPublicProfile();
  }, [shareableId]);

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
            firstConcerts.slice(0, 5).forEach((concert, i) => {
              console.log(`Concert ${i}: eventDate = "${concert.eventDate}" (type: ${typeof concert.eventDate})`);
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
          // YYYY-MM-DD format
          date = new Date(dateString);
        } else {
          // DD-MM-YYYY format (common in some APIs)
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
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
        {profileData.concerts.length === 0 ? (
          <p className="no-concerts">No concerts recorded yet.</p>
        ) : (
          <div className="artists-grid">
            {profileData.concerts
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
                          .map((concert) => (
                            <div key={concert.concertId} className="concert-item">
                              <div className="concert-venue">
                                {typeof concert.venue === 'object' ? concert.venue?.name || 'Unknown Venue' : concert.venue}
                              </div>
                              <div className="concert-location">
                                {typeof concert.city === 'object' ? concert.city?.name || 'Unknown City' : concert.city}
                              </div>
                              <div className="concert-date">{formatDate(concert.eventDate)}</div>
                              {concert.songs && concert.songs.length > 0 && (
                                <div className="song-count">
                                  {concert.songs.length} songs
                                </div>
                              )}
                            </div>
                          ))}
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