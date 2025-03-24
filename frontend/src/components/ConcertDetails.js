const ConcertDetails = ({concert}) => {
  const {eventDate, venue: {name: venueName, city:{name: cityName, state, country: {name: countryName}}}, url} = concert;
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
    <p><strong>{venueName}</strong></p>
    <p>{cityName}, {state}, {countryName}</p>
    <p>{outputDate}</p>
    
  </div>
)
}

export default ConcertDetails;