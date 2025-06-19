import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header>
      <div className="container">
        <Link to="/">
          <h1>Set Track'r</h1>
        </Link>
        <div>
        <Link to="/login">
          <button className="auth login" onClick={() => {
          // handleConcertDetailsClick();
        }
          } type="button">Log in</button>
        </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
