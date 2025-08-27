import { useState } from "react";

import UnderConstructionModal from "../components/common/UnderConstructionModal";

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
          <strong>Note:</strong> This site may enter a brief sleep mode when
          inactive. If this is your first visit or it's been a while since your
          last, please allow a moment for the site to fully wake up (saved
          concerts will not populate correctly until the site is fully awake. ~1
          minute).
        </p>
        <p>
          Set Track'r is a tool that can be used to track the concerts and songs
          performed at shows you attended.
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
