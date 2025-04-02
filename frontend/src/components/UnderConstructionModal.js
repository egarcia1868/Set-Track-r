import { useRef } from "react";

const UnderConstructionModal = ({ isOpen, onClose }) => {
  const dialogRef = useRef(null);

  if (isOpen && dialogRef.current) {
    dialogRef.current.showModal();
  }

  return (
    <dialog
      id="modal"
      ref={dialogRef}
      onClose={onClose}
      className="construction-modal"
      // style={{ backgroundImage: 'url("/caution3.jpg")', backgroundSize: 'cover', filter: 'saturate(60%)'}}
    >
      <img style={{ display: 'block', margin: '0 auto'}} src="/construction.jpg" alt="Under Construction" />
      <h1 style={{ paddingTop: '2rem', textAlign: "center" }}>Site Currently Under Construction</h1>
      <h4 style={{ marginLeft: "1.5rem" }}>Planned improvements:</h4>
      <ul>
        <li>
          Create component that displays all tracks seen live, ranked most to
          least, with asc/dec switch
        </li>
        <li>reuse add modal for displaying individual shows -- maybe</li>
        <li>
          add buttons to save new property that stores live/watched/listened. --
          add checkboxes to add modal.
        </li>
        <li>
          add ability to remove concert
        </li>
        <li>
          add ability to specific songs from set (for accurate tracking if arived late/left early)
        </li>
        <li>
          set link for individual concerts and for individual songs. probably on
          main page.
        </li>
        <li>
          change from saving each individual concert to its own entry to
          updating the entry for that artist to contain a new concert within.
        </li>
        <li>create login for tracking personal shows</li>
        <li>create personal page to display shows listed</li>
        <li>update login with OAuth</li>
        <li>Update and optimize styling (general and for mobile)</li>
      </ul>
      <form method="dialog" id="modal-actions">
        <button style={{marginBottom:'2rem'}}>Close</button>
        {/* <button onClick={saveConcert}>Add show to my list!</button> */}
      </form>
    </dialog>
  );
  // }
};

export default UnderConstructionModal;
