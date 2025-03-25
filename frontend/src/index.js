import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ArtistsContextProvider } from "./context/ArtistsContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ArtistsContextProvider>
      <App />
    </ArtistsContextProvider>
  </React.StrictMode>
);
