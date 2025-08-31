import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import App from "./App";
import { ConcertsContextProvider } from "./context/ConcertsContext";

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

console.log("Auth0 config:", { domain, clientId, audience });

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: "openid profile email offline_access",
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <ConcertsContextProvider>
        <App />
      </ConcertsContextProvider>
    </Auth0Provider>
  </React.StrictMode>,
);
