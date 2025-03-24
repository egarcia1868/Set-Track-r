const ConcertDetails = ({concert}) => {
  console.log(concert);
  const {eventDate, artist: {name: artistName}, venue: {name: venueName, city:{name: cityName, state, country: {name: countryName}}}} = concert;
  const inputDate = eventDate; 
  const [day, month, year] = inputDate.split("-");
  const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);

  const outputDate = formattedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

return (
  <div className="concert-details">
    <h4>{artistName}</h4>
    <p><strong>{venueName}</strong></p>
    <p>{cityName}, {state}, {countryName}</p>
    <p>{outputDate}</p>
    
  </div>
)
}

export default ConcertDetails;