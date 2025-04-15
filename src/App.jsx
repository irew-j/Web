
// // src/App.js

// import React, { useState } from 'react';
// import Header from './components/Header';
// import SearchBar from './components/SearchBar';
// import TripResult from './components/TripResult';
// import LoginPage from './pages/LoginPage';
// import SignupPage from './pages/SignupPage';
// import TripHistoryPage from './pages/TripHistoryPage';
// import { useWeather } from './hooks/useWeather';
// import Storybook from './components/Storybook';

// function App() { 
//   const [location, setLocation] = useState('');
//   const [keyword, setKeyword] = useState('');
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [view, setView] = useState('home');

//   // 예시 trip 데이터
//   const mockTrip = {
//     date: '2025-03-24',
//     location: '춘천',
//     keywords: ['감성', '호수', '힐링'],
//     memo: '춘천 남이섬에서 봄바람 맞으며 힐링한 하루 🌸',
//     imageUrl: 'https://source.unsplash.com/400x250/?lake,spring',
//   };

//   const { weather, loading } = useWeather(location);

//   // 검색 실행 함수
//   const handleSearch = () => {
//     console.log('검색 실행:', location, keyword);
//   };

//   // 페이지 이동 처리
//   const handleNavigate = (page) => {
//     setView(page);
//   };

//   return (
//     <div className="App font-sans">
//       <Header
//         isLoggedIn={isLoggedIn}
//         onLogout={() => {
//           setIsLoggedIn(false);
//           handleNavigate('home');
//         }}
//         onNavigate={handleNavigate}
//       />

//       <main className="max-w-4xl mx-auto p-4">
//         {/* 홈 화면 */}
//         {view === 'home' && (
//           <>
//             <SearchBar
//               location={location}
//               setLocation={setLocation}
//               keyword={keyword}
//               setKeyword={setKeyword}
//               onSearch={handleSearch}
//             />
//             {!loading && location && <TripResult weather={weather} />}
//           </>
//         )}

//         {/* 로그인 화면 */}
//         {view === 'login' && (
//           <LoginPage
//             onLogin={() => {
//               setIsLoggedIn(true);
//               handleNavigate('home');
//             }}
//           />
//         )}

//         {/* 회원가입 화면 */}
//         {view === 'signup' && (
//           <SignupPage
//             onSignup={() => {
//               setIsLoggedIn(true);
//               handleNavigate('home');
//             }}
//           />
//         )}

//         {/* 여행 기록 화면 */}
//         {view === 'history' && <TripHistoryPage />}

//         {/* Storybook 화면 */}
//         {view === 'storybook' && <Storybook trip={mockTrip} />}
//       </main>
//     </div>
//   );
// }

// export default App;

import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState("⏳ 확인 중...");

  useEffect(() => {
    fetch('https://randomtripapp-byd3gsg8bhh2f6cx.koreacentral-01.azurewebsites.net/api/hello')
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => {
        console.error("API 연결 실패", err);
        setMessage("❌ 백엔드 연결 실패");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">{message}</h1>
    </div>
  );
}

export default App;
