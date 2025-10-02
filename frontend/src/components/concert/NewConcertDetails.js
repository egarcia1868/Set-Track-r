import { useState } from "react";

const NewConcertDetails = ({
  concert,
  isChecked,
  onCheckboxChange,
  isAlreadySaved,
  isAuthenticated,
}) => {
  const [showSetList, setShowSetList] = useState(false);

  const {
    artist,
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
    sets: setsArray,
  } = concert;

  const sets = setsArray.set;

  const inputDate = eventDate;
  const [day, month, year] = inputDate.split("-");
  const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);

  const outputDate = formattedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="concert-details">
      <h3>{artist.name}</h3>
      <p>
        <strong>{venueName}</strong>
      </p>
      <p>
        {cityName}, {state}, {countryName}
      </p>
      <p>{outputDate}</p>
      <p
        onClick={(e) => {
          e.stopPropagation();
          setShowSetList((prev) => !prev);
        }}
        style={{ cursor: "pointer" }}
      >
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
      <div className="concert-details-links">
        <a
          style={{ fontSize: ".65rem" }}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          More Info
        </a>
        {isAuthenticated && isAlreadySaved ? (
          <span className="already-in-collection-text">
            Already in collection
          </span>
        ) : isAuthenticated ? (
          <label
            className="checkbox-label"
            onClick={(e) => e.stopPropagation()}
          >
            Add to my sets!
            <input
              type="checkbox"
              onChange={onCheckboxChange}
              checked={isChecked}
            />
          </label>
        ) : null}
      </div>
    </div>
  );
};

export default NewConcertDetails;
