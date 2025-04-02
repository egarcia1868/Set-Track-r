import { useEffect, useState } from "react";
import { useConcertsContext } from "../hooks/useConcertsContext";

import UnderConstructionModal from "../components/UnderConstructionModal";
import ArtistDetails from "../components/ArtistDetails";
import ConcertForm from "../components/ConcertForm";

const Home = () => {
  const { artists, dispatch } = useConcertsContext();
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    const fetchConcerts = async () => {
      // Dynamically determine the base URL based on the environment
      const BASE_URL = process.env.NODE_ENV === "production"
        ? "https://your-backend-url.onrender.com" // Deployed backend URL
        : "http://localhost:4000"; // Local backend URL (adjust port if needed)
  
      const response = await fetch(`${BASE_URL}/api/concerts`);
      const json = await response.json();
  
      if (response.ok) {
        dispatch({ type: "UPDATE_ARTISTS", payload: [...json] });
      } else {
        console.error("Error fetching concerts:", json);
      }
    };
  
    fetchConcerts();
  }, [dispatch]);

  return (
    <div className="home">
      <UnderConstructionModal
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
      />
      <div className="concerts">
        {!artists && <h3>No Saved Concerts yet</h3>}
        {artists &&
          artists.map((artist) => (
            <ArtistDetails key={artist.artistId} artist={artist} />
          ))}
      </div>
      <ConcertForm />
    </div>
  );
};

export default Home;
