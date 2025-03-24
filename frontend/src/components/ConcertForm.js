import { useState, useEffect } from "react";

import ConcertDetailsModal from "./ConcertDetailsModal";

const ConcertForm = () => {
  const [artistName, setArtistName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [error, setError] = useState(null);
  const [concert, setConcert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const modal = useRef(null);
  
  // useEffect(() => {
  //   if (modal.current) {
  //     setModalMounted(true);
  //   }
  // }, []);

  const getConcertDetails = async () => {
    // handleConcertDetailsClick();

    const response = await fetch(
      `/api/concerts/${encodeURIComponent(artistName)}/${eventDate}`
    );
    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
    }

    if (response.ok) {
      setConcert(json);
    }
  };

  useEffect(() => {
    if (concert) {
      setIsModalOpen(true); // Open modal when concert data is set
    }
  }, [concert]);

  const handleConcertDetailsClick = async () => {
    // setIsModalOpen(true);

    await getConcertDetails();
  }

  return (
    <>
      <ConcertDetailsModal
        // ref={modal}
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
        concert={concert}
        // actions={modalActions}
      />
      <form className="create">
        <h3>Find new set list</h3>
        <label>Artist Name (SPELL CORRECTLY!):</label>
        <input
          type="text"
          onChange={(e) => setArtistName(e.target.value)}
          value={artistName}
        />
        <label>Concert Date (in the format of "dd-mm-yyyy"):</label>
        <input
          type="text"
          onChange={(e) => setEventDate(e.target.value)}
          value={eventDate}
        />
        <button onClick={() => {
          handleConcertDetailsClick();
        }
          } type="button">Look Up Set List</button>
        {error && <div className="error">{error}</div>}
      </form>
    </>
  );
};

export default ConcertForm;
