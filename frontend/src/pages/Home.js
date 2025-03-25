import { useEffect } from "react";
import { useConcertsContext } from "../hooks/useConcertsContext";

import ArtistDetails from "../components/ArtistDetails";
import ConcertForm from "../components/ConcertForm";

const getUniqueArtists = (concertsArr, addConcertToArtist) => {
  // Create a Set to track the unique combinations of artist name and id
  const uniqueArtists = [];
  const seen = new Set();

  concertsArr.forEach(concert => {
    const { concertId, artist: {name: artistName}, venue, sets, eventDate, url} = concert;

    if (!seen.has(artistName)) {
      uniqueArtists.push({ id: concertId, artist: { name: artistName, concerts: [{venue, sets, eventDate, url}] } });
      seen.add(artistName); // Add artist name to Set to ensure uniqueness
    } else {
      addConcertToArtist(uniqueArtists, artistName, {venue, sets, eventDate, url})
      // findByArtistName(uniqueArtists).artist.concerts.push({venue, sets, eventDate, url})
    }
  });

  return uniqueArtists;
}

const addConcertToArtist = (artists, artistName, newConcert) => {
  // Find the artist by name
  const artistEntry = artists.find(artist => artist.artist.name === artistName);
  
  if (artistEntry) {
    artistEntry.artist.concerts.push(newConcert);
  } else {
    console.warn(`Artist "${artistName}" not found.`);
  }
};

const Home = () => {
  const {artists, concerts, dispatch} = useConcertsContext();

  useEffect(() => {
    const fetchConcerts = async () => {
      const response = await fetch("/api/concerts");
      const json = await response.json();

      if (response.ok) {
        dispatch({type: 'UPDATE_ARTISTS', payload: {concerts, artists: getUniqueArtists(json, addConcertToArtist)}});
      }
    };

    fetchConcerts();
  }, [dispatch, concerts]);

  return (
      <div className="home">
        <div className="concerts">
          {!artists && <h3>No Saved Concerts yet</h3>}
            {artists &&
            artists.map((artist) => (
              <ArtistDetails key={artist.id} artist={artist} />
            ))
            }
        </div>
        <ConcertForm />
      </div>
  );
};

export default Home;
