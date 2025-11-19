import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import ArtistConcerts from "./pages/ArtistConcerts";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import Chat from "./pages/Chat";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import PrivateRoute from "./components/common/PrivateRoute";
import RootRoute from "./pages/RootRoute";

function App() {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <main className="pages">
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/profile/:username" element={<PublicProfile />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/artist/:artistName?"
              element={
                <PrivateRoute>
                  <ArtistConcerts />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
