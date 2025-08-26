import React, { useEffect, useState, useRef } from 'react';
import { getFootprints, getImageSasUrl } from '../api/footprints';
import { getAllItineraries, getItineraryDetails } from '../api/itinerary';
import { useAuth } from '../context/AuthContext';
import GoogleMapReact from 'google-map-react';

// 이미지 마커 컴포넌트
const ImageMarker = ({ footprint, onClick, isSelected }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!footprint.photoUrl) return;

      // Base64 이미지인 경우 직접 사용
      if (footprint.photoUrl.startsWith('data:image/')) {
        setImageSrc(footprint.photoUrl);
        return;
      }

      try {
        // photoUrl에서 파일명 추출
        const fileName = footprint.photoUrl.split('/').pop();
        if (!fileName || fileName === 'undefined') {
          setImageError(true);
          return;
        }

        // SAS URL 가져오기
        const sasUrlResponse = await getImageSasUrl(fileName);

        // permanentUrl이 있으면 사용, 없으면 sasUrl 사용
        const imageUrl = sasUrlResponse.permanentUrl || sasUrlResponse.sasUrl;
        setImageSrc(imageUrl);
      } catch (error) {
        console.error('이미지 로드 실패:', error);
        setImageError(true);
      }
    };

    loadImage();
  }, [footprint.photoUrl]);

  return (
    <div
      className={`relative cursor-pointer transform transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'
        }`}
      onClick={() => onClick(footprint)}
    >
      {/* 이미지 마커 */}
      <div className="relative">
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={footprint.destinationTitle}
            className="w-12 h-12 rounded-full object-cover border-3 border-white shadow-lg"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-3 border-white shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
        )}
        {/* 선택된 마커 표시 */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* 툴팁 */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-40">
        <div className="font-semibold">{footprint.destinationTitle}</div>
        <div className="text-gray-300">{new Date(footprint.createdAt).toLocaleDateString()}</div>
      </div>
    </div>
  );
};

// 발자국 상세 이미지 컴포넌트
const FootprintDetailImage = ({ photoUrl, destinationTitle }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!photoUrl) return;

      // Base64 이미지인 경우 직접 사용
      if (photoUrl.startsWith('data:image/')) {
        setImageSrc(photoUrl);
        return;
      }

      try {
        // photoUrl에서 파일명 추출
        const fileName = photoUrl.split('/').pop();
        if (!fileName || fileName === 'undefined') {
          setImageError(true);
          return;
        }

        // SAS URL 가져오기
        const sasUrlResponse = await getImageSasUrl(fileName);

        // permanentUrl이 있으면 사용, 없으면 sasUrl 사용
        const imageUrl = sasUrlResponse.permanentUrl || sasUrlResponse.sasUrl;
        setImageSrc(imageUrl);
      } catch (error) {
        console.error('이미지 로드 실패:', error);
        setImageError(true);
      }
    };

    loadImage();
  }, [photoUrl]);

  if (imageError || !imageSrc) {
    return (
      <div className="w-full h-48 bg-gray-200 rounded-lg border border-gray-200 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={`${destinationTitle} 방문 사진`}
      className="w-full h-48 object-cover rounded-lg border border-gray-200"
      onError={() => setImageError(true)}
    />
  );
};

// 경로 마커 컴포넌트
const RouteMarker = ({ itinerary, onClick, isSelected }) => (
  <div
    className={`relative cursor-pointer transform transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'
      }`}
    onClick={() => onClick(itinerary)}
  >
    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-3 border-white">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    </div>

    {/* 툴팁 */}
    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-40">
      <div className="font-semibold">{itinerary.name}</div>
      <div className="text-gray-300">{itinerary.places?.length || 0}개 장소</div>
    </div>
  </div>
);

const MyTravelMapPage = () => {
  const [footprints, setFootprints] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFootprint, setSelectedFootprint] = useState(null);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapsInstance, setMapsInstance] = useState(null);
  const [polyline, setPolyline] = useState(null);
  const [viewMode, setViewMode] = useState('footprints'); // 'footprints' or 'itineraries'
  const { token } = useAuth();

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        setError({ message: '로그인이 필요합니다.' });
        return;
      }

      try {
        const [footprintsData, itinerariesData] = await Promise.all([
          getFootprints(),
          getAllItineraries()
        ]);

        console.log('발자국 데이터:', footprintsData);
        console.log('일정 데이터:', itinerariesData);

        setFootprints(footprintsData);
        setItineraries(itinerariesData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // 지도 중심점 계산
  const getMapCenter = () => {
    const data = viewMode === 'footprints' ? footprints : itineraries;

    if (data.length === 0) {
      return { lat: 37.5665, lng: 126.9780 }; // 서울 기본값
    }

    const validData = data.filter(item => {
      if (viewMode === 'footprints') {
        const lat = Number(item.latitude);
        const lng = Number(item.longitude);
        return !isNaN(lat) && !isNaN(lng);
      } else {
        // 일정의 경우 첫 번째 장소의 좌표 사용
        return item.places && item.places.length > 0 &&
          !isNaN(Number(item.places[0].latitude)) && !isNaN(Number(item.places[0].longitude));
      }
    });

    if (validData.length === 0) {
      return { lat: 37.5665, lng: 126.9780 };
    }

    let totalLat = 0, totalLng = 0, count = 0;

    validData.forEach(item => {
      if (viewMode === 'footprints') {
        totalLat += Number(item.latitude);
        totalLng += Number(item.longitude);
        count++;
      } else {
        item.places.forEach(place => {
          const lat = Number(place.latitude);
          const lng = Number(place.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            totalLat += lat;
            totalLng += lng;
            count++;
          }
        });
      }
    });

    return {
      lat: totalLat / count,
      lng: totalLng / count,
    };
  };

  // 발자국 마커 클릭 핸들러
  const handleFootprintClick = (footprint) => {
    setSelectedFootprint(footprint);
    setSelectedItinerary(null);
  };

  // 일정 마커 클릭 핸들러
  const handleItineraryClick = async (itinerary) => {
    try {
      const details = await getItineraryDetails(itinerary.id);
      setSelectedItinerary(details);
      setSelectedFootprint(null);

      // 경로 그리기
      if (mapsInstance && mapInstance && details.items && details.items.length > 1) {
        // 기존 경로 제거
        if (polyline) {
          polyline.setMap(null);
        }

        const pathCoordinates = details.items
          .filter(item => item.destination.latitude && item.destination.longitude)
          .map(item => ({
            lat: parseFloat(item.destination.latitude),
            lng: parseFloat(item.destination.longitude)
          }));

        if (pathCoordinates.length > 1) {
          const newPolyline = new mapsInstance.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          });
          newPolyline.setMap(mapInstance);
          setPolyline(newPolyline);
        }
      }
    } catch (err) {
      console.error('일정 상세 정보 불러오기 실패:', err);
    }
  };

  // 지도 API 로딩 핸들러
  const handleApiLoaded = ({ map, maps }) => {
    setMapInstance(map);
    setMapsInstance(maps);
    mapRef.current = map;
  };

  // 뷰 모드 변경 핸들러
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedFootprint(null);
    setSelectedItinerary(null);

    // 기존 경로 제거
    if (polyline) {
      polyline.setMap(null);
      setPolyline(null);
    }
  };

  if (loading) {
    return <div className="text-center py-10">지도를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">지도를 불러오는데 실패했습니다: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">나의 여행 지도</h1>

      {footprints.length === 0 && itineraries.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">아직 남긴 발자국이나 일정이 없습니다</h3>
          <p className="text-gray-500 mb-6">여행을 떠나 발자국을 남기고 일정을 만들어보세요!</p>
          <button
            onClick={() => window.location.href = '/custom'}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300"
          >
            여행 계획 세우기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 뷰 모드 선택 */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleViewModeChange('footprints')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${viewMode === 'footprints'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span>발자국 ({footprints.length})</span>
              </div>
            </button>

            <button
              onClick={() => handleViewModeChange('itineraries')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${viewMode === 'itineraries'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 2v3a2 2 0 002 2h4a2 2 0 002-2V2H8zM6 6h12v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6z" />
                </svg>
                <span>여행 일정 ({itineraries.length})</span>
              </div>
            </button>
          </div>

          {/* 지도 영역 */}
          <div className="w-full h-[600px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <GoogleMapReact
              bootstrapURLKeys={{ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY }}
              center={getMapCenter()}
              defaultZoom={10}
              yesIWantToUseGoogleMapApiInternals
              onGoogleApiLoaded={handleApiLoaded}
            >
              {viewMode === 'footprints' ? (
                // 발자국 마커들
                footprints.map((footprint) => {
                  // 좌표를 숫자로 변환
                  const lat = Number(footprint.latitude);
                  const lng = Number(footprint.longitude);

                  if (isNaN(lat) || isNaN(lng)) {
                    console.warn(`발자국 ${footprint.id}의 좌표가 유효하지 않습니다:`, { latitude: footprint.latitude, longitude: footprint.longitude });
                    return null;
                  }

                  return (
                    <ImageMarker
                      key={`footprint-${footprint.id}`}
                      lat={lat}
                      lng={lng}
                      footprint={footprint}
                      onClick={handleFootprintClick}
                      isSelected={selectedFootprint?.id === footprint.id}
                    />
                  );
                })
              ) : (
                // 일정 마커들
                itineraries.map((itinerary) => {
                  if (!itinerary.places || itinerary.places.length === 0) return null;

                  const firstPlace = itinerary.places[0];
                  const lat = Number(firstPlace.latitude);
                  const lng = Number(firstPlace.longitude);

                  if (isNaN(lat) || isNaN(lng)) {
                    console.warn(`일정 ${itinerary.id}의 첫 번째 장소 좌표가 유효하지 않습니다:`, { latitude: firstPlace.latitude, longitude: firstPlace.longitude });
                    return null;
                  }

                  return (
                    <RouteMarker
                      key={`itinerary-${itinerary.id}`}
                      lat={lat}
                      lng={lng}
                      itinerary={itinerary}
                      onClick={handleItineraryClick}
                      isSelected={selectedItinerary?.id === itinerary.id}
                    />
                  );
                })
              )}
            </GoogleMapReact>
          </div>

          {/* 선택된 발자국 상세 정보 */}
          {selectedFootprint && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{selectedFootprint.destinationTitle}</h3>
                <button
                  onClick={() => setSelectedFootprint(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">방문일:</span> {new Date(selectedFootprint.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold">위치:</span> {selectedFootprint.latitude && selectedFootprint.longitude
                      ? `${Number(selectedFootprint.latitude).toFixed(6)}, ${Number(selectedFootprint.longitude).toFixed(6)}`
                      : '위치 정보 없음'
                    }
                  </p>

                  {selectedFootprint.memo && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">메모</h4>
                      <p className="text-gray-700">{selectedFootprint.memo}</p>
                    </div>
                  )}
                </div>

                {selectedFootprint.photoUrl && (
                  <div>
                    <FootprintDetailImage
                      photoUrl={selectedFootprint.photoUrl}
                      destinationTitle={selectedFootprint.destinationTitle}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 선택된 일정 상세 정보 */}
          {selectedItinerary && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{selectedItinerary.name}</h3>
                <button
                  onClick={() => setSelectedItinerary(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">생성일:</span> {new Date(selectedItinerary.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">장소 수:</span> {selectedItinerary.items?.length || 0}개
                </p>
              </div>

              {selectedItinerary.items && selectedItinerary.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">여행 경로</h4>
                  <div className="space-y-2">
                    {selectedItinerary.items.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-800">{item.destination.title}</h5>
                          <p className="text-sm text-gray-600">{item.destination.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 통계 요약 */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">여행 통계</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{footprints.length}</div>
                <div className="text-sm text-gray-600">총 발자국</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{itineraries.length}</div>
                <div className="text-sm text-gray-600">총 일정</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(footprints.map(fp => fp.destinationTitle?.split(',')[0]?.trim())).size}
                </div>
                <div className="text-sm text-gray-600">방문한 도시</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTravelMapPage;