import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConcertsContextProvider } from "./context/ConcertsContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ConcertsContextProvider>
      <App />
    </ConcertsContextProvider>
  </React.StrictMode>
);
