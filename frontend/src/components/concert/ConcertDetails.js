import { useState, useEffect } from "react";
import { useConcertsContext } from "../../hooks/useConcertsContext";
import { BASE_URL } from "../../utils/config";
import { useAuth0 } from "@auth0/auth0-react";

const ConcertDetails = ({ concert, artistId, onDelete }) => {
  const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();
  const { dispatch } = useConcertsContext();
  const [showSetList, setShowSetList] = useState(false);
  const [otherArtistsData, setOtherArtistsData] = useState(null);
  const [loadingOtherArtists, setLoadingOtherArtists] = useState(false);
  const [userConcerts, setUserConcerts] = useState([]);

  const {
    concertId,
    eventDate,
    venue: {
      name: venueName,
      city: {
        name: cityName,
        state,
        country: { name: countryName },
      },
    },
    url,
    sets,
  } = concert;
  const inputDate = eventDate;
  const [day, month, year] = inputDate.split("-");
  const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);

  const outputDate = formattedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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
    return userConcerts.some((artist) =>
      artist.concerts?.some((concert) => concert.concertId === setlist.id),
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
        alert(
          `Added ${setlistData.artist?.name || "concert"} to your collection!`,
        );
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

  const handleShowOtherArtists = async () => {
    // If already loaded, toggle dropdown
    if (otherArtistsData) {
      setOtherArtistsData(null);
      return;
    }

    try {
      setLoadingOtherArtists(true);

      const response = await fetch(
        `${BASE_URL}/api/concerts?date=${encodeURIComponent(eventDate)}&venueName=${encodeURIComponent(venueName)}`,
      );

      if (response.ok) {
        const concertData = await response.json();
        const setlists = concertData.setlist || [];
        setOtherArtistsData(setlists);
      } else {
        console.error("Failed to fetch other artists:", response.status);
        setOtherArtistsData([]);
      }
    } catch (error) {
      console.error("Error fetching other artists:", error);
      setOtherArtistsData([]);
    } finally {
      setLoadingOtherArtists(false);
    }
  };

  const deleteConcert = async (artistId, concertId) => {
    const token = await getAccessTokenSilently();

    const response = await fetch(
      `${BASE_URL}/api/concerts/${artistId}/${concertId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const json = await response.json();

    if (!response.ok) {
      console.error("Failed to delete concert");
      return;
    }
    if (onDelete) onDelete(concertId);
    dispatch({ type: "DELETE_CONCERT", payload: json });
  };

  return (
    <div className="concert-details">
      <p>
        <strong>{venueName}</strong>
      </p>
      <p>
        {cityName}, {state}, {countryName}
      </p>
      <p>{outputDate}</p>
      <p onClick={() => setShowSetList((prev) => !prev)}>
        setlist {showSetList ? "▼" : "▲"}
      </p>
      {showSetList &&
        (sets ? (
          sets.map((set, index) => (
            <div key={index}>
              <p>
                <strong>{set.name}</strong>
                <strong>
                  {set.encore && "Encore"} {set.encore > 1 && set.encore}
                </strong>
              </p>
              <ol>
                {set.song.map((song, i) => (
                  <li key={i}>{song.name}</li>
                ))}
              </ol>
            </div>
          ))
        ) : (
          <p>Setlist unavailable</p>
        ))}
      <div className="concert-actions">
        <button
          className="other-artists-link"
          onClick={handleShowOtherArtists}
          disabled={loadingOtherArtists}
        >
          {loadingOtherArtists
            ? "Loading..."
            : otherArtistsData
              ? "Hide other artists"
              : "Show other artists at this show →"}
        </button>

        {otherArtistsData && (
          <div className="other-artists-dropdown">
            {otherArtistsData.length > 0 ? (
              <ul className="other-artists-list">
                {otherArtistsData.map((setlist, index) => (
                  <li key={index} className="other-artist-item">
                    <span className="artist-name">
                      {setlist.artist?.name || "Unknown Artist"}
                    </span>
                    {isAlreadySaved(setlist) ? (
                      <span className="already-saved-text">
                        Already in collection
                      </span>
                    ) : (
                      <button
                        className="add-to-sets-btn"
                        onClick={() => handleAddToMySets(setlist)}
                        disabled={!isAuthenticated}
                        title={
                          isAuthenticated
                            ? "Add this concert to your collection"
                            : "Login to add concerts"
                        }
                      >
                        Add to my sets
                      </button>
                    )}
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

      <div className="concert-details-links">
        <a
          style={{ fontSize: ".65rem" }}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          More Info
        </a>
        {onDelete && (
          <p
            style={{ fontSize: ".65rem", color: "red" }}
            onClick={() => deleteConcert(artistId, concertId)}
          >
            Remove Concert
          </p>
        )}
      </div>
    </div>
  );
};

export default ConcertDetails;
