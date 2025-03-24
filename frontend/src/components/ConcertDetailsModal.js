import { useRef } from "react";

const ConcertDetailsModal = ({ isOpen, onClose, concert }) => {
  const setlistEntry = concert?.setlist?.[0] || {};
  const {
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
    } = setlistEntry;

  const dialogRef = useRef(null);

  // useImperativeHandle(ref, () => {
  //   console.log('UIH assigned');
  //   return {
  //     open: () => {
  //       if (dialog.current) {
  //         dialog.current.showModal();
  //       } else {
  //         console.warn('Modal dialog reference is not assigned yet')
  //       }
  //     },
  //   };
  // }, []);

  if (isOpen && dialogRef.current) {
    dialogRef.current.showModal();
  }

  const inputDate = eventDate;
  const [day, month, year] = inputDate.split("-");
  const formattedDate = new Date(`${year}-${month}-${day}`);

  const outputDate = formattedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (concert) {
    return (
      <dialog id="modal" ref={dialogRef} onClose={onClose}>
        {concert ? (
          <>
            <h2>{artistName}</h2>
            <h4>
              {outputDate} -- {venueName} -- {cityName}, {state}, {countryName}
            </h4>
            {
              // set[0].song[0].name
              sets.map((set, index) => (
                <div key={index}>
                  <p>
                    <strong>{set.name}</strong>
                    <strong>{set.encore && 'Encore'} {set.encore > 1 && set.encore}</strong>
                  </p>
                  <ol>
                  {set.song.map((song, i) => (
                    <li key={i}>{song.name}</li>
                  ))}
                  </ol>
                </div>
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
      </dialog>
    );
  }
};

export default ConcertDetailsModal;
