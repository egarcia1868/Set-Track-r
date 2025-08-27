import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../../utils/config";
import { useAuth0 } from "@auth0/auth0-react";
import NewConcertDetails from "./NewConcertDetails";

const ConcertDetailsModal = ({
  isOpen,
  onClose,
  concertList = [],
  refreshConcerts,
}) => {
  const { user } = useAuth0();
  const [error, setError] = useState(null);
  const [checkedConcertIds, setCheckedConcertIds] = useState(new Set());
  const selectedConcerts = concertList.filter((c) =>
      checkedConcertIds.has(c.id),
    );

  const handleCheckboxChange = (concertId) => (e) => {
    e.stopPropagation();
    setCheckedConcertIds((prev) => {
      const updated = new Set(prev);
      if (e.target.checked) {
        updated.add(concertId);
      } else {
        updated.delete(concertId);
      }
      return updated;
    });
  };

  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }

    const handleClick = (e) => {
      // If the click target *is* the <dialog> element, it means the user clicked the backdrop
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener("click", handleClick);
    return () => dialog.removeEventListener("click", handleClick);
  }, [onClose, isOpen]);

  // Close on click outside or Escape
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClickOutside = (e) => {
      // If dialog is open and click is outside it
      if (dialog.open && !dialog.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  const saveConcerts = async (body) => {
    const response = await fetch(`${BASE_URL}/api/concerts/`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
    } else {
      handleClose();
      refreshConcerts();
    }
  };

  console.log('cid: ', selectedConcerts);
  console.log('cid2: ', selectedConcerts);

  const handleSubmit = async () => {
    const body = { user, concertData: selectedConcerts };

    await saveConcerts(body);
  };

  if (error) {
    return (
      <dialog id="modal" ref={dialogRef} onClose={onClose}>
        <p>Error: {error}</p>

        <form method="dialog" id="modal-actions">
          <button>Close</button>
        </form>
      </dialog>
    );
  }

return (
<dialog id="modal" ref={dialogRef} onClose={onClose} className="modal">
  <div className="modal-body">
    <div className="new-concerts">
      {!concertList || concertList.length === 0 ? (
        <p>Loading...</p>
      ) : (
        concertList.map((concert) => (
          <NewConcertDetails
            key={concert.concertId || concert.id}
            concert={concert}
            isChecked={checkedConcertIds.has(concert.id)}
            onCheckboxChange={handleCheckboxChange(concert.id)}
          />
        ))
      )}
    </div>

    <form method="dialog" id="modal-actions" className="modal-actions">
      <button type="button" onClick={handleClose}>Close</button>
      {selectedConcerts.length < 1 ?
       <button disabled>Select shows to add</button> :
      <button type="button" onClick={handleSubmit}>Add show{selectedConcerts.length > 1 && 's'} to my list!</button>
}
    </form>
  </div>
</dialog>

);

};

export default ConcertDetailsModal;
