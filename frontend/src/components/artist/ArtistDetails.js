import { Link } from "react-router-dom";

const ArtistDetails = ({ artist }) => {
  const { artistName, concerts = [] } = artist;

  // Use artist name in URL path - encode to handle special characters
  const encodedArtistName = encodeURIComponent(artistName);

  return (
    <Link
      to={`/artist/${encodedArtistName}`}
      state={{ artist }} // Keep state for same-tab navigation
      className="concert-details artist-link"
    >
      <h4>{artistName}</h4>
      <p>
        {concerts.length} concert{concerts.length > 1 && "s"}
      </p>
    </Link>
  );
};

export default ArtistDetails;
