import { useLocation, useNavigate } from "react-router-dom";
import ConcertDetails from "../components/ConcertDetails";
import SongsDetails from "../components/SongsDetails";
import { useState, useMemo, useEffect } from "react";
// import { useConcertsContext } from "../hooks/useConcertsContext";

// const BASE_URL = process.env.NODE_ENV === "production"
// ? "https://set-trackr-backend.onrender.com" // Deployed backend URL
// : "http://localhost:4000"; // Local backend URL (adjust port if needed)

const ArtistConcerts = () => {
  // const { dispatch } = useConcertsContext();
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [expandTracks, setExpandTracks] = useState(false);

  const location = useLocation();
  const { artist = {} } = location.state || {};
  // const { artistName, concerts } = artist;
  const { artistName, concerts: initialConcerts } = artist;
  const [concerts, setConcerts] = useState(initialConcerts || []);
  const [concertList, setConcertList] = useState(artist?.concerts || []);


  const navigate = useNavigate();

  useEffect(() => {
    if (!location.state) {
      navigate("/");
    }
  }, [location.state, navigate]);

  // useEffect(() => {
  //   const fetchConcerts = async () => {
  //     // Dynamically determine the base URL based on the environment

  //     const response = await fetch(`${BASE_URL}/api/concerts`);
  //     const json = await response.json();

  //     if (response.ok) {
  //       dispatch({ type: "UPDATE_ARTISTS", payload: [...json] });
  //     } else {
  //       console.error("Error fetching concerts:", json);
  //     }
  //   };

  //   fetchConcerts();
  // }, [dispatch]);

  // Sort concerts by date (descending order)
  const sortedConcerts = useMemo(
    () =>
      [...concertList].sort(
        (a, b) =>
          new Date(...b.eventDate.split("-").reverse()) -
          new Date(...a.eventDate.split("-").reverse())
      ),
    [concertList]
  );

  // Extract unique years from sorted concerts
  const sortedConcertYears = useMemo(
    () => [
      ...new Set(
        sortedConcerts.map((concert) => concert.eventDate.split("-")[2])
      ),
    ],
    [sortedConcerts]
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
      expandedYears.size > 0 ? new Set() : new Set(sortedConcertYears)
    );
  };

  // const handleDeleteConcert = (concertId) => {
  //   setConcerts((prevConcerts) =>
  //     prevConcerts.filter((c) => c._id !== concertId)
  //   );
  // };

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
                      (concert) => concert.eventDate.split("-")[2] === year
                    )
                    .map((concert) => (
                      <ConcertDetails
                        key={concert.concertId || concert.id}
                        concert={concert}
                        artistObjectId={artist._id}
                        onDelete={(deletedId) =>
                          setConcertList(prev => prev.filter(c => c.concertId !== deletedId))
                        }
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
