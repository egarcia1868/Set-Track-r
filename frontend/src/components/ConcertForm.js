import { useState, useEffect } from "react";
import { BASE_URL } from "../utils/config";

import ConcertDetailsModal from "./ConcertDetailsModal";

const ConcertForm = () => {
  const [artistName, setArtistName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [error, setError] = useState(null);
  const [concert, setConcert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const convertDateFormat = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };

  const getConcertDetails = async () => {
    const formattedDate = convertDateFormat(eventDate);

    const response = await fetch(
      `${BASE_URL}/api/concerts/${encodeURIComponent(artistName)}/${formattedDate}`
    );
    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
      // setConcert(null);
    }

    if (response.ok) {
      setConcert(json);
      // setError(null);
    }
  };

  useEffect(() => {
    if (concert) {
      setIsModalOpen(true);
    }
  }, [concert]);

  const handleConcertDetailsClick = async () => {

    await getConcertDetails();
  }

  return (
    <>
      <ConcertDetailsModal
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
        concert={concert}
      />
      <form className="create">
        <h3>Find new set list</h3>
        <label htmlFor="artistName">Artist Name<br /> (use correct spelling):</label>
        <input
          id="artistName"
          type="text"
          onChange={(e) => {
            setError(null)
            setArtistName(e.target.value)
          }}
          placeholder="e.g. Billy Strings, CAKE, Sturgill Simpson, etc."
          value={artistName}
        />
        <label htmlFor="date">Concert Date:</label>
        <input
          id="date"
          type="date"
          onChange={(e) => {
            setError(null);
            setEventDate(e.target.value)}}
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
