import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BASE_URL } from '../../utils/config';

const FollowingList = ({ isOpen, onClose }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followingSearchTerm, setFollowingSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFollowing();
    }
  }, [isOpen]);

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts/following`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following);
      }
    } catch (error) {
      console.error("Error fetching following list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (displayName) => {
    window.open(`/profile/${encodeURIComponent(displayName)}`, '_blank');
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts/search-users?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter following list based on search term
  const filteredFollowing = following.filter(user => 
    user.displayName.toLowerCase().includes(followingSearchTerm.toLowerCase())
  );

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content following-list-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          
        <button className="modal-close" onClick={onClose}>×</button>
          {/* <h2>Following</h2> */}
        </div>
        
        <div className="following-content">
          <div className="user-search-container">
            <input
              type="text"
              placeholder="Search for users to follow..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search"
            />
            {searchLoading && <div className="search-loading">Searching...</div>}
          </div>

          {searchTerm.trim() && searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              <div className="following-list">
                {searchResults.map((user, index) => (
                  <div key={index} className="following-item" onClick={() => handleProfileClick(user.displayName)}>
                    <div className="following-info">
                      <h3 className="following-name">{user.displayName}</h3>
                      {user.bio && <p className="following-bio">{user.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchTerm.trim() && searchResults.length === 0 && !searchLoading && (
            <p className="no-results">No users found matching "{searchTerm}"</p>
          )}

          {!searchTerm.trim() && (
            <>
              <div className="following-section">
                <h3>Following</h3>
                <div className="following-search-container">
                  <input
                    type="text"
                    placeholder="Search your following list..."
                    value={followingSearchTerm}
                    onChange={(e) => setFollowingSearchTerm(e.target.value)}
                    className="following-search"
                  />
                </div>
              </div>
              {loading ? (
                <p>Loading...</p>
              ) : following.length === 0 ? (
                <p className="no-following">You're not following anyone yet.</p>
              ) : filteredFollowing.length === 0 ? (
                <p className="no-results">No following users match "{followingSearchTerm}"</p>
              ) : (
                <div className="following-list">
                  {filteredFollowing.map((user, index) => (
                    <div key={index} className="following-item" onClick={() => handleProfileClick(user.displayName)}>
                      <div className="following-info">
                        <h3 className="following-name">{user.displayName}</h3>
                      </div>
                      <div className="following-date">
                        Followed {new Date(user.followedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingList;