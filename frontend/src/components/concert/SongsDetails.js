import { useState } from "react";

const SongsDetails = ({ concerts }) => {
  const [sortBy, setSortBy] = useState("count"); // Default sorting by count
  const [ascending, setAscending] = useState(false); // Default descending order for count
  const [expandedSong, setExpandedSong] = useState(null);

  function countSongOccurrences(concerts) {
    const songOccurrences = {};

    concerts.forEach((concert) => {
      concert.sets.forEach((set) => {
        set.song.forEach((song) => {
          const songName = song.name;
          if (!songOccurrences[songName]) {
            songOccurrences[songName] = {
              count: 0,
              concerts: [],
            };
          }
          songOccurrences[songName].count++;
          songOccurrences[songName].concerts.push({
            venue:
              typeof concert.venue === "object"
                ? concert.venue.name
                : concert.venue,
            city:
              typeof concert.venue === "object" ? concert.venue.city?.name : "",
            date: concert.eventDate,
          });
        });
      });
    });

    return Object.entries(songOccurrences).map(([name, data]) => ({
      name,
      count: data.count,
      concerts: data.concerts,
    }));
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
          <>
            <tr
              key={`table-row-${song.name}`}
              onClick={() =>
                setExpandedSong(expandedSong === song.name ? null : song.name)
              }
              style={{ cursor: "pointer" }}
              className={expandedSong === song.name ? "song-row-expanded" : ""}
            >
              <td>
                {song.name} {expandedSong === song.name ? "▼" : "▶"}
              </td>
              <td>{song.count}</td>
            </tr>
            {expandedSong === song.name && (
              <tr key={`details-${song.name}`}>
                <td colSpan="2" className="song-details-cell">
                  <div className="song-concert-list">
                    {[...song.concerts]
                      .sort(
                        (a, b) =>
                          new Date(...b.date.split("-").reverse()) -
                          new Date(...a.date.split("-").reverse())
                      )
                      .map((concert, idx) => (
                        <div key={idx} className="song-concert-item">
                          <strong>{concert.date}</strong> - {concert.venue}
                          {concert.city && `, ${concert.city}`}
                        </div>
                      ))}
                  </div>
                </td>
              </tr>
            )}
          </>
        ))}
      </tbody>
    </table>
  );
};

export default SongsDetails;
