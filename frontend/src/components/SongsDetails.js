const SongsDetails = ({ concerts }) => {
  function countSongOccurrences(concerts) {
    const songCount = {};

    concerts.forEach((concert) => {
      concert.sets.forEach((set) => {
        set.song.forEach((song) => {
          const songName = song.name;
          songCount[songName] = (songCount[songName] || 0) + 1;
        });
      });
    });

    return Object.entries(songCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort from highest to lowest count
  }


  return (
    <table id="shows-table">
      <tr>
        <th>Song Title</th>
        <th>Times Seen</th>
      </tr>
        {countSongOccurrences(concerts).map((song) => {
          return (
            <tr key={`table-row-${song.name}`}>
              <td>{song.name}</td> <td>{song.count}</td>
            </tr>
          );
        })}
    </table>
  );
};

export default SongsDetails;
