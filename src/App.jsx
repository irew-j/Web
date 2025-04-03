import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Benefits from "./pages/Benefits";
import Trends from "./pages/Trends";
import Community from "./pages/Community";
import MyPage from "./pages/MyPage";

const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen font-inter bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/benefits" element={<Benefits />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/community" element={<Community />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
