import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { BASE_URL } from "../../utils/config";

const FollowersList = ({ isOpen, onClose }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followersSearchTerm, setFollowersSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen]);

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/users/followers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers);
      }
    } catch (error) {
      console.error("Error fetching followers list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (displayName) => {
    window.open(`/profile/${encodeURIComponent(displayName)}`, "_blank");
  };

  // Filter followers list based on search term
  const filteredFollowers = followers.filter((user) =>
    user.displayName.toLowerCase().includes(followersSearchTerm.toLowerCase()),
  );

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.classList.remove("modal-open");
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content following-list-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="following-content">
          <div className="following-section">
            <h3>Followers</h3>
            <div className="following-search-container">
              <input
                type="text"
                placeholder="Search your followers..."
                value={followersSearchTerm}
                onChange={(e) => setFollowersSearchTerm(e.target.value)}
                className="following-search"
              />
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : followers.length === 0 ? (
            <p className="no-following">You don't have any followers yet.</p>
          ) : filteredFollowers.length === 0 ? (
            <p className="no-results">
              No followers match "{followersSearchTerm}"
            </p>
          ) : (
            <div className="following-list">
              {filteredFollowers.map((user, index) => (
                <div
                  key={index}
                  className="following-item"
                  onClick={() => handleProfileClick(user.displayName)}
                >
                  <div className="following-info">
                    <h3 className="following-name">{user.displayName}</h3>
                  </div>
                  <div className="following-date">
                    Followed you{" "}
                    {new Date(user.followedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersList;
