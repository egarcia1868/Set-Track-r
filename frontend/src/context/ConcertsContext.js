import { createContext, useReducer } from "react";

export const ConcertsContext = createContext();

export const concertsReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_ARTISTS":
      return {
        ...state,
        artists: action.payload
      };
    case "ADD_CONCERT":
      return {
        ...state,
        artists: [action.payload, ...state.artists]
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
    artists: []
  });

  return (
    <ConcertsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ConcertsContext.Provider>
  );
};
