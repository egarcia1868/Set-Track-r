import { useState } from "react";
import { BASE_URL } from "../../utils/config";

import ConcertDetailsModal from "./ConcertDetailsModal";

const ConcertSearchForm = ({ refreshConcerts }) => {
  const [artistName, setArtistName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [cityName, setCityName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState(null);
  const [concertList, setConcertList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSearchParams, setLastSearchParams] = useState(null);

  const convertDateFormat = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };

  const getConcertDetails = async (page = 1) => {
    const formattedDate = convertDateFormat(eventDate);

    const query = new URLSearchParams();

    if (artistName) query.append("artistName", artistName);
    if (eventDate) query.append("date", formattedDate);
    if (cityName) query.append("cityName", cityName);
    if (venueName) query.append("venueName", venueName);
    if (year) query.append("year", year);
    if (page > 1) query.append("p", page);

    // Store search params for pagination
    setLastSearchParams({
      artistName,
      eventDate: formattedDate,
      cityName,
      venueName,
      year
    });
    setCurrentPage(page);

    const response = await fetch(
      `${BASE_URL}/api/concerts?${query.toString()}`,
    );

    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
      return;
    }

    setConcertList(json);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await getConcertDetails();
  };

  const navigateToPage = async (newPage) => {
    if (lastSearchParams && newPage >= 1) {
      // Temporarily restore search params for pagination
      const tempArtistName = artistName;
      const tempEventDate = eventDate;
      const tempCityName = cityName;
      const tempVenueName = venueName;
      const tempYear = year;

      // Set the last search params
      setArtistName(lastSearchParams.artistName || "");
      setEventDate(lastSearchParams.eventDate ? 
        lastSearchParams.eventDate.split("-").reverse().join("-") : "");
      setCityName(lastSearchParams.cityName || "");
      setVenueName(lastSearchParams.venueName || "");
      setYear(lastSearchParams.year || "");

      await getConcertDetails(newPage);

      // Restore current form values
      setArtistName(tempArtistName);
      setEventDate(tempEventDate);
      setCityName(tempCityName);
      setVenueName(tempVenueName);
      setYear(tempYear);
    }
  };

  const handleNextPage = async () => {
    await navigateToPage(currentPage + 1);
  };

  const handlePrevPage = async () => {
    await navigateToPage(currentPage - 1);
  };

  return (
    <>
      <ConcertDetailsModal
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
        concertList={concertList.setlist}
        refreshConcerts={refreshConcerts}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        currentPage={currentPage}
      />
      <form className="create" onSubmit={handleSubmit}>
        <h3>Find new set list</h3>
        <label htmlFor="artistName">
          Artist Name
          <br /> (use correct spelling):
        </label>
        <input
          id="artistName"
          type="text"
          onChange={(e) => {
            setError(null);
            setArtistName(e.target.value);
          }}
          placeholder="e.g. - Billy Strings, CAKE, Sturgill Simpson, etc."
          value={artistName}
        />
        <label htmlFor="date">Concert Date:</label>
        <input
          id="date"
          type="date"
          onChange={(e) => {
            setError(null);
            setYear("");
            setEventDate(e.target.value);
          }}
          value={eventDate}
        />
        <label htmlFor="year">Year of concert/s:</label>
        <input
          id="year"
          type="text"
          onChange={(e) => {
            setError(null);
            setEventDate("");
            setYear(e.target.value);
          }}
          placeholder="e.g. - 2025, 2024, 2023 etc."
          value={year}
        />
        <label htmlFor="cityName">City:</label>
        <input
          id="cityName"
          type="text"
          onChange={(e) => {
            setError(null);
            setCityName(e.target.value);
          }}
          placeholder="e.g. - Austin, San Diego, Asheville, etc."
          value={cityName}
        />
        <label htmlFor="venueName">Venue Name:</label>
        <input
          id="VenueName"
          type="text"
          onChange={(e) => {
            setError(null);
            setVenueName(e.target.value);
          }}
          placeholder="e.g. - Moody Center, The Fillmore, The Ryman, etc."
          value={venueName}
        />
        <button type="submit">
          Look Up Set List
        </button>
        <p className="subtitle">
          (
          <a
            href="https://www.setlist.fm/search?query=moody+center"
            target="_blank"
            rel="noopener noreferrer"
          >
            Click here
          </a>{" "}
          if you need a sample artist name/show date to test with)
        </p>
        {error && <div className="error">{error}</div>}
      </form>
    </>
  );
};

export default ConcertSearchForm;
