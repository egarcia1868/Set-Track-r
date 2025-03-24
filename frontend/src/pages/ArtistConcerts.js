import { useLocation } from "react-router-dom";
import ConcertDetails from "../components/ConcertDetails";
// import ArtistDetails from "../components/ArtistDetails";
// import ConcertForm from "../components/ConcertForm";

// const getUniqueArtists = (concertsArr, addConcertToArtist) => {
//   // Create a Set to track the unique combinations of artist name and id
//   const uniqueArtists = [];
//   const seen = new Set();

//   concertsArr.forEach(concert => {
//     const { apiId, artist: {name: artistName}, venue, sets, eventDate, url} = concert;

//     if (!seen.has(artistName)) {
//       uniqueArtists.push({ id: apiId, artist: { name: artistName, concerts: [{venue, sets, eventDate, url}] } });
//       seen.add(artistName); // Add artist name to Set to ensure uniqueness
//     } else {
//       addConcertToArtist(uniqueArtists, artistName, {venue, sets, eventDate, url})
//       // findByArtistName(uniqueArtists).artist.concerts.push({venue, sets, eventDate, url})
//     }
//   });

//   return uniqueArtists;
// }

// const addConcertToArtist = (artists, artistName, newConcert) => {
//   // Find the artist by name
//   const artistEntry = artists.find(artist => artist.artist.name === artistName);
  
//   if (artistEntry) {
//     // Push the new concert into the artist's concerts array
//     artistEntry.artist.concerts.push(newConcert);
//     console.log(`Added concert for ${artistName}`);
//   } else {
//     console.warn(`Artist "${artistName}" not found.`);
//   }
// };

const ArtistConcerts = () => {
  // const [concerts, setConcerts] = useState(null);
  // const [artists, setArtists] = useState(null);
  const location = useLocation();
  const {artistName, concerts} = location.state || {};

  const sortedConcerts = concerts.sort((a, b) => {
    const [dayA, monthA, yearA] = a.eventDate.split("-").map(Number);
    const [dayB, monthB, yearB] = b.eventDate.split("-").map(Number);
  
    // Create date objects (YYYY-MM-DD for correct comparison)
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
  
    return dateB - dateA; // Sort descending (most recent first)
  });

  console.log('taco2: ', concerts)

  return (<>
        <h3>{artistName}</h3>
        <div className="concerts">
          {sortedConcerts ?
          sortedConcerts.map((concert) => (
            <ConcertDetails key={concert._id} concert={concert} />
          )) : <p>No concerts for this artist</p>
          }
        </div>
        </>
  );
};

export default ArtistConcerts;
