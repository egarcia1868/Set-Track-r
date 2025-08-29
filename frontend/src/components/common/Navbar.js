import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect } from "react";
import { BASE_URL } from "../../utils/config";

const Navbar = () => {
  const {
    loginWithRedirect,
    logout,
    isAuthenticated,
    user,
    getAccessTokenSilently,
  } = useAuth0();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(`${BASE_URL}/api/concerts/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUserProfile(data.profile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, getAccessTokenSilently]);

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
