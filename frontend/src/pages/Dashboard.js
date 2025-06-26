import { useEffect } from "react";
import { BASE_URL } from "../utils/config";
import ArtistDetails from "../components/ArtistDetails";
import { useConcertsContext } from "../hooks/useConcertsContext";
import ConcertForm from "../components/ConcertForm";
import { useAuth0 } from "@auth0/auth0-react";

const Dashboard = () => {
    const { isAuthenticated, user } = useAuth0();
    const { artists, dispatch } = useConcertsContext();

      useEffect(() => {
    const fetchConcerts = async () => {
      // Dynamically determine the base URL based on the environment

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

export default Dashboard;
