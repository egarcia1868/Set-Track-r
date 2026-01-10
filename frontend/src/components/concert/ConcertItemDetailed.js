import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUserConcerts } from "../../context/UserConcertsContext";
import RemoveConfirmationModal from "../common/RemoveConfirmationModal";

const ConcertItemDetailed = ({
  concert,
  expandedSetlists,
  toggleSetlist,
  handleShowOtherArtists,
  otherArtistsData,
  loadingOtherArtists,
  handleRemoveFromMySets,
  currentArtistName, // New prop to identify the current artist being viewed
}) => {
  const { isAuthenticated } = useAuth();
  const { isAlreadySaved, addConcertToCollection } = useUserConcerts();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const handleRemoveClick = (setlist) => {
    // Check if this concert belongs to the current artist being viewed
    const concertArtistName = setlist.artist?.name;
    const shouldShowConfirmation =
      currentArtistName &&
      concertArtistName &&
      concertArtistName.toLowerCase() === currentArtistName.toLowerCase() &&
      localStorage.getItem("skipRemoveConfirmation") !== "true";

    if (shouldShowConfirmation) {
      setPendingRemoval(setlist);
      setShowConfirmModal(true);
    } else {
      // Remove without confirmation
      handleRemoveFromMySets(setlist);
    }
  };

  const confirmRemoval = () => {
    if (pendingRemoval) {
      handleRemoveFromMySets(pendingRemoval);
      setPendingRemoval(null);
    }
    setShowConfirmModal(false);
  };

  const cancelRemoval = () => {
    setPendingRemoval(null);
    setShowConfirmModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date unknown";

    // Handle different date formats
    let date;

    if (dateString.includes("-")) {
      // Handle formats like "DD-MM-YYYY" or "YYYY-MM-DD"
      const parts = dateString.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD format - use UTC to avoid timezone offset
          const [year, month, day] = parts;
          date = new Date(
            Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
          );
        } else {
          // DD-MM-YYYY format (common in some APIs)
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

  const setlistExpanded = expandedSetlists.has(concert.concertId);
  const hasSetlist = concert.sets && concert.sets.length > 0;


  console.log('concert.sets: ', concert);

  // Count total songs across all sets
  const totalSongs = hasSetlist
    ? concert.sets.reduce((count, set) => count + (set.song?.length || 0), 0)
    : 0;

  return (
    <div className="concert-item-detailed">
      <div className="concert-main-info">
        <div className="concert-header-info">
          <div className="concert-venue">
            {typeof concert.venue === "object"
              ? concert.venue?.name || "Unknown Venue"
              : concert.venue || "Unknown Venue"}
          </div>
          <div className="concert-location">
            {concert.venue?.city
              ? `${concert.venue.city.name}, ${concert.venue.city.state}, ${concert.venue.city.country.name}`
              : concert.city
                ? typeof concert.city === "object"
                  ? concert.city?.name || "Unknown City"
                  : concert.city
                : "Unknown Location"}
          </div>
          <div className="concert-date">{formatDate(concert.eventDate)}</div>
        </div>

        <div className="concert-actions">
          <button
            className="other-artists-link"
            onClick={() => handleShowOtherArtists(concert)}
            title="View other artists who performed at this show"
            disabled={loadingOtherArtists[concert.concertId]}
          >
            {loadingOtherArtists[concert.concertId]
              ? "Loading..."
              : otherArtistsData[concert.concertId]
                ? "Hide other artists"
                : "Show other artists at this show →"}
          </button>

          {otherArtistsData[concert.concertId] && (
            <div className="other-artists-dropdown">
              {otherArtistsData[concert.concertId].length > 0 ? (
                <ul className="other-artists-list">
                  {otherArtistsData[concert.concertId].map((setlist, index) => (
                    <li key={index} className="other-artist-item">
                      <span className="artist-name">
                        {setlist.artist?.name || "Unknown Artist"}
                      </span>
                      {isAuthenticated &&
                        (isAlreadySaved(setlist) ? (
                          <button
                            className="remove-from-sets-btn"
                            onClick={() => handleRemoveClick(setlist)}
                            title="Remove this concert from your collection"
                          >
                            Remove from my sets
                          </button>
                        ) : (
                          <button
                            className="add-to-sets-btn"
                            onClick={() => addConcertToCollection(setlist)}
                            title="Add this concert to your collection"
                          >
                            Add to my sets
                          </button>
                        ))}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-other-artists">
                  No other artists found for this show.
                </div>
              )}
            </div>
          )}
        </div>

        {hasSetlist && (
          <button
            className="setlist-toggle-btn"
            onClick={() => toggleSetlist(concert.concertId)}
          >
            <span className="setlist-text">
              Setlist ({totalSongs} songs)
            </span>
            <span className="setlist-arrow">{setlistExpanded ? "▼" : "▲"}</span>
          </button>
        )}

        {!hasSetlist && <div className="no-setlist">Setlist unavailable</div>}
      </div>

      {hasSetlist && setlistExpanded && (
        <div className="setlist-content">
          {concert.sets.map((set, setIndex) => (
            <div key={setIndex} className="set-section">
              {set.encore ? (
                <h4 className="set-name">Encore {set.encore}:</h4>
              ) : set.name ? (
                <h4 className="set-name">{set.name}</h4>
              ) : null}
              <ol className="songs-list">
                {set.song && set.song.map((song, songIndex) => (
                  <li key={songIndex} className="song-item">
                    {song.name}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      <RemoveConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={confirmRemoval}
        onCancel={cancelRemoval}
        artistName={currentArtistName}
      />
    </div>
  );
};

export default ConcertItemDetailed;
