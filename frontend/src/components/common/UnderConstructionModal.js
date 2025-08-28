import { useEffect, useRef } from "react";

const UnderConstructionModal = ({ isOpen, onClose }) => {
  const dialogRef = useRef(null);

  // Handle opening and closing the dialog
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

  return (
    <dialog id="modal" ref={dialogRef} onClose={onClose}>
      <img
        style={{ display: "block", margin: "0 auto" }}
        src="/construction.jpg"
        alt="Under Construction"
      />
      <h1 style={{ paddingTop: "2rem", textAlign: "center" }}>
        Site Currently Under Construction
      </h1>
      <h4 style={{ marginLeft: "1.5rem" }}>
        Improvement/s currently being worked:
      </h4>
      <ul>
        <li>
          Change link for getting tester artist name & date to retrieve latest
          concert data available and automatically bring up results (use
          previous days date)
        </li>
      </ul>
      <h4 style={{ marginLeft: "1.5rem" }}>
        Planned upcoming improvements/bug fixes:
      </h4>
      <ul>
        <li>
          Start switching to utilizing MUI or shadcn/ui for components.
          </li>
        <li>
          See if feasible when adding a band, to display other bands at that
          show. (ex. - enter King Gizz & 11/15/2024, King Gizz would show up,
          but also the opener King Stingray. Perhaps within a dropdown in the
          same component.)
        </li>
        <li>
          add ability to remove specific songs from "seen" set (for accurate
          tracking if arrived late/left early)
        </li>
        <li>create pie chart divided by number of times per song vs total.</li>
        <li>create personal page to display shows listed</li>
        <li>
          Figure out why page logs out on refresh for mobile, but not desktop.
        </li>
        <li>
          create a song page that displays information about the specific song
          as well as when you've seen it
        </li>
        <li>Find reliable api for artist images to display</li>
        <li>
          Used prop drilling out of convenience from Dashboard -- ConcertForm --
          ConcertDetailsModal. When finished with more important tasks, refactor
          to use context.
        </li>
        <li>Update and optimize styling (desktop and mobile)</li>
      </ul>
      <form method="dialog" id="modal-actions">
        <button style={{ marginBottom: "2rem" }}>Close</button>
      </form>
    </dialog>
  );
};

export default UnderConstructionModal;
