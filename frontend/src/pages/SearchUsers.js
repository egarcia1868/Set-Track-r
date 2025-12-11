import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { BASE_URL } from "../utils/config";

export default function SearchUsers() {
  const { getAccessTokenSilently } = useAuth0();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `${BASE_URL}/api/users/search?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        console.error("Search failed:", response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!e.target.value.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  // Fetch featured users on component mount
  useEffect(() => {
    const fetchFeaturedUsers = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${BASE_URL}/api/users/featured`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFeaturedUsers(data.users || []);
        } else {
          console.error("Failed to fetch featured users:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching featured users:", error);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    fetchFeaturedUsers();
  }, [getAccessTokenSilently]);

  return (
    <div className="search-users-page">
      <div className="search-users-container">
        <h1>Search Users</h1>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by display name..."
            value={searchTerm}
            onChange={handleInputChange}
            className="search-input"
            autoFocus
          />
          <button type="submit" className="search-btn" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {isSearching && (
          <div className="search-status">Searching...</div>
        )}

        {!isSearching && hasSearched && searchResults.length === 0 && (
          <div className="no-results">
            <p>No users found matching "{searchTerm}"</p>
            <p className="hint">Try a different search term</p>
          </div>
        )}

        {!isSearching && hasSearched && searchResults.length > 0 && (
          <div className="search-results">
            <p className="results-count">
              Found {searchResults.length} user{searchResults.length !== 1 ? "s" : ""}
            </p>
            <div className="users-list">
              {searchResults.map((user) => (
                <Link
                  key={user.displayName}
                  to={`/profile/${user.displayName}`}
                  className="user-card"
                >
                  <div className="user-avatar">
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h3 className="user-name">{user.displayName}</h3>
                    {user.bio && <p className="user-bio">{user.bio}</p>}
                  </div>
                  <div className="view-profile-arrow">→</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!hasSearched && isLoadingFeatured && (
          <div className="search-status">Loading featured users...</div>
        )}

        {!hasSearched && !isLoadingFeatured && featuredUsers.length > 0 && (
          <div className="search-results">
            <p className="results-count">Featured Users</p>
            <div className="users-list">
              {featuredUsers.map((user) => (
                <Link
                  key={user.displayName}
                  to={`/profile/${user.displayName}`}
                  className="user-card"
                >
                  <div className="user-avatar">
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h3 className="user-name">{user.displayName}</h3>
                    {user.bio && <p className="user-bio">{user.bio}</p>}
                  </div>
                  <div className="view-profile-arrow">→</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
