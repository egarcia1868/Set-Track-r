import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { BASE_URL } from "../../utils/config";

const ProfileSettings = ({ isOpen, onClose }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    isPublic: false,
    shareableId: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== FRONTEND: Profile update form submitted ===");
    setLoading(true);
    setMessage("");

    try {
      console.log("Getting access token...");
      const token = await getAccessTokenSilently();
      console.log("Token received, length:", token?.length);
      
      console.log("Sending profile update to:", `${BASE_URL}/api/concerts/profile`);
      console.log("Request data:", {
        displayName: profile.displayName,
        bio: profile.bio,
        isPublic: profile.isPublic,
      });
      
      const response = await fetch(`${BASE_URL}/api/concerts/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: profile.displayName,
          bio: profile.bio,
          isPublic: profile.isPublic,
        }),
      });

      const data = await response.json();
      console.log("Profile update response:", { status: response.status, data });

      if (response.ok) {
        setProfile((prev) => ({ ...prev, ...data.profile }));
        setMessage("Profile updated successfully!");
        setTimeout(() => setShowMessage(true), 10);
      } else {
        console.error("Profile update failed:", data);
        setMessage(data.error || "Failed to update profile");
        setTimeout(() => setShowMessage(true), 10);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile");
      setTimeout(() => setShowMessage(true), 10);
    } finally {
      setLoading(false);
    }
  };

  const copyShareableUrl = () => {
    if (profile.shareableId) {
      const url = `${window.location.origin}/profile/${profile.shareableId}`;
      navigator.clipboard.writeText(url);
      setMessage("Shareable URL copied to clipboard!");
      
      // Small delay to allow CSS transition to start from collapsed state
      setTimeout(() => {
        setShowMessage(true);
      }, 10);
      
      // Start shrinking animation after 4.5 seconds, clear after 5 seconds
      setTimeout(() => {
        setShowMessage(false);
      }, 4500);
      
      setTimeout(() => {
        setMessage("");
      }, 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Profile Settings</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="displayName">Display Name:</label>
            <input
              type="text"
              id="displayName"
              value={profile.displayName}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, displayName: e.target.value }))
              }
              placeholder="Your public display name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio:</label>
            <textarea
              id="bio"
              value={profile.bio}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell others about your music taste..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={profile.isPublic}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, isPublic: e.target.checked }))
                }
              />
              Make my profile public
            </label>
            <p className="help-text">
              When public, others can view your concert history via a shareable link
            </p>
          </div>

          {profile.isPublic && profile.shareableId && (
            <div className="form-group">
              <label>Shareable URL:</label>
              <div className="url-container">
                <input
                  type="text"
                  value={`${window.location.origin}/profile/${profile.shareableId}`}
                  readOnly
                  className="shareable-url"
                />
                <button
                  type="button"
                  onClick={copyShareableUrl}
                  className="copy-btn"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {message && (
            <div className={`message ${message.includes("success") || message.includes("copied") ? "success" : "error"} ${showMessage ? "show" : ""}`}>
              {message}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;