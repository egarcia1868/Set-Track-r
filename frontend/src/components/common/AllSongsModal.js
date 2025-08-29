import { useState, useEffect } from "react";

const AllSongsModal = ({ isOpen, onClose, artist }) => {
  const [expandedSongs, setExpandedSongs] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSong = (songName) => {
    setExpandedSongs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(songName)) {
        newSet.delete(songName);
      } else {
        newSet.add(songName);
      }
      return newSet;
    });
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.classList.remove("modal-open");
    };
  }, [isOpen, onClose]);

  if (!isOpen || !artist) return null;

  // Aggregate all songs from all concerts for this artist with performance details
  const aggregateSongs = () => {
    const songData = {};

    artist.concerts.forEach((concert) => {
      if (concert.sets && concert.sets.length > 0) {
        concert.sets.forEach((set) => {
          if (set.song && set.song.length > 0) {
            set.song.forEach((song) => {
              const songName = song.name;

              if (!songData[songName]) {
                songData[songName] = {
                  name: songName,
                  count: 0,
                  performances: [],
                };
              }

              songData[songName].count += 1;
              songData[songName].performances.push({
                date: concert.eventDate,
                venue:
                  typeof concert.venue === "object"
                    ? concert.venue?.name || "Unknown Venue"
                    : concert.venue || "Unknown Venue",
                location: concert.venue?.city
                  ? `${concert.venue.city.name}, ${concert.venue.city.state}, ${concert.venue.city.country.name}`
                  : concert.city
                    ? typeof concert.city === "object"
                      ? concert.city?.name || "Unknown City"
                      : concert.city
                    : "Unknown Location",
              });
            });
          }
        });
      }
    });

    // Helper function to parse dates properly
    const parseEventDate = (dateString) => {
      if (!dateString) return new Date(0);

      let date;

      if (dateString.includes("-")) {
        const parts = dateString.split("-");
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            const [year, month, day] = parts;
            date = new Date(
              Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
            );
          } else {
            const [day, month, year] = parts;
            date = new Date(
              Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
            );
          }
        } else {
          date = new Date(dateString + "T00:00:00Z");
        }
      } else {
        date = new Date(dateString + "T00:00:00Z");
      }

      if (isNaN(date.getTime())) {
        return new Date(0);
      }

      return date;
    };

    // Convert to array and sort by count (descending), then alphabetically by name for same count
    return Object.values(songData)
      .map((song) => ({
        ...song,
        performances: song.performances.sort(
          (a, b) => parseEventDate(b.date) - parseEventDate(a.date),
        ),
      }))
      .sort((a, b) => {
        // First sort by count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // If counts are equal, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
  };

  const allSongs = aggregateSongs();

  // Filter songs based on search term
  const filteredSongs = allSongs.filter((song) =>
    song.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalSongs = allSongs.reduce((sum, song) => sum + song.count, 0);

  // Format date function (reuse from PublicProfile)
  const formatDate = (dateString) => {
    if (!dateString) return "Date unknown";

    let date;

    if (dateString.includes("-")) {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const [year, month, day] = parts;
          date = new Date(
            Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
          );
        } else {
          const [day, month, year] = parts;
          date = new Date(
            Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
          );
        }
      } else {
        date = new Date(dateString + "T00:00:00Z");
      }
    } else {
      date = new Date(dateString + "T00:00:00Z");
    }

    if (isNaN(date.getTime())) {
      return "Date unknown";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content all-songs-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>All Songs - {artist.artistName}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="all-songs-content">
          <div className="songs-summary">
            <p>
              <strong>{allSongs.length}</strong> unique songs played{" "}
              <strong>{totalSongs}</strong> times across{" "}
              <strong>{artist.concerts.length}</strong> concerts
            </p>
          </div>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="song-search"
            />
          </div>

          <div className="songs-list-container">
            {allSongs.length === 0 ? (
              <p className="no-songs">
                No setlist data available for this artist.
              </p>
            ) : filteredSongs.length === 0 ? (
              <p className="no-songs">No songs match your search.</p>
            ) : (
              <ol className="all-songs-list">
                {filteredSongs.map((song, index) => {
                  const isExpanded = expandedSongs.has(song.name);
                  return (
                    <li key={index} className="song-count-item">
                      <div
                        className="song-header"
                        onClick={() => toggleSong(song.name)}
                      >
                        <span className="song-name">{song.name}</span>
                        <div className="song-info">
                          <span className="play-count">
                            {song.count} time{song.count !== 1 ? "s" : ""}
                          </span>
                          <span className="expand-icon">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="performance-list">
                          {song.performances.map((performance, perfIndex) => (
                            <div key={perfIndex} className="performance-item">
                              <div className="performance-date">
                                {formatDate(performance.date)}
                              </div>
                              <div className="performance-venue">
                                {performance.venue}
                              </div>
                              <div className="performance-location">
                                {performance.location}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllSongsModal;
