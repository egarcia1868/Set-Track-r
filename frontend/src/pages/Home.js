import { useState } from "react";

import UnderConstructionModal from "../components/UnderConstructionModal";

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="home">
      <UnderConstructionModal
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
      />
      <div>
        <p className="alert">
          7/2/2025 - some functionality may be temporarily unavailable due to
          ongoing restructuring of data storage and API request handling.
        </p>
        <p>
          Set Track'r is a tool that can be used to track the concerts and songs
          performed at shows you attended. Some standup comedy data is also
          available, but less so.
        </p>
        <p>Please log in to view and manage your concerts.</p>
        <p className="subtitle">
          (if you do not wish to setup a login and just want to test this app
          use demo@gmail.com & Demo!234)
        </p>
      </div>
    </div>
  );
};

export default Home;
