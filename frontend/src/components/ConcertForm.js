import { useState, useEffect } from "react";
import { BASE_URL } from "../utils/config";
import DatePicker from "react-multi-date-picker";
import DatePanel from "react-multi-date-picker/plugins/date_panel";

import ConcertDetailsModal from "./ConcertDetailsModal";

const ConcertForm = () => {
  const [artistName, setArtistName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDates, setEventDates] = useState([]);
  const [error, setError] = useState(null);
  const [concert, setConcert] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const convertDateFormat = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };

  const convertDateFormats = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // if (eventDates[0]) {
  //   console.log("dates: ", convertDateFormats(eventDates[0].toDate()));
  // }

  const getConcertDetails = async () => {
    try {
      const results = [];

      for (const date of eventDates) {
        const formattedDate = convertDateFormats(date.toDate());

        const response = await fetch(
          `${BASE_URL}/api/concerts/${encodeURIComponent(
            artistName
          )}/${formattedDate}`);
        const json = await response.json();
   
    // if (!response.ok) {
    //   // setError(json.error);
    //   // setConcert(null);
    // }  NEED TO FIGURE OUT HOW TO SET UP ERRORS TO APPEAR AS ARRAY ENTRIES TO BE USED ON CONCERTDETAILSMODAL.

    if (!response.ok) {
      throw new Error(json.error);
    };

    results.push(json);

    // if (response.ok) {
    //   setConcert(json);
    //   // setError(null);
    // }
      }
      setConcerts(results);
    } catch (err) {
      setError(err.message);
    }
    // const formattedDate = convertDateFormat(eventDate);

    // const formattedDates = 
    // eventDates.map((date) => {
    //   const formattedDate = convertDateFormats(date);

    // const response = await fetch(
    //   `${BASE_URL}/api/concerts/${encodeURIComponent(
    //     artistName
    //   )}/${formattedDate}`
    // );
    // const json = await response.json();

    // if (!response.ok) {
    //   setError(json.error);
    //   // setConcert(null);
    // }

    // if (response.ok) {
    //   setConcert(json);
    //   // setError(null);
    // }
  // })
  };

  useEffect(() => {
    if (concerts[0]) {
      setIsModalOpen(true);
    }
  }, [concerts]);

  const handleConcertDetailsClick = async () => {
    await getConcertDetails();
  };

  return (
    <>
      <ConcertDetailsModal
        // ref={modal}
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
        concerts={concerts}
        // actions={modalActions}
      />
      <form className="create">
        <h3>Find new set list</h3>
        <label htmlFor="artistName">
          Artist Name
          <br /> (use correct spelling):
        </label>
        <input
          id="artistName"
          type="text"
          onChange={(e) => {
            setError(null);
            setArtistName(e.target.value);
          }}
          value={artistName}
        />
        <label htmlFor="date">Concert Date:</label>
        {/* <input
          id="date"
          type="date"
          onChange={(e) => {
            setError(null);
            setEventDate(e.target.value)}}
          value={eventDate}
        /> */}
        <DatePicker
          multiple
          value={eventDates}
          onChange={
            // (e) => {
            // console.log("eeeee: ", e)
            // setError(null);
            setEventDates
            // }
          }
          style={{
            height: '2.3rem',
            padding: '10px',
            marginTop: '10px',
            marginBottom: '20px',
            width: '100%',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          plugins={[<DatePanel />]}
        />
        <button
          onClick={() => {
            handleConcertDetailsClick();
          }}
          type="button"
        >
          Look Up Set List
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </>
  );
};

export default ConcertForm;
