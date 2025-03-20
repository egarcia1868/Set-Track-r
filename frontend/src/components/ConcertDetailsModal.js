import { forwardRef, useImperativeHandle, useRef } from "react";
import { createPortal } from "react-dom";
// import Cart from './Cart';

const ConcertDetailsModal = forwardRef(function Modal({ concert }, ref) {
  const [
    {
      artist: { name: artistName } = {},
      eventDate = "Unknown Date",
      venue: {
        name: venueName = "Unknown Venue",
        city: {
          name: cityName,
          state,
          country: { name: countryName } = {},
        } = {},
      } = {},
      sets: { set: sets = [] } = {},
    } = {},
  ] = concert?.setlist || [];

  const dialog = useRef(null);

  useImperativeHandle(ref, () => {
    return {
      open: () => {
        if (dialog.current) {
          dialog.current.showModal();
        }
      },
    };
  });

  const inputDate = eventDate;
  const [day, month, year] = inputDate.split("-");
  const formattedDate = new Date(`${year}-${month}-${day}`);

  const outputDate = formattedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (concert) {
    return createPortal(
      <dialog id="modal" ref={dialog}>
        {concert ? (
          <>
            <h2>{artistName}</h2>
            <h4>
              {outputDate} -- {venueName} -- {cityName}, {state}, {countryName}
            </h4>
            {
              // set[0].song[0].name
              sets.map((set) => (
                <>
                  <p>
                    <strong>{set.name ? set.name : "Encore"}</strong>
                  </p>
                  {set.song.map((song, i) => (
                    <p>{i+1}. {song.name}</p>
                  ))}
                </>
              ))
            }
            <form method="dialog" id="modal-actions">
              <button>Close</button>
              <button>Add show to my list!</button>
            </form>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </dialog>,
      document.getElementById("modal")
    );
  }
});

export default ConcertDetailsModal;
