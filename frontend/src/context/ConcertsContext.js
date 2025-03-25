import { createContext, useReducer } from "react";

export const ConcertsContext = createContext();

export const concertsReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_ARTISTS":
      return {
        ...state,
        concerts: action.payload.concerts,
        artists: action.payload.artists
      };
    case "ADD_CONCERT":
      return {
        ...state,
        concerts: [action.payload, ...state.concerts]
      }
    case "GET_SAVED_ARTISTS":
      return {
        ...state,
        artists: action.payload
      }
    default:
      return state;
  }
};

export const ConcertsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(concertsReducer, {
    concerts: [],
    artists: null
  });

  return (
    <ConcertsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ConcertsContext.Provider>
  );
};
