import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../utils/config";
import { useAuth0 } from "@auth0/auth0-react";

const ConcertDetailsModal = ({ isOpen, onClose, concert, refreshConcerts }) => {
  const { user } = useAuth0();
  const [error, setError] = useState(null);
  const setlistEntry = concert?.setlist?.[0] || {};
  const {
    artist: { name: artistName } = {},
    eventDate = "Unknown Date",
    venue: {
      name: venueName = "Unknown Venue",
      city: { name: cityName, state, country: { name: countryName } = {} } = {},
    } = {},
    sets: { set: sets = [] } = {},
  } = setlistEntry;

  const handleClose = () => {
    dialogRef.current.close();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen, concert]);

  const dialogRef = useRef(null);

  if (isOpen && dialogRef.current) {
    dialogRef.current.showModal();
  }

  const inputDate = eventDate;
  const [day, month, year] = inputDate.split("-");
  const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);

  const outputDate = formattedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const saveConcert = async () => {
    const body = {
      user,
      concertData: concert?.setlist[0],
    };

    const response = await fetch(`${BASE_URL}/api/concerts/`, {
      method: "POST",
      // so I either need to add the auth0 data with the setlist data
      // then pass both together or bring in auth0 data later.
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
    }
    if (response.ok) {
      handleClose();
      refreshConcerts();
    }
  };

  if (error) {
    return (
      <dialog id="modal" ref={dialogRef} onClose={onClose}>
        <p>Error: {error}</p>

        <form method="dialog" id="modal-actions">
          <button>Close</button>
          {/* <button onClick={saveConcert}>Add show to my list!</button> */}
        </form>
      </dialog>
    );
  }

  if (concert) {
    return (
      <dialog id="modal" ref={dialogRef} onClose={onClose}>
        {concert ? (
          <>
            <h2>{artistName}</h2>
            <h4>
              {outputDate} -- {venueName} -- {cityName}, {state}, {countryName}
            </h4>
            {sets.map((set, index) => (
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
            ))}
            <form method="dialog" id="modal-actions">
              <button type="button" onClick={handleClose}>
                Close
              </button>
              <button type="button" onClick={saveConcert}>
                Add show to my list!
              </button>
            </form>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </dialog>
    );
  }
};

export default ConcertDetailsModal;
