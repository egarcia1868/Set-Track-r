import { useState, useEffect } from "react";

const RemoveConfirmationModal = ({
  isOpen,
  onConfirm,
  onCancel,
  artistName,
}) => {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConfirm = () => {
    if (dontAskAgain) {
      localStorage.setItem("skipRemoveConfirmation", "true");
    }
    onConfirm();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1001 }}
      onClick={handleOverlayClick}
    >
      <div className="confirmation-modal">
        <div className="modal-header">
          <h3>Remove Concert</h3>
        </div>
        <div className="modal-content">
          <p>
            Removing this concert will remove it from this {artistName} artist
            page.
          </p>
          <p>Are you sure you want to continue?</p>
        </div>
        <div className="modal-actions">
          <div className="checkbox-container">
            <label className="confirmation-checkbox-label">
              <input
                type="checkbox"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
              />
              <span>Don't ask again</span>
            </label>
          </div>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="confirm-btn" onClick={handleConfirm}>
              Remove Concert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveConfirmationModal;
