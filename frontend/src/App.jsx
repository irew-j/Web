"use client"

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import CustomItineraryPage from "./pages/CustomItineraryPage";
import RandomTripPage from "./pages/RandomTripPage";

const App = () => {
  return (
    <Router>
      <div className="App min-h-screen flex flex-col bg-gradient-to-br from-sky-100 via-white to-blue-200 font-sans">
        <Header className="fixed w-full z-50 transition-all duration-300 shadow-lg" />
        <main className="container mx-auto px-4 py-12 md:py-16 flex-grow mt-20">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/custom" element={<CustomItineraryPage />} />
              <Route path="/random" element={<RandomTripPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
