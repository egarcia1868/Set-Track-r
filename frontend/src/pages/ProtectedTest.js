// ProtectedTest.js
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const ProtectedTest = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const callProtectedRoute = async () => {
    try {
      const token = await getAccessTokenSilently({
        audience: process.env.REACT_APP_AUTH0_AUDIENCE, // matches your Auth0 API identifier
      });

      const res = await fetch("http://localhost:3000/api/protected", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await res.json();
      console.log("Protected data:", data);
    } catch (err) {
      console.error("Error calling protected route", err);
    }
  };

  return (
    <div>
      {/* <h2>Test Protected Route</h2> */}
      {/* {isAuthenticated && ( */}
      <button onClick={callProtectedRoute}>Call Protected Backend Route</button>
      {/* )} */}
    </div>
  );
};

export default ProtectedTest;
