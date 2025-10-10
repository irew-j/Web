import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import GuideChat from '../components/GuideChat';
import { useAuth } from '../context/AuthContext';
import { createFootprint } from '../api/footprints';
import { getItineraryDetails } from '../api/itinerary';
import FootprintFloatingButton from '../components/FootprintFloatingButton';
import FootprintAuthModal from '../components/FootprintAuthModal';

const TripPage = () => {
  const { tripId } = useParams();
  const { username } = useAuth();
  const [destinationName, setDestinationName] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [itineraryDetails, setItineraryDetails] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [currentDestination, setCurrentDestination] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [recentFootprint, setRecentFootprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleLeaveFootprint = () => {
    setIsAuthModalOpen(true);
  };

  const handleFootprintCreated = (footprint) => {
    setRecentFootprint(footprint);
    // 성공 메시지나 추가 처리
  };

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!tripId) {
        setError('여행 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const details = await getItineraryDetails(tripId);
        setItineraryDetails(details);

        if (details.items && details.items.length > 0) {
          const destinationList = details.items.map(item => item.destination);
          setDestinations(destinationList);
          setCurrentDestination(destinationList[0]);
          setDestinationName(details.name || `${destinationList[0].title} 여행`);
        } else {
          setDestinationName(details.name || '여행');
        }
      } catch (err) {
        console.error('여행 상세 정보 불러오기 실패:', err);
        setError('여행 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">여행 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">오류가 발생했습니다</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-100 via-white to-blue-200">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{destinationName}</h1>

          {destinations.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">여행 일정</h2>
              <div className="grid gap-4">
                {destinations.map((destination, index) => (
                  <div
                    key={destination.id}
                    className={`p-4 rounded-lg border transition-all ${currentDestination?.id === destination.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{index + 1}. {destination.title}</h3>
                        <p className="text-sm text-gray-600">{destination.address}</p>
                      </div>
                      <button
                        onClick={() => setCurrentDestination(destination)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentDestination?.id === destination.id
                            ? 'bg-teal-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        선택
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentDestination && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">현재 선택된 목적지</h3>
              <div className="mb-4">
                <h4 className="font-bold text-gray-800">{currentDestination.title}</h4>
                <p className="text-gray-600">{currentDestination.address}</p>
              </div>

              <button
                onClick={handleLeaveFootprint}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>발자국 남기기</span>
              </button>
            </div>
          )}
        </div>

        {/* 최근 발자국 알림 */}
        {recentFootprint && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-green-600">발자국 인증 완료!</h3>
                <p className="text-gray-600">
                  {recentFootprint.destinationTitle}에 방문한 발자국이 기록되었습니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 채팅 토글 버튼 */}
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        {isChatOpen ? '채팅 닫기' : '가이드와 채팅하기'}
      </button>

      {/* GuideChat 컴포넌트 (조건부 렌더링) */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-5 z-50 shadow-xl rounded-lg overflow-hidden w-96">
          <GuideChat destinationName={destinationName} username={username} onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      {/* 발자국 인증 모달 */}
      {currentDestination && (
        <FootprintAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          destination={currentDestination}
          itineraryId={itineraryDetails?.id || tripId}
          onSuccess={handleFootprintCreated}
        />
      )}

      {/* 플로팅 발자국 버튼 (자동 위치 감지) */}
      {destinations.length > 0 && (
        <FootprintFloatingButton
          destinations={destinations}
          itineraryId={itineraryDetails?.id || tripId}
          onFootprintCreated={handleFootprintCreated}
        />
      )}
    </div>
  );
};

export default TripPage;