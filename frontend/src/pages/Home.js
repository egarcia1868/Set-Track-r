const Home = () => {
  return (
    <div className="home">
      <div className="home-content">
        <h1>Welcome to Set Track'r</h1>
        <p>
          Set Track'r is a tool that can be used to track the concerts and songs
          performed at shows you attended.
        </p>
        <p>Please log in to view and manage your concerts.</p>

        <div className="roadmap-section">
          <h3>Coming Soon</h3>
          <ul>
            <li>Edit how album covers are shown in background of profile page when user has small number of artists.</li>
            <li>Search for users who have seen a specific artist or attended the same show</li>
            <li>Search conversations by keyword</li>
            <li>Block users from viewing your profile</li>
            <li>Block users from sending messages</li>
          </ul>
        </div>

        <p className="subtitle">
          (if you do not wish to create an account and just want to test this app use
          demo@gmail.com & Demo!234 to login to my demo account)
        </p>
      </div>
    </div>
  );
};

export default Home;
