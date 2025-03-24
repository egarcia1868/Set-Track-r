import { useNavigate } from "react-router-dom";

const ArtistDetails = ({artist}) => {
  const {artist: {name: artistName, concerts}} = artist;
  
  const navigate = useNavigate();

  const goToConcert = () => {
    navigate('/artist', { state: {artistName, concerts }})
  }
  
return (
  <div className="concert-details" onClick={goToConcert}>
    <h4>{artistName}</h4>
    <p>{concerts.length} concert{concerts.length > 1 && 's'}</p>
  </div>
  
)
}

export default ArtistDetails;