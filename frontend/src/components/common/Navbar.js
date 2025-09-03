import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { loginWithRedirect, logout } = useAuth0();
  const { isAuthenticated, user, userProfile } = useAuth();


  // Get the display name: use profile.name if available, otherwise fall back to user.name
  const getDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name;
    }
    return user?.name || "User";
  };

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
              <p style={{ marginRight: "10px" }}>Hello, {getDisplayName()}</p>
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
            <button 
              className="auth login" 
              onClick={() => {
                console.log("Login button clicked");
                loginWithRedirect().catch(error => {
                  console.error("Login error:", error);
                });
              }}
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
