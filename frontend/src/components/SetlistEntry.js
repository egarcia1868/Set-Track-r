const SetlistEntry = () => {
  <>
    {/* <h2>{artistName}</h2>
    <h4>
      {outputDate} -- {venueName} -- {cityName}, {state}, {countryName}
    </h4>
    {sets.map((set, index) => (
      <div key={index}>
        <p>
          <strong>{set.name}</strong>
          <strong>
            {set.encore && "Encore"} {set.encore > 1 && set.encore}
          </strong>
        </p>
        <ol>
          {set.song.map((song, i) => (
            <li key={i}>{song.name}</li>
          ))}
        </ol>
      </div>
    ))} */}
    <form method="dialog" id="modal-actions">
      <button type="button" onClick={handleClose}>
        Close
      </button>
      <button type="button" onClick={saveConcerts}>
        Add show to my list!
      </button>
    </form>
  </>;
};

export default SetlistEntry;
