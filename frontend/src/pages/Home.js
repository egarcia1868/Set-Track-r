import { useEffect, useState } from "react";

import ConcertDetails from "../components/ConcertDetails";
import ConcertForm from "../components/ConcertForm";

const Home = () => {
  const [concerts, setConcerts] = useState(null);

  // TODO:
  // need to set up a useContext use case to share state between here and modal
  // to refresh page when new concert added

  useEffect(() => {
    const fetchConcerts = async () => {
      // const params = new URLSearchParams({
      //   artistName: 'Billy Strings',
      //   date: '14-12-2024'
      // });
      // const headers = {
      //   Accept: "application/json",
      //   "x-api-key": process.env.SETLIST_FM_API_KEY
      // };

      // try {
      // const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlists/${params}`, {
      // const response = await fetch(`https://api.setlist.fm/rest/1.0/search/setlist/63de4613`, {
      //   method: 'GET',
      //   headers
      // });

      // const response = await fetch("/api/concerts/b57b92a");
      const response = await fetch("/api/concerts");
      const json = await response.json();

      if (response.ok) {
        setConcerts(json);
      }
    };

    fetchConcerts();
  }, []);

  return (
      <div className="home">
        <div className="concerts">
          {concerts &&
            concerts.map((concert) => (
              <ConcertDetails key={concert._id} concert={concert} />
            ))
            }
        </div>
        <ConcertForm />
      </div>
  );
};

export default Home;
