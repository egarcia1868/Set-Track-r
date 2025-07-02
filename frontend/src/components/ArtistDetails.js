import { useNavigate } from "react-router-dom";

const ArtistDetails = ({ artist }) => {
  console.log("artist: ", artist)
  const { artistName, concerts } = artist;

  const navigate = useNavigate();

  const goToArtist = () => {
    navigate("/artist", { state: { artist } });
  };

  return (
    <div className="concert-details" onClick={goToArtist}>
      <h4>{artistName}</h4>
      <p>
        {concerts.length} concert{concerts.length > 1 && "s"}
      </p>
    </div>
  );
};

export default ArtistDetails;
