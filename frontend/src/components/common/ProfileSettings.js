import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { BASE_URL } from "../../utils/config";

const ProfileSettings = ({ isOpen, onClose }) => {
  const { getAccessTokenSilently, user } = useAuth0();
  const [profile, setProfile] = useState({
    displayName: "",
    name: "",
    bio: "",
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [publicError, setPublicError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    } else {
      // Clear all error states when modal closes
      setMessage("");
      setShowMessage(false);
      setPublicError("");
      setDisplayNameError("");
    }
  }, [isOpen]);

  // Handle escape key press and body scroll prevention
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

  const fetchProfile = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Auto-populate name from Auth0 user.name if profile.name is empty
        const profileData = { ...data.profile };
        if (!profileData.name && user?.name) {
          profileData.name = user.name;
        }
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = await getAccessTokenSilently();

      const response = await fetch(`${BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: profile.displayName,
          name: profile.name,
          bio: profile.bio,
          isPublic: profile.isPublic,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile((prev) => ({ ...prev, ...data.profile }));
        setMessage("Profile updated successfully!");
        setTimeout(() => setShowMessage(true), 10);

        // Hide success message after 1.2 seconds and close modal after 1.5 seconds
        setTimeout(() => {
          setShowMessage(false);
        }, 1200);

        setTimeout(() => {
          setMessage("");
          onClose();
        }, 1500);
      } else {
        console.error("Profile update failed:", data);
        // Handle display name uniqueness error specifically
        if (
          data.error &&
          data.error.includes("display name is already taken")
        ) {
          setDisplayNameError(data.error);
        } else {
          setMessage(data.error || "Failed to update profile");
          setTimeout(() => setShowMessage(true), 10);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile");
      setTimeout(() => setShowMessage(true), 10);
    } finally {
      setLoading(false);
    }
  };

  const handlePublicToggle = async (e) => {
    const isChecked = e.target.checked;

    if (isChecked && !profile.displayName.trim()) {
      setPublicError("Display Name needed to make profile public");
      return;
    }

    if (isChecked && profile.displayName.trim()) {
      // Check if display name is unique before allowing public profile
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${BASE_URL}/api/users/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: profile.displayName.trim(),
            name: profile.name,
            bio: profile.bio,
            isPublic: false, // Don't make public yet, just validate the display name
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (
            data.error &&
            data.error.includes("display name is already taken")
          ) {
            setPublicError(
              "Display name must be unique to make profile public",
            );
            return;
          } else {
            setPublicError("Error validating display name");
            return;
          }
        }

        // If validation passes, now make it public
        const publicResponse = await fetch(`${BASE_URL}/api/users/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: profile.displayName.trim(),
            name: profile.name,
            bio: profile.bio,
            isPublic: true,
          }),
        });

        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          setProfile((prev) => ({ ...prev, ...publicData.profile }));
          setPublicError("");
        } else {
          setPublicError("Error making profile public");
          return;
        }
      } catch (error) {
        console.error("Error validating display name:", error);
        setPublicError("Error validating display name");
        return;
      }
    } else {
      // If unchecking, just update normally
      setPublicError("");
      setProfile((prev) => ({
        ...prev,
        isPublic: isChecked,
      }));
    }
  };

  const copyShareableUrl = () => {
    if (profile.displayName) {
      const url = `${window.location.origin}/profile/${encodeURIComponent(profile.displayName)}`;
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Profile Settings</h2>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Your name (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Display Name:</label>
            <input
              type="text"
              id="displayName"
              value={profile.displayName}
              onChange={(e) => {
                setProfile((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }));
                // Clear errors when user starts typing
                if (publicError && e.target.value.trim()) {
                  setPublicError("");
                }
                if (displayNameError) {
                  setDisplayNameError("");
                }
              }}
              placeholder="Your public display name"
            />
            {displayNameError && (
              <p
                className="error-text"
                style={{ color: "red", fontSize: "14px", marginTop: "5px" }}
              >
                {displayNameError}
              </p>
            )}
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
                onChange={handlePublicToggle}
              />
              Make my profile public
            </label>
            <p className="help-text">
              When public, others can view your concert history via a shareable
              link
            </p>
            {publicError && (
              <p
                className="error-text"
                style={{ color: "red", fontSize: "14px", marginTop: "5px" }}
              >
                {publicError}
              </p>
            )}
          </div>

          {profile.isPublic && profile.displayName && (
            <div className="form-group">
              <label>Shareable URL:</label>
              <div className="url-container">
                <input
                  type="text"
                  value={`${window.location.origin}/profile/${encodeURIComponent(profile.displayName)}`}
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
            <div
              className={`message ${message.includes("success") || message.includes("copied") ? "success" : "error"} ${showMessage ? "show" : ""}`}
            >
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
