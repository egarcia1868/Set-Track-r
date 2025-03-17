import { useEffect, useState } from "react";

import WorkoutDetails from "../components/WorkoutDetails";
import WorkoutForm from "../components/WorkoutForm";

const Home = () => {
  const [workouts, setWorkouts] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
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

      const response = await fetch("/api/shows/63de4613");
      // const response = await fetch("/api/workouts");
      const json = await response.json();

      if (response.ok) {
        setWorkouts(json);
      }
    };

    fetchWorkouts();
  }, []);
  return (
    <div className="home">
      <div className="workouts">
        {workouts &&
          // workouts.map((workout) => (
            <WorkoutDetails key={workouts._id} workout={workouts} />
          // ))
          }
      </div>
      <WorkoutForm />
    </div>
  );
};

export default Home;
