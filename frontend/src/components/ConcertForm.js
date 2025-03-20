import { useState, useRef } from "react";

import ConcertDetailsModal from "./ConcertDetailsModal";

const ConcertForm = () => {
  // const [title, setTitle] = useState("");
  // const [load, setLoad] = useState("");
  // const [reps, setReps] = useState("");
  // const [error, setError] = useState(null);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   const workout = {title, load, reps}

  //   const response = await fetch('/api/workouts',{
  //     method: 'POST',
  //     body: JSON.stringify(workout),
  //     headers: {
  //       "Content-Type": 'application/json'
  //     }
  //   })

  //   const json = await response.json()

  //   if (!response.ok) {
  //     setError(json.error)
  //   }
  //   if (response.ok) {
  //     setTitle('')
  //     setLoad('')
  //     setReps('')
  //     setError(null)
  //     console.log('new workout added', json)
  //   }
  // }

  const [artistName, setArtistName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [error, setError] = useState(null);
  const [concert, setConcert] = useState(null);

  // useEffect(() => {
  //   const fetchConcerts = async () => {
  //     // const params = new URLSearchParams({
  //     //   artistName: 'Billy Strings',
  //     //   date: '14-12-2024'
  //     // });
  //     // const headers = {
  //     //   Accept: "application/json",
  //     //   "x-api-key": process.env.SETLIST_FM_API_KEY
  //     // };

  //     // try {
  //     // const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists/${params}`, {
  //     // const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlist/63de4613`, {
  //     //   method: 'GET',
  //     //   headers
  //     // });

  //     // const response = await fetch("/api/concerts/b57b92a");
  //     const response = await fetch("/api/concerts");
  //     const json = await response.json();

  //     if (response.ok) {
  //       setConcerts(json);
  //     }
  //   };

  //   fetchConcerts();
  // }, []);

  const modal = useRef();

  const getConcertDetails = async () => {
    const response = await fetch(
      `/api/concerts/${encodeURIComponent(artistName)}/${eventDate}`
    );
    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
    }

    if (response.ok) {
      setConcert(json);
      handleConcertDetailsClick();
    }
  };

  function handleConcertDetailsClick() {
    modal.current.open();
  }

  return (
    <>
      <ConcertDetailsModal
        ref={modal}
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
        <button onClick={() => getConcertDetails()} type="button">Look Up Set List</button>
        {error && <div className="error">{error}</div>}
      </form>
    </>
  );
};

export default ConcertForm;
