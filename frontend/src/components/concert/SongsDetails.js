import { useState } from "react";

const SongsDetails = ({ concerts }) => {
  const [sortBy, setSortBy] = useState("count"); // Default sorting by count
  const [ascending, setAscending] = useState(false); // Default descending order for count

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

    return Object.entries(songCount).map(([name, count]) => ({ name, count }));
  }

  function sortSongs(songs) {
    return songs.sort((a, b) => {
      if (sortBy === "count") {
        return ascending
          ? a.count - b.count || a.name.localeCompare(b.name)
          : b.count - a.count || a.name.localeCompare(b.name);
      }
      if (sortBy === "name") {
        return ascending
          ? a.name.localeCompare(b.name) || a.count - b.count
          : b.name.localeCompare(a.name) || b.count - a.count;
      }
      return 0;
    });
  }

  const sortedSongs = sortSongs(countSongOccurrences(concerts));

  const getSortArrow = (column) => {
    if (sortBy === column) {
      return ascending ? "▲" : "▼";
    }
    return ""; // No arrow if it's not the currently sorted column
  };

  return (
    <table id="shows-table">
      <thead>
        <tr>
          <th
            onClick={() => {
              setSortBy("name");
              setAscending(sortBy === "name" ? !ascending : true);
            }}
            style={{ cursor: "pointer" }}
          >
            Song Title {getSortArrow("name")}
          </th>
          <th
            onClick={() => {
              setSortBy("count");
              setAscending(sortBy === "count" ? !ascending : false);
            }}
            style={{ cursor: "pointer" }}
          >
            Times Seen {getSortArrow("count")}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedSongs.map((song) => (
          <tr key={`table-row-${song.name}`}>
            <td>{song.name}</td>
            <td>{song.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SongsDetails;
