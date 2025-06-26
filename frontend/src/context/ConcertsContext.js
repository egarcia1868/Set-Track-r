import { createContext, useReducer } from "react";

export const ConcertsContext = createContext();

export const concertsReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_ARTISTS":
      return {
        ...state,
        artists: action.payload,
      };
    case "DELETE_CONCERT":
      const { artistId, concertId } = action.payload;
      const newArtists = state.artists
        .map((artist) => {
          if (artist.artistId === artistId) {
            const updatedConcerts = artist.concerts.filter(
              (concert) => concert.concertId !== concertId,
            );
            return updatedConcerts.length > 0
              ? { ...artist, concerts: updatedConcerts }
              : null;
          }
          return artist;
        })
        .filter(Boolean);

      return {
        ...state,
        artists: newArtists,
      };
    case "ADD_CONCERT":
      const foundArtist = state.artists.some(
        (artist) => artist.artistName === action.payload.artistName,
      );
      const updatedArtists = state.artists.map((artist) =>
        artist.artistId === action.payload.artistId
          ? {
              ...artist,
              concerts: [
                ...artist.concerts,
                ...action.payload.concerts.filter(
                  (newConcert) =>
                    !artist.concerts.some(
                      (existingConcert) =>
                        existingConcert.concertId === newConcert.concertId,
                    ),
                ), // Add only new concerts
              ],
            }
          : artist,
      );
      !foundArtist && updatedArtists.push(action.payload);

      return {
        ...state,
        artists: updatedArtists,
        // artists: [action.payload, ...state.artists]
      };
    case "GET_SAVED_ARTISTS":
      return {
        ...state,
        artists: action.payload,
      };
    default:
      return state;
  }
};

export const ConcertsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(concertsReducer, {
    artists: [],
  });

  return (
    <ConcertsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ConcertsContext.Provider>
  );
};
