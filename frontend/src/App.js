import { BrowserRouter, Routes, Route } from "react-router-dom";

import ArtistConcerts from "./pages/ArtistConcerts";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import PrivateRoute from "./components/common/PrivateRoute";
import RootRoute from "./pages/RootRoute";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <div className="pages">
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/profile/:shareableId" element={<PublicProfile />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/artist"
              element={
                <PrivateRoute>
                  <ArtistConcerts />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
