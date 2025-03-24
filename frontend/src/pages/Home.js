import { useEffect, useState } from "react";

import ArtistDetails from "../components/ArtistDetails";
import ConcertForm from "../components/ConcertForm";

const getUniqueArtists = (concertsArr, addConcertToArtist) => {
  // Create a Set to track the unique combinations of artist name and id
  const uniqueArtists = [];
  const seen = new Set();

  concertsArr.forEach(concert => {
    const { apiId, artist: {name: artistName}, venue, sets, eventDate, url} = concert;

    if (!seen.has(artistName)) {
      uniqueArtists.push({ id: apiId, artist: { name: artistName, concerts: [{venue, sets, eventDate, url}] } });
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
    // Push the new concert into the artist's concerts array
    artistEntry.artist.concerts.push(newConcert);
    console.log(`Added concert for ${artistName}`);
  } else {
    console.warn(`Artist "${artistName}" not found.`);
  }
};

const Home = () => {
  const [concerts, setConcerts] = useState(null);
  const [artists, setArtists] = useState(null);

  // TODO:
  // need to set up a useContext use case to share state between here and modal
  // to refresh page when new concert added

  useEffect(() => {
    const fetchConcerts = async () => {
      // const params = new URLSearchParams({
      //   artistName: 'Billy Strings',
      //   date: '14-12-2024'
      // });
      // const headers = {
      //   Accept: "application/json",
      //   "x-api-key": process.env.SETLIST_FM_API_KEY
      // };

      // try {
      // const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists/${params}`, {
      // const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlist/63de4613`, {
      //   method: 'GET',
      //   headers
      // });

      // const response = await fetch("/api/concerts/b57b92a");
      const response = await fetch("/api/concerts");
      const json = await response.json();

      if (response.ok) {
        setConcerts(json);
        setArtists(getUniqueArtists(json, addConcertToArtist));
      }
    };

    fetchConcerts();
  }, []);

  return (
      <div className="home">
        <div className="concerts">
            {artists ?
            artists.map((artist) => (
              <ArtistDetails key={artist._id} artist={artist} />
            )) : <h3>No Saved Concerts yet</h3>
            }
        </div>
        <ConcertForm />
      </div>
  );
};

export default Home;
