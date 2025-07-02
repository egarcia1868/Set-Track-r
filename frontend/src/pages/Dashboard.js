import { useEffect, useState } from "react";
import { BASE_URL } from "../utils/config";
import ArtistDetails from "../components/ArtistDetails";
import { useConcertsContext } from "../hooks/useConcertsContext";
import ConcertForm from "../components/ConcertForm";
import { useAuth0 } from "@auth0/auth0-react";

const Dashboard = () => {
  const { user, isLoading } = useAuth0();
  const { artists, dispatch } = useConcertsContext();
  const [isFetchingConcerts, setIsFetchingConcerts] = useState(true);

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/concerts/${user.sub}`);
        const json = await response.json();

        if (response.ok) {
          dispatch({ type: "UPDATE_ARTISTS", payload: [...json] });
        } else {
          console.error("Error fetching concerts:", json);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsFetchingConcerts(false);
      }
    };

    // if (!isLoading) {  HIDING THIS FOR NOW TO SEE IF ACTUALLY NEEDED
    fetchConcerts();
    // }
  }, [dispatch, user.sub, isLoading]);

  return (
    <div className="home">
      <div className="concerts">
        {isFetchingConcerts ? (
          <div>Loading...</div>
        ) : artists.length > 0 ? (
          artists.map((artist) => (
            <ArtistDetails key={artist.artistId} artist={artist} />
          ))
        ) : (
          <h3>No Saved Concerts yet</h3>
        )}
      </div>
      <ConcertForm />
    </div>
  );
};

export default Dashboard;
