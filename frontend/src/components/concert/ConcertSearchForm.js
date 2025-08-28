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
  const [hasMorePages, setHasMorePages] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState(null);

  const convertDateFormat = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };

  const getConcertDetails = async (page = 1, overrideParams = null) => {
    const params = overrideParams || {
      artistName,
      eventDate,
      cityName,
      venueName,
      year,
    };

    const formattedDate = params.eventDate
      ? convertDateFormat(params.eventDate)
      : "";

    const query = new URLSearchParams();

    if (params.artistName) query.append("artistName", params.artistName);
    if (params.eventDate) query.append("date", formattedDate);
    if (params.cityName) query.append("cityName", params.cityName);
    if (params.venueName) query.append("venueName", params.venueName);
    if (params.year) query.append("year", params.year);
    if (page > 1) query.append("p", page);

    // Store search params for pagination
    setLastSearchParams({
      artistName: params.artistName,
      eventDate: formattedDate,
      cityName: params.cityName,
      venueName: params.venueName,
      year: params.year,
    });
    setCurrentPage(page);

    const response = await fetch(
      `${BASE_URL}/api/concerts?${query.toString()}`,
    );

    const json = await response.json();

    if (!response.ok) {
      if (response.status === 404 && page > 1) {
        // If it's a 404 on a page > 1, we've reached the end
        setHasMorePages(false);
        return;
      }
      setError(json.error);
      return;
    }

    setConcertList(json);
    setIsModalOpen(true);

    // Check if there's a next page by testing page + 1
    const nextPageQuery = new URLSearchParams();
    if (params.artistName)
      nextPageQuery.append("artistName", params.artistName);
    if (params.eventDate) nextPageQuery.append("date", formattedDate);
    if (params.cityName) nextPageQuery.append("cityName", params.cityName);
    if (params.venueName) nextPageQuery.append("venueName", params.venueName);
    if (params.year) nextPageQuery.append("year", params.year);
    nextPageQuery.append("p", page + 1);

    try {
      const nextPageResponse = await fetch(
        `${BASE_URL}/api/concerts?${nextPageQuery.toString()}`,
      );

      if (nextPageResponse.ok) {
        const nextPageJson = await nextPageResponse.json();
        // If next page has results, show Next button
        setHasMorePages(
          nextPageJson.setlist && nextPageJson.setlist.length > 0,
        );
      } else {
        // If next page returns error (like 404), no more pages
        setHasMorePages(false);
      }
    } catch (error) {
      // If there's an error checking next page, assume no more pages
      setHasMorePages(false);
    }
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
      setEventDate(
        lastSearchParams.eventDate
          ? lastSearchParams.eventDate.split("-").reverse().join("-")
          : "",
      );
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
    setNavigationDirection("next");
    await navigateToPage(currentPage + 1);
  };

  const handlePrevPage = async () => {
    setNavigationDirection("prev");
    await navigateToPage(currentPage - 1);
  };

  const handleSampleSearch = async (e) => {
    e.preventDefault();
    setError(null);

    const sampleParams = {
      artistName: "Billy Strings",
      eventDate: "",
      cityName: "Austin",
      venueName: "",
      year: "",
    };

    // Update the form fields
    setYear("");
    setCityName("Austin");
    setArtistName("Billy Strings");
    setEventDate("");
    setVenueName("");

    // Submit with the sample params directly
    await getConcertDetails(1, sampleParams);
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
        hasMorePages={hasMorePages}
        navigationDirection={navigationDirection}
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
        <button type="submit">Look Up Set List</button>
        <p className="subtitle">
          (
          <button
            type="button"
            onClick={handleSampleSearch}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
              font: "inherit",
            }}
          >
            Click here
          </button>{" "}
          if you just want a sample search to see how it works)
        </p>
        {error && <div className="error">{error}</div>}
      </form>
    </>
  );
};

export default ConcertSearchForm;
