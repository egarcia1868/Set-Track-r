const ConcertDetails = ({concert}) => {
  // console.log(concert);
  const {eventDate, artist, city, state, country} = concert;
  const inputDate = eventDate; 
  const [day, month, year] = inputDate.split("-");
  const formattedDate = new Date(`${year}-${month}-${day}`);

  const outputDate = formattedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

return (
  <div className="workout-details">
    <h4>{artist}</h4>
    <p>{city}, {state}, {country}</p>
    <p>{outputDate}</p>
    {/* <h4>{workout.title}</h4>
    <p><strong>Load (lb): </strong>{workout.load}</p>
    <p><strong>Reps: </strong>{workout.reps}</p>
    <p>{workout.createdAt}</p> */}
  </div>
)
}

export default ConcertDetails;