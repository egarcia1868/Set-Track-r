import { useState } from "react";
// import { useConcertsContext } from "../hooks/useConcertsContext";
// import { BASE_URL } from "../utils/config";
// import { useAuth0 } from "@auth0/auth0-react";

const NewConcertDetails = ({ concert }) => {
  // const { getAccessTokenSilently } = useAuth0();
  // const { dispatch } = useConcertsContext();
  const [showSetList, setShowSetList] = useState(false);

  // console.log("NCD: ", concert);

  const {
    // concertId,
    artist,
    eventDate,
    // id: concertId,
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

  // const deleteConcert = async (artistId, concertId) => {
  //   // console.log(
  //   //   "Deleting concert for artist:",
  //   //   artistObjectId,
  //   //   "Concert ID:",
  //   //   concertId,
  //   // ); // Debugging
  //   const token = await getAccessTokenSilently();

  //   const response = await fetch(
  //     `${BASE_URL}/api/concerts/${artistId}/${concertId}`,
  //     {
  //       method: "DELETE",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     },
  //   );

  //   const json = await response.json();

  //   if (!response.ok) {
  //     console.error("Failed to delete concert");
  //     return;
  //   }
  //   if (onDelete) onDelete(concertId);
  //   dispatch({ type: "DELETE_CONCERT", payload: json });
  // };
  // console.log('who cares: ', artistId)

  return (
    <div
      className="new-concert-details"
      onClick={() => setShowSetList((prev) => !prev)}
    >
      <h3>{artist.name}</h3>
      <p>
        <strong>{venueName}</strong>
      </p>
      <p>
        {cityName}, {state}, {countryName}
      </p>
      <p>{outputDate}</p>
      <p>setlist {showSetList ? "▼" : "▲"}</p>
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
        <label className="checkbox-label" onClick={(e) => e.stopPropagation()}>
          Add to my sets!
          <input type="checkbox" />
        </label>
      </div>
    </div>
  );
};

export default NewConcertDetails;
