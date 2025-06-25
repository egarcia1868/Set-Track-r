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
}, [onClose]);


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
    // <dialog
    //   ref={dialogRef}
    //   onClose={onClose}
    //   style={{
    //     padding: "2rem",
    //     border: "none",
    //     borderRadius: "10px",
    //     width: "80%",
    //     maxWidth: "700px",
    //     background: "#fff",
    //     zIndex: 1000,
    //   }}
    // >
    //   <img
    //     style={{ display: "block", margin: "0 auto" }}
    //     src="/construction.jpg"
    //     alt="Under Construction"
    //   />
    //   <h1 style={{ paddingTop: "2rem", textAlign: "center" }}>
    //     Site Currently Under Construction
    //   </h1>
     <dialog
      id="modal"
      ref={dialogRef}
      onClose={onClose}
      // className="construction-modal"
      // style={{ backgroundImage: 'url("/caution3.jpg")', backgroundSize: 'cover', filter: 'saturate(60%)'}}
    >
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
        <li>create login for tracking personal shows</li>
        <li>
          Set up db to be structured something like the following:
          <pre>
          <br />
          settrackr
          <br /> ├── users
          <br /> │     ├ _id,
          <br /> │     ├ username,
          <br /> │     ├ password: (hashed),
          <br /> │     └ concertsAttended: [concertId1, concertId2, ...]
          <br /> │
          <br /> ├── artists
          <br /> │     ├ _id,
          <br /> │     ├ artistName,
          <br /> │     └ mbid
          <br /> │
          <br /> └── concerts
          <br />       ├ _id,
          <br />       ├ artistId,
          <br />       ├ eventDate,
          <br />       ├ venue,
          <br />       ├ sets,
          <br />       └ url
          </pre>
        </li>
        <li>re-organize routes and route functions to save users, artists, and concert info to match new db structure.</li>
      </ul>
      <h4 style={{ marginLeft: "1.5rem" }}>
        Planned upcoming improvements/bug fixes:
      </h4>
      <ul>
        <li>create new home page with suggestions as to how to add artist</li>
        <li>
          add ability to bring up selections of concerts by artist, cityName and year (somewhat similar to next item on list).  Set default behavior to present search results with an "add" button, rather than automatically adding it to db.
        </li>
        <li>
          Add ability to select multiple dates on the show add form - (check
          commit from 4/16 for starting point)
        </li>
        <li>
          add ability to remove specific songs from "seen" set (for accurate
          tracking if arrived late/left early)
        </li>
        <li>create pie chart divided by number of times per song vs total.</li>
        <li>create personal page to display shows listed</li>
        <li>update login with OAuth</li>
        <li>
          create a song page that displays information about the specific song
          as well as when you've seen it
        </li>
        <li>
          add buttons to save new property that stores live/watched/listened. --
          add checkboxes to add modal.
        </li>
        <li>Find reliable api for artist images to display</li>
        <li>Update and optimize styling (general and for mobile)</li>
        <li>
          create separate links from main page to go to either artist's song
          list or concert lists.
        </li>
      </ul>
      <form method="dialog" id="modal-actions">
        <button style={{ marginBottom: "2rem" }}>Close</button>
        {/* <button onClick={saveConcert}>Add show to my list!</button> */}
      </form>
    </dialog>
  );
};

export default UnderConstructionModal;


// import { useRef, useEffect } from "react";

// const UnderConstructionModal = ({ isOpen, onClose }) => {
//   const dialogRef = useRef(null);

//   if (isOpen && dialogRef.current) {
//     dialogRef.current.showModal();
//     dialogRef.current.scrollTop = 0;
//   }

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dialogRef.current && !dialogRef.current.contains(event.target)) {
//         // dialogRef.current.close();
//         onClose();
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [onClose]);

//   if (!isOpen) {
//     return null; // Don't render anything if the modal is not open
//   }

//   return (
//     <dialog
//       id="modal"
//       ref={dialogRef}
//       onClose={onClose}
//       // className="construction-modal"
//       // style={{ backgroundImage: 'url("/caution3.jpg")', backgroundSize: 'cover', filter: 'saturate(60%)'}}
//     >
//       <img
//         style={{ display: "block", margin: "0 auto" }}
//         src="/construction.jpg"
//         alt="Under Construction"
//       />
//       <h1 style={{ paddingTop: "2rem", textAlign: "center" }}>
//         Site Currently Under Construction
//       </h1>
//       <h4 style={{ marginLeft: "1.5rem" }}>
//         Improvement/s currently being worked:
//       </h4>
//       <ul>
//         <li>create login for tracking personal shows</li>
//         <li>
//           Set up db to be structured something like the following:
//           <pre>
//           <br />
//           settrackr
//           <br /> ├── users
//           <br /> │     ├ _id,
//           <br /> │     ├ username,
//           <br /> │     ├ password: (hashed),
//           <br /> │     └ concertsAttended: [concertId1, concertId2, ...]
//           <br /> │
//           <br /> ├── artists
//           <br /> │     ├ _id,
//           <br /> │     ├ artistName,
//           <br /> │     └ mbid
//           <br /> │
//           <br /> └── concerts
//           <br />       ├ _id,
//           <br />       ├ artistId,
//           <br />       ├ eventDate,
//           <br />       ├ venue,
//           <br />       ├ sets,
//           <br />       └ url
//           </pre>
//         </li>
//         <li>re-organize routes and route functions to save users, artists, and concert info to match new db structure.</li>
//       </ul>
//       <h4 style={{ marginLeft: "1.5rem" }}>
//         Planned upcoming improvements/bug fixes:
//       </h4>
//       <ul>
//         <li>create new home page with suggestions as to how to add artist</li>
//         <li>
//           add ability to bring up selections of concerts by artist, cityName and year (somewhat similar to next item on list).  Set default behavior to present search results with an "add" button, rather than automatically adding it to db.
//         </li>
//         <li>
//           Add ability to select multiple dates on the show add form - (check
//           commit from 4/16 for starting point)
//         </li>
//         <li>
//           add ability to remove specific songs from "seen" set (for accurate
//           tracking if arrived late/left early)
//         </li>
//         <li>create pie chart divided by number of times per song vs total.</li>
//         <li>create personal page to display shows listed</li>
//         <li>update login with OAuth</li>
//         <li>
//           create a song page that displays information about the specific song
//           as well as when you've seen it
//         </li>
//         <li>
//           add buttons to save new property that stores live/watched/listened. --
//           add checkboxes to add modal.
//         </li>
//         <li>Find reliable api for artist images to display</li>
//         <li>Update and optimize styling (general and for mobile)</li>
//         <li>
//           create separate links from main page to go to either artist's song
//           list or concert lists.
//         </li>
//       </ul>
//       <form method="dialog" id="modal-actions">
//         <button style={{ marginBottom: "2rem" }}>Close</button>
//         {/* <button onClick={saveConcert}>Add show to my list!</button> */}
//       </form>
//     </dialog>
//   );
//   // }
// };

// export default UnderConstructionModal;
