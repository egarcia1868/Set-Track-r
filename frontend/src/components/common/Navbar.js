import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const Navbar = () => {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  return (
    <header>
      <div className="container">
        <Link to="/">
          <h1>Set Track'r</h1>
        </Link>
        <div>
          {/* {location.pathname !== '/login' && <Link to="/login">
        
          <button className="auth login" onClick={() => {
          // handleConcertDetailsClick();
        }
          } type="button">Log in</button>
        </Link> } */}

          {isAuthenticated ? (
            <div className="nav-greeting">
              <p style={{ marginRight: "10px" }}>Hello, {user.name}</p>{" "}
              {/*user.name*/}
              <button
                className="auth login"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
              >
                Log Out
              </button>
            </div>
          ) : (
            <button className="auth login" onClick={loginWithRedirect}>
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
