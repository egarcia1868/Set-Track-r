import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { loginWithRedirect, logout } = useAuth0();
  const { isAuthenticated, user, userProfile } = useAuth();


  // Get the display name: use database userProfile.name first, then fall back to Auth0 user.name
  const getDisplayName = () => {
    // if (userProfile?.name) {
    //   return userProfile.name;
    // }
    return userProfile?.name || "User";
  };


  return (
    <header>
      <nav className="container">
        <Link to="/">
          <h1>Set Track'r</h1>
        </Link>
        <div>

          {isAuthenticated ? (
            <div className="nav-greeting">
              <p style={{ marginRight: "10px" }}>Hello, {getDisplayName()}</p>
              <button
                className="auth login"
                onClick={() =>
                  logout({ 
                    logoutParams: { 
                      returnTo: window.location.origin,
                      federated: true
                    }
                  })
                }
              >
                Log Out
              </button>
            </div>
          ) : (
            <button 
              className="auth login" 
              onClick={() => {
                loginWithRedirect({
                  authorizationParams: {
                    prompt: 'login'
                  }
                }).catch(error => {
                  console.error("Login error:", error);
                });
              }}
            >
              Log In
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
