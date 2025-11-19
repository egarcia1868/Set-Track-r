import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import App from "./App";
import { ConcertsContextProvider } from "./context/ConcertsContext";
import { AuthProvider } from "./context/AuthContext";
import { UserConcertsProvider } from "./context/UserConcertsContext";
import { ChatProvider } from "./context/ChatContext";

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={window.location.origin}
      audience={audience}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
      scope="openid profile email"
    >
      <AuthProvider>
        <UserConcertsProvider>
          <ConcertsContextProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </ConcertsContextProvider>
        </UserConcertsProvider>
      </AuthProvider>
    </Auth0Provider>
  </React.StrictMode>,
);
