import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUserConcerts } from "../../context/UserConcertsContext";
import { BASE_URL } from "../../utils/config";
import GroupedConcertDetails from "./GroupedConcertDetails";

const ConcertDetailsModal = ({
  isOpen,
  onClose,
  concertList = [],
  refreshConcerts,
  onNextPage,
  onPrevPage,
  currentPage = 1,
  hasMorePages = true,
  navigationDirection = null,
}) => {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth();
  const { userConcerts, isAlreadySaved } = useUserConcerts();
  const [error, setError] = useState(null);
  const [selectedConcertIds, setSelectedConcertIds] = useState(new Set());
  const selectedConcerts = concertList.filter((c) =>
    selectedConcertIds.has(c.id),
  );

  // Group concerts by venue, city, and date
  const groupedConcerts = useMemo(() => {
    const groups = {};
    
    concertList.forEach(concert => {
      // Create a more specific key to ensure proper grouping
      const venueId = concert.venue.id || concert.venue.name;
      const cityName = concert.venue.city.name;
      const eventDate = concert.eventDate;
      const key = `${venueId}-${cityName}-${eventDate}`;
      
      if (!groups[key]) {
        groups[key] = {
          venue: concert.venue.name,
          city: concert.venue.city.name,
          state: concert.venue.city.state,
          country: concert.venue.city.country.name,
          date: concert.eventDate,
          concerts: []
        };
      }
      
      groups[key].concerts.push(concert);
    });
    
    // Add debug logging to see what's being grouped
    console.log("Grouped concerts:", Object.values(groups).map(group => ({
      venue: group.venue,
      date: group.date,
      artistCount: group.concerts.length,
      artists: group.concerts.map(c => c.artist.name)
    })));
    
    return Object.values(groups);
  }, [concertList]);


  const handleConcertToggle = (concertId) => {
    setSelectedConcertIds(prev => {
      const updated = new Set(prev);
      if (updated.has(concertId)) {
        updated.delete(concertId);
      } else {
        updated.add(concertId);
      }
      return updated;
    });
  };

  const handleSelectAll = (venueGroup, selectAll) => {
    setSelectedConcertIds(prev => {
      const updated = new Set(prev);
      
      venueGroup.concerts.forEach(concert => {
        if (selectAll && !isAlreadySaved(concert)) {
          updated.add(concert.id);
        } else {
          updated.delete(concert.id);
        }
      });
      
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

  // Close on click outside or handle keyboard events
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClickOutside = (e) => {
      // If dialog is open and click is outside it
      if (dialog.open && !dialog.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = async (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && selectedConcerts.length > 0 && isOpen) {
        e.preventDefault();
        const body = { user, concertData: selectedConcerts };

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
          dialogRef.current?.close();
          onClose();
          refreshConcerts();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, selectedConcerts, isOpen, user, refreshConcerts]);

  // Scroll to bottom when navigating to previous page
  useEffect(() => {
    if (navigationDirection === "prev" && isOpen) {
      const dialog = dialogRef.current;
      if (dialog) {
        // Wait a moment for content to render, then scroll to bottom
        setTimeout(() => {
          dialog.scrollTop = dialog.scrollHeight;
        }, 200);
      }
    }
  }, [concertList, navigationDirection, isOpen]);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  const saveConcerts = useCallback(
    async (body) => {
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
    },
    [handleClose, refreshConcerts],
  );

  const handleSubmit = useCallback(async () => {
    const body = { user, concertData: selectedConcerts };

    await saveConcerts(body);
  }, [user, selectedConcerts, saveConcerts]);

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
            groupedConcerts.map((venueGroup, index) => (
              <GroupedConcertDetails
                key={`${venueGroup.venue}-${venueGroup.city}-${venueGroup.date}`}
                venueGroup={venueGroup}
                selectedConcerts={Array.from(selectedConcertIds)}
                onConcertToggle={handleConcertToggle}
                onSelectAll={handleSelectAll}
                isAuthenticated={isAuthenticated}
                userConcerts={userConcerts}
              />
            ))
          )}
        </div>

        <form method="dialog" id="modal-actions" className="modal-actions">
          <button type="button" onClick={handleClose}>
            Close
          </button>
          {onPrevPage && currentPage > 1 && (
            <button
              type="button"
              onClick={onPrevPage}
              className="pagination-btn"
            >
              Prev Page
            </button>
          )}
          {onNextPage && hasMorePages && (
            <button
              type="button"
              onClick={onNextPage}
              className="pagination-btn"
            >
              Next Page
            </button>
          )}
          {selectedConcerts.length < 1 ? (
            <button disabled>Select shows to add</button>
          ) : (
            <button type="button" onClick={handleSubmit}>
              Add show{selectedConcerts.length > 1 && "s"} to my list!
            </button>
          )}
        </form>
      </div>
    </dialog>
  );
};

export default ConcertDetailsModal;
