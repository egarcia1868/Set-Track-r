import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";

const Navbar = () => {
  const { loginWithRedirect, logout } = useAuth0();
  const { isAuthenticated, userProfile } = useAuth();
  const { unreadCount } = useChat();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (e) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
        {/* Logo - always visible */}
        <Link to="/">
          <h1>Set Track'r</h1>
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="desktop-nav">
          {isAuthenticated ? (
            <div className="nav-greeting">
              <p style={{ marginRight: "10px" }}>Hello, {getDisplayName()}</p>
              <Link to="/search-users" className="nav-link">
                Search Users
              </Link>
              <Link to="/chat" className="nav-link">
                Messages
                {unreadCount > 0 && (
                  <span className="unread-badge-nav">{unreadCount}</span>
                )}
              </Link>
              <button
                className="auth login"
                onClick={() =>
                  logout({
                    logoutParams: {
                      returnTo: window.location.origin,
                      federated: true,
                    },
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
                    prompt: "login",
                  },
                }).catch((error) => {
                  console.error("Login error:", error);
                });
              }}
            >
              Log In
            </button>
          )}
        </div>

        {/* Hamburger Button - visible only on mobile */}
        <button
          ref={hamburgerRef}
          className="hamburger-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
          {unreadCount > 0 && !isMobileMenuOpen && (
            <span className="unread-badge-hamburger">{unreadCount}</span>
          )}
        </button>

        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="mobile-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu - slide-in from right */}
        <div
          ref={mobileMenuRef}
          className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}
        >
          {isAuthenticated ? (
            <div className="mobile-nav-content">
              <p className="mobile-greeting">Hello, {getDisplayName()}</p>
              <Link
                to="/search-users"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Search Users
              </Link>
              <Link
                to="/chat"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Messages
                {unreadCount > 0 && (
                  <span className="unread-badge-nav">{unreadCount}</span>
                )}
              </Link>
              <button
                className="auth login mobile-logout"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout({
                    logoutParams: {
                      returnTo: window.location.origin,
                      federated: true,
                    },
                  });
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              className="auth login mobile-login"
              onClick={() => {
                setIsMobileMenuOpen(false);
                loginWithRedirect({
                  authorizationParams: {
                    prompt: "login",
                  },
                }).catch((error) => {
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
