import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../utils/config";
import { useAuth0 } from "@auth0/auth0-react";
import NewConcertDetails from "./NewConcertDetails";

const ConcertDetailsModal = ({
  isOpen,
  onClose,
  concertList,
  refreshConcerts,
}) => {
  const { user } = useAuth0();
  const [error, setError] = useState(null);
  const [setsToAdd, setSetsToAdd] = useState([]);
  // const [concerts, setConcerts] = useState(concertList || []);

  //   useEffect(() => {
  //   if (concertList) {
  //     setConcerts(concertList);
  //   }
  // }, [concertList]);

  // console.log("CM: ", concerts.setlist);
  console.log("CM2: ", concertList);
  // const {
  //   artist: { name: artistName } = {},
  //   eventDate = "Unknown Date",
  //   venue: {
  //     name: venueName = "Unknown Venue",
  //     city: { name: cityName, state, country: { name: countryName } = {} } = {},
  //   } = {},
  //   sets: { set: sets = [] } = {},
  // } = setlistEntry;

  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }

    const handleClick = (e) => {
      // If the click target *is* the <dialog> element, it means the user clicked the backdrop
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener("click", handleClick);
    return () => dialog.removeEventListener("click", handleClick);
  }, [onClose, isOpen]);

  // Close on click outside or Escape
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClickOutside = (e) => {
      // If dialog is open and click is outside it
      if (dialog.open && !dialog.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  // const inputDate = eventDate;
  // const [day, month, year] = inputDate.split("-");
  // const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);

  // const outputDate = formattedDate.toLocaleDateString("en-US", {
  //   year: "numeric",
  //   month: "short",
  //   day: "numeric",
  // });

  const addSetToSetsToAddList = (set) => {
    setSetsToAdd((prev) => [...prev, set]);
  };

  console.log("tacotaco: ", setsToAdd);

  const saveConcerts = async () => {
    const body = {
      user,
      concertData: setsToAdd,
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
    } else {
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

  // if (!concertList || concertList.length === 0) return null;
  return (
    <dialog id="modal" ref={dialogRef} onClose={onClose}>
      {/* {concertList && <h2 style={{ marginBottom: '16px' }}>{concertList[0].artist.name}</h2> } */}
      {/* {concerts ? (
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
        )  */}
      {!concertList || concertList.length === 0 ? (
        <p>Loading...</p>
      ) : (
        concertList.map((concert) => (
          <NewConcertDetails
            key={concert.concertId || concert.id}
            concert={concert}
            // artistObjectId={artist._id}
            // saveConcert={saveConcert}
            addSetToSetsToAddList={addSetToSetsToAddList}
            // artist={concert.artist}
          />
        ))
      )}
      <form method="dialog" id="modal-actions">
        <button type="button" onClick={handleClose}>
          Close
        </button>
        <button type="button" onClick={saveConcerts}>
          Add show/s to my list!
        </button>
      </form>
      {/* : (
          <p>Loading...</p>
        )} */}
    </dialog>
  );
};
// };

export default ConcertDetailsModal;
