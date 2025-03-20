import { useEffect, useState } from "react";

import ConcertDetails from "../components/WorkoutDetails";
import WorkoutForm from "../components/WorkoutForm";

const Home = () => {
  const [concerts, setConcerts] = useState(null);

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
      <div className="workouts">
        {concerts &&
          concerts.map((concert) => (
            <ConcertDetails key={concert._id} concert={concert} />
          ))
          }
      </div>
      <WorkoutForm />
    </div>
  );
};

export default Home;
