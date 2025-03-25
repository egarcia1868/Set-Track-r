import { useLocation } from "react-router-dom";
import ConcertDetails from "../components/ConcertDetails";

const ArtistConcerts = () => {
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

  return (<>
        <h3>{artistName}</h3>
        <div className="concerts">
          {sortedConcerts ?
          sortedConcerts.map((concert) => (
            <ConcertDetails key={concert.id} concert={concert} />
          )) : <p>No concerts for this artist</p>
          }
        </div>
        </>
  );
};

export default ArtistConcerts;
