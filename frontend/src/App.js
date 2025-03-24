import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ArtistConcerts from "./pages/ArtistConcerts";
import Navbar from "./components/Navbar";

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
      </BrowserRouter>
    </div>
  );
}

export default App;
