import { useState } from 'react';
import { useShowsContext } from '../hooks/useShowsContext';

const ShowForm = () => {
  const { dispatch } = useShowsContext();

  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const [showData, setShowData] = useState(null);
  const [error, setError] = useState(null);
  const [emptyFields, setEmptyFields] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // const fetchData = async () => {
      const params = new URLSearchParams({
        artistName: 'Billy Strings',
        date: '14-12-2024'
        // artistName: artist,
        // date
      });

      // const apiKey = process.env.SETLIST_FM_API_KEY;

      const headers = {
        Accept: "application/json",
        "x-api-key": process.env.SETLIST_FM_API_KEY
      };

      try {
        const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists?${params}`, {
          method: 'GET',
          headers
        }).then(res => console.log(res));

        if (!response.ok) {
          throw new Error('HTTP Error! Status: ${response.status}');
        };

        const jsonData = await response.json();
        setShowData(jsonData);
      } catch (err) {
        console.error('Error fetching data:', err);
      };
    // };
  };
      

    // const json = await response.json();

    // if (!response.ok) {
    //   setError(json.error)
    //   setEmptyFields(json.emptyFields)
    // }
    // if (response.ok) {
    //   setEmptyFields([])
    //   setError(null)
    //   setArtist('')
    //   // setLoad('')
    //   // setReps('')
    //   // MAY NEED TO CHANGE THIS TO ADD_SHOW
    //   dispatch({type: 'CREATE_SHOW', payload: json})
    // }

  return (
    <form className="create" onSubmit={handleSubmit}> 
      <h3>Find Show</h3>

      <label>Artist (make sure spelled correctly):</label>
      <input 
        type="text" 
        onChange={(e) => setArtist(e.target.value)} 
        value={artist}
        className={emptyFields.includes('artist') ? 'error' : ''}
      />

      <label>Date of show (must be in format dd-MM-yyyy):</label>
      <input 
        type="text" 
        onChange={(e) => setDate(e.target.value)} 
        value={date}
        className={emptyFields.includes('date') ? 'error' : ''}
      />

      {/* <label>Load (in kg):</label>
      <input 
        type="number" 
        onChange={(e) => setLoad(e.target.value)} 
        value={load}
        className={emptyFields.includes('load') ? 'error' : ''}
      />

      <label>Number of Reps:</label>
      <input 
        type="number" 
        onChange={(e) => setReps(e.target.value)} 
        value={reps}
        className={emptyFields.includes('reps') ? 'error' : ''}
      /> */}

      <button>Add Show</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}

export default ShowForm