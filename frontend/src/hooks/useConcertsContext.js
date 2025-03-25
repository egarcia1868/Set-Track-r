import { ConcertsContext } from "../context/ConcertsContext";
import { useContext } from "react";

export const useConcertsContext = () => {
  const context = useContext(ConcertsContext);

  if (!context) {
    throw Error(
      "useConcertsContext must be used inside an ConcertContextProvider"
    );
  }
  return context;
};
