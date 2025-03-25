import { createContext, useReducer } from "react";

export const ArtistsContext = createContext();

export const artistsReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_ARTISTS":
      return { 
        artists: action.payload
      };
    default:
      return state;
  }
};

export const ArtistsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(artistsReducer, {
    artists: null,
  });

  return (
    <ArtistsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ArtistsContext.Provider>
  );
};
