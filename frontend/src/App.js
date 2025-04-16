import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ArtistConcerts from "./pages/ArtistConcerts";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <div className="pages">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artist" element={<ArtistConcerts />} />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
