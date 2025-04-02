import { useLocation } from "react-router-dom";
import ConcertDetails from "../components/ConcertDetails";
import { useState, useMemo } from "react";

const ArtistConcerts = () => {
  const [expandedYears, setExpandedYears] = useState(new Set()); 
  const [expandTracks, setExpandTracks] = useState(false);
  const [caratState, setCaratState] = useState({});
  const [expandAllYears, setExpandAllYears] = useState(false);

  const location = useLocation();
  const { artist: { artistName, concerts = [] } = {} } = location.state || {};

  // Sort concerts by date (descending order)
  const sortedConcerts = useMemo(() => 
    [...concerts].sort((a, b) => {
      const [dayA, monthA, yearA] = a.eventDate.split("-").map(Number);
      const [dayB, monthB, yearB] = b.eventDate.split("-").map(Number);
      return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
    }), 
    [concerts]
  );

  // Extract unique years from sortedConcerts
  const sortedConcertYears = useMemo(() => 
    [...new Set(sortedConcerts.map(concert => getYearFromDate(concert.eventDate)))], 
    [sortedConcerts]
  );

  function getYearFromDate(dateString) {
    return Number(dateString.split('-')[2]);
  }

  function toggleYear(year) {
    setCaratState(prev => ({ ...prev, [year]: !prev[year] }));

    setExpandedYears(prev => {
      const newSet = new Set(prev);
      newSet.has(year) ? newSet.delete(year) : newSet.add(year);
      return newSet;
    });
  }

  function expandAll() {
    setExpandedYears(prev => {
      const newSet = new Set(expandAllYears ? [] : sortedConcertYears);
      return newSet;
    });
  }

  return (
    <>
      <h1>{artistName}</h1>
      <div className="concerts">
        <h2>
          Songs By # Of Times Seen{" "}
          <span 
            style={{ fontSize: ".5rem", cursor: "pointer", color: "#1a0dab" }} 
            onClick={() => setExpandTracks(prev => !prev)}
          >
            {expandTracks ? "collapse" : "expand"}
          </span>
        </h2>

        <h2>
          Concerts By Year{" "}
          <span 
            style={{ fontSize: ".5rem", cursor: "pointer", color: "#1a0dab" }} 
            onClick={() => {
              setExpandAllYears(prev => !prev);
              expandAll();
            }}
          >
            {expandAllYears ? "collapse all" : "expand all"}
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
                    .filter(concert => getYearFromDate(concert.eventDate) === year)
                    .map(concert => (
                      <ConcertDetails key={concert.concertId || concert.id} concert={concert} />
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
