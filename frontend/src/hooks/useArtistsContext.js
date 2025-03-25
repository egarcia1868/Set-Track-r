import { ArtistsContext } from "../context/ArtistsContext";
import { useContext } from "react";

export const useArtistsContext = () => {
  const context = useContext(ArtistsContext);

  if (!context) {
    throw Error(
      "useArtistsContext must be used inside an ArtistContextProvider"
    );
  }
  return context;
};
