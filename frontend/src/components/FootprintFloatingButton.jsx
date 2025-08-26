import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocationAuth } from '../hooks/useLocationAuth';
import { getFootprints } from '../api/footprints';
import FootprintAuthModal from './FootprintAuthModal';

const FootprintFloatingButton = ({ 
  destinations = [], 
  itineraryId,
  onFootprintCreated 
}) => {
  const [showButton, setShowButton] = useState(false);
  const [currentDestination, setCurrentDestination] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [authenticatedDestinations, setAuthenticatedDestinations] = useState(new Set());
  
  const watchIdRef = useRef(null);
  
  const {
    startLocationMonitoring,
    stopLocationMonitoring,
    isLocationEnabled
  } = useLocationAuth();

  // 인증된 발자국 로드
  const loadAuthenticatedDestinations = useCallback(async () => {
    if (!itineraryId || !destinations.length) return;

    try {
      const footprints = await getFootprints();
      const authenticatedIds = new Set(
        footprints
          .filter(footprint => 
            destinations.some(dest => dest.id === footprint.destinationId)
          )
          .map(footprint => footprint.destinationId)
      );
      setAuthenticatedDestinations(authenticatedIds);
    } catch (error) {
      console.error('인증된 발자국 로드 실패:', error);
    }
  }, [itineraryId, destinations]);

  // 컴포넌트 마운트 시 인증된 발자국 로드
  useEffect(() => {
    loadAuthenticatedDestinations();
  }, [loadAuthenticatedDestinations]);

  // 지오펜스 모니터링 시작
  useEffect(() => {
    if (!isLocationEnabled || destinations.length === 0) return;

    // 각 목적지에 대해 지오펜스 모니터링 설정
    destinations.forEach(destination => {
      // 이미 인증된 목적지는 제외
      if (authenticatedDestinations.has(destination.id)) {
        return;
      }

      if (destination.latitude && destination.longitude) {
        const watchId = startLocationMonitoring(
          destination.latitude,
          destination.longitude,
          100, // 100m 반경
          (location) => {
            // 반경 내 진입 감지
            handleEnterGeofence(destination, location);
          }
        );
        
        if (watchId) {
          watchIdRef.current = watchId;
        }
      }
    });

    return () => {
      if (watchIdRef.current) {
        stopLocationMonitoring(watchIdRef.current);
      }
    };
  }, [isLocationEnabled, destinations, authenticatedDestinations, startLocationMonitoring, stopLocationMonitoring]);

  // 지오펜스 진입 처리
  const handleEnterGeofence = (destination, location) => {
    // 이미 인증된 목적지인지 확인
    if (authenticatedDestinations.has(destination.id)) {
      return;
    }
    
    setCurrentDestination(destination);
    setShowButton(true);
    
    // 알림 표시
    setNotification({
      type: 'success',
      message: `${destination.name}에 도착하셨네요! 발자국을 남겨보세요!`,
      destination
    });

    // 10초 후 자동으로 숨김
    setTimeout(() => {
      setShowButton(false);
      setNotification(null);
    }, 10000);
  };

  // 발자국 인증 모달 열기
  const handleOpenAuthModal = () => {
    setIsModalOpen(true);
    setShowButton(false);
    setNotification(null);
  };

  // 발자국 생성 성공 처리
  const handleFootprintCreated = (footprint) => {
    // 인증된 목적지 목록에 추가
    setAuthenticatedDestinations(prev => new Set([...prev, footprint.destinationId]));
    
    onFootprintCreated?.(footprint);
    
    // 성공 알림
    setNotification({
      type: 'success',
      message: `${currentDestination?.name} 발자국 인증 완료!`,
      isPersistent: true
    });

    // 3초 후 알림 제거
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // 알림 닫기
  const closeNotification = () => {
    setNotification(null);
  };

  if (!isLocationEnabled) {
    return null;
  }

  return (
    <>
      {/* 플로팅 발자국 버튼 */}
      {showButton && currentDestination && (
        <div className="fixed bottom-5 left-5 z-40">
          <button
            onClick={handleOpenAuthModal}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2 animate-bounce"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span className="font-semibold">발자국 남기기</span>
          </button>
        </div>
      )}

      {/* 알림 메시지 */}
      {notification && (
        <div className="fixed top-5 right-5 z-40">
          <div className={`px-4 py-3 rounded-lg shadow-lg max-w-xs ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
              
              {!notification.isPersistent && (
                <button
                  onClick={closeNotification}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 발자국 인증 모달 */}
      <FootprintAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        destination={currentDestination}
        itineraryId={itineraryId}
        onSuccess={handleFootprintCreated}
      />

      {/* 위치 서비스 안내 */}
      {!isLocationEnabled && (
        <div className="fixed bottom-5 right-5 z-40">
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">
                위치 서비스를 활성화하면<br />
                자동으로 발자국 인증을 도와드립니다
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FootprintFloatingButton;
