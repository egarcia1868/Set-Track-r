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
      <thead>
        <tr>
          <th>Song Title</th>
          <th>Times Seen</th>
        </tr>
      </thead>
      {countSongOccurrences(concerts).map((song) => {
        return (
          <tbody key={`table-row-${song.name}`}>
            <tr>
              <td>{song.name}</td>
              <td>{song.count}</td>
            </tr>
          </tbody>
        );
      })}
    </table>
  );
};

export default SongsDetails;
