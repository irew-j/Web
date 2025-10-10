"use client"

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import CustomItineraryPage from "./pages/CustomItineraryPage";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import MyFootprintsPage from "./pages/MyFootprintsPage"; // Import MyFootprintsPage
import MyTravelMapPage from "./pages/MyTravelMapPage"; // Import MyTravelMapPage
import { AuthProvider } from './context/AuthContext';
import { EnhancedRandomTripProvider } from './context/EnhancedRandomTripContext';
import EnhancedRandomTripPage from "./pages/EnhancedRandomTripPage";
import ChatFeature from './components/ChatFeature'; // 새로 생성한 ChatFeature 컴포넌트 임포트


const App = () => {
  // isChatOpen, toggleChat, useLocation 관련 로직은 ChatFeature로 이동했으므로 제거합니다.

  return (
    <AuthProvider>
      <EnhancedRandomTripProvider>
        <Router>
          <div className="App min-h-screen flex flex-col bg-gradient-to-br from-sky-100 via-white to-blue-200 font-sans">
            <Header className="fixed w-full z-50 transition-all duration-300 shadow-lg" />
            <main className="container mx-auto px-4 py-12 md:py-16 flex-grow mt-20">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/custom" element={<CustomItineraryPage />} />
                  <Route path="/random" element={<EnhancedRandomTripPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/trip/:tripId" element={<TripPage />} />
                  <Route path="/my-footprints" element={<MyFootprintsPage />} /> {/* Add new route */}
                  <Route path="/my-travel-map" element={<MyTravelMapPage />} /> {/* Add new route for MyTravelMapPage */}
                </Routes>
              </ErrorBoundary>
            </main>
            <Footer />

            {/* ChatFeature 컴포넌트를 Router 내부에 렌더링합니다. */}
            <ChatFeature />
          </div>
        </Router>
      </EnhancedRandomTripProvider>
    </AuthProvider>
  );
};

export default App;
