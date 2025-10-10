import { useState, useEffect, useCallback } from 'react';

export const useLocationAuth = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // GPS 위치 가져오기
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('이 브라우저는 위치 서비스를 지원하지 않습니다.'));
        return;
      }

      setIsAuthenticating(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setCurrentLocation(location);
          setIsLocationEnabled(true);
          setIsAuthenticating(false);
          resolve(location);
        },
        (error) => {
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '위치 접근 권한이 거부되었습니다.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 요청 시간이 초과되었습니다.';
              break;
            default:
              errorMessage = '알 수 없는 오류가 발생했습니다.';
          }
          setLocationError(errorMessage);
          setIsAuthenticating(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  // 지오펜스 검증 (두 지점 간의 거리 계산)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 지구의 반지름 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위
  }, []);

  // 특정 장소 반경 내에 있는지 확인 (기본값: 100m)
  const isWithinRadius = useCallback((targetLat, targetLon, radius = 100) => {
    if (!currentLocation) return false;
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      targetLat,
      targetLon
    );
    
    return distance <= radius;
  }, [currentLocation, calculateDistance]);

  // 위치 인증 시도
  const attemptLocationAuth = useCallback(async (targetLat, targetLon, radius = 100) => {
    try {
      await getCurrentLocation();
      
      if (isWithinRadius(targetLat, targetLon, radius)) {
        return {
          success: true,
          location: currentLocation,
          distance: calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            targetLat,
            targetLon
          )
        };
      } else {
        return {
          success: false,
          message: '목적지 반경 내에 있지 않습니다.',
          currentLocation,
          requiredRadius: radius
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }, [getCurrentLocation, isWithinRadius, currentLocation, calculateDistance]);

  // 위치 모니터링 시작
  const startLocationMonitoring = useCallback((targetLat, targetLon, radius = 100, onEnterRadius) => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setCurrentLocation(location);
        setIsLocationEnabled(true);

        // 반경 내 진입 감지
        if (isWithinRadius(targetLat, targetLon, radius)) {
          onEnterRadius?.(location);
        }
      },
      (error) => {
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 접근 권한이 거부되었습니다.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 요청 시간이 초과되었습니다.';
            break;
          default:
            errorMessage = '알 수 없는 오류가 발생했습니다.';
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    return watchId;
  }, [isWithinRadius]);

  // 위치 모니터링 중지
  const stopLocationMonitoring = useCallback((watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    // 컴포넌트 마운트 시 위치 권한 확인
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setIsLocationEnabled(result.state === 'granted');
      });
    }
  }, []);

  return {
    currentLocation,
    isLocationEnabled,
    locationError,
    isAuthenticating,
    getCurrentLocation,
    isWithinRadius,
    attemptLocationAuth,
    startLocationMonitoring,
    stopLocationMonitoring,
    calculateDistance
  };
};
