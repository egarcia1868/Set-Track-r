import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { BASE_URL } from "../utils/config";

const UserConcertsContext = createContext();

export const useUserConcerts = () => {
  const context = useContext(UserConcertsContext);
  if (!context) {
    throw new Error(
      "useUserConcerts must be used within a UserConcertsProvider",
    );
  }
  return context;
};

export const UserConcertsProvider = ({ children }) => {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth();
  const [userConcerts, setUserConcerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const clearCache = () => {
    setCacheTimestamp(null);
  };

  const isCacheValid = () => {
    if (!cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION;
  };

  const fetchUserConcerts = async (forceRefresh = false) => {
    if (!isAuthenticated) {
      setUserConcerts([]);
      clearCache();
      return;
    }

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid() && userConcerts.length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts/user/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserConcerts(data);
        setCacheTimestamp(Date.now());
      } else {
        console.error("Failed to fetch user concerts:", response.status);
        setUserConcerts([]);
        clearCache();
      }
    } catch (error) {
      console.error("Error fetching user concerts:", error);
      setUserConcerts([]);
      clearCache();
    } finally {
      setIsLoading(false);
    }
  };

  const isAlreadySaved = (setlist) => {
    return userConcerts.some((artist) =>
      artist.concerts?.some((concert) => concert.concertId === setlist.id),
    );
  };

  const addConcertToCollection = async (setlistData) => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${BASE_URL}/api/concerts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          concertData: [setlistData],
          user: user,
        }),
      });

      if (response.ok) {
        // Clear cache and refresh user concerts to update the UI
        clearCache();
        await fetchUserConcerts(true);
        return true;
      } else {
        const errorData = await response.json();
        console.error("Failed to add concert:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Error adding concert:", error);
      return false;
    }
  };

  const removeConcertFromCollection = async (setlistData) => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      const token = await getAccessTokenSilently();

      // Find the artist and concert in userConcerts to get the proper IDs
      const artistEntry = userConcerts.find((artist) =>
        artist.concerts?.some(
          (concert) => concert.concertId === setlistData.id,
        ),
      );

      if (!artistEntry) {
        return false;
      }

      const concertEntry = artistEntry.concerts.find(
        (concert) => concert.concertId === setlistData.id,
      );

      const response = await fetch(
        `${BASE_URL}/api/concerts/${artistEntry.artistId}/${concertEntry.concertId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Clear cache and refresh user concerts to update the UI
        clearCache();
        await fetchUserConcerts(true);
        return true;
      } else {
        const errorData = await response.json();
        console.error("Failed to remove concert:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Error removing concert:", error);
      return false;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserConcerts();
    } else {
      setUserConcerts([]);
      clearCache(); // Clear cache on logout
    }
  }, [isAuthenticated]);

  const value = {
    userConcerts,
    isLoading,
    fetchUserConcerts,
    isAlreadySaved,
    addConcertToCollection,
    removeConcertFromCollection,
    clearCache,
  };

  return (
    <UserConcertsContext.Provider value={value}>
      {children}
    </UserConcertsContext.Provider>
  );
};
