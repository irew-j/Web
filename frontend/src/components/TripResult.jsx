"use client"

import { useEffect, useState, useRef } from "react"
import { FaDirections, FaExpand, FaCompress, FaCalendarAlt } from "react-icons/fa"

export default function TripResult({ tripPlan = [], color = "#0D9488", onCreateCustom, selectedTripIndex = 0 }) {
    const [trips, setTrips] = useState(() => {
        // tripPlan이 2차원 배열인 경우 처리
        if (Array.isArray(tripPlan) && tripPlan.length > 0 && Array.isArray(tripPlan[0])) {
            return tripPlan;
        }
        return [tripPlan].filter(Boolean);
    });

    // Google Map 인스턴스 및 초기화 완료 여부 상태
    const mapContainer = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const markersRef = useRef([]);

    const [activeTrip, setActiveTrip] = useState(selectedTripIndex || 0);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [showFullItinerary, setShowFullItinerary] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(0);

    // 기본 좌표값 설정
    const defaultLat = 35.1587; // 부산 해운대 해수욕장 위도
    const defaultLng = 129.1604; // 부산 해운대 해수욕장 경도

    useEffect(() => {
        if (Array.isArray(tripPlan) && tripPlan.length > 0 && Array.isArray(tripPlan[0])) {
            setTrips(tripPlan);
        } else {
            setTrips([tripPlan].filter(Boolean));
        }
    }, [tripPlan]);

    // 지도 초기화 함수
    useEffect(() => {
        let intervalId;

        function initMap() {
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                console.log("Google Maps API 아직 준비 안됨");
                return false;
            }

            if (trips.length === 0 || !trips[selectedCourse] || trips[selectedCourse].length === 0) return false;
            if (mapInstance) return true;

            try {
                const bounds = new window.google.maps.LatLngBounds();
                const currentCourse = trips[selectedCourse] || [];

                // 데이터 유효성 검사 및 기본값 설정
                if (!currentCourse.length || !currentCourse[0]) {
                    console.error("유효하지 않은 여행 데이터:", currentCourse);
                    return false;
                }

                // 첫 번째 장소의 좌표 설정 (없는 경우 부산 해운대 해수욕장 좌표 사용)
                const firstPlace = currentCourse[0];

                const map = new window.google.maps.Map(mapContainer.current, {
                    center: new window.google.maps.LatLng(
                        firstPlace.mapy || defaultLat,
                        firstPlace.mapx || defaultLng
                    ),
                    zoom: 13,
                    zoomControl: true,
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: true,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        },
                        {
                            featureType: "transit",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                });
                setMapInstance(map);

                markersRef.current.forEach(({ marker }) => marker?.setMap(null));
                markersRef.current = [];

                const markerList = [];

                currentCourse.forEach((place, idx) => {
                    if (!place || !place.title) {
                        console.warn(`장소 ${idx + 1}의 정보가 불완전합니다.`);
                        return;
                    }

                    // 좌표가 없는 경우 기본값 사용
                    const lat = place.mapy || defaultLat;
                    const lng = place.mapx || defaultLng;

                    const marker = new window.google.maps.Marker({
                        position: new window.google.maps.LatLng(lat, lng),
                        map,
                        title: place.title,
                        label: {
                            text: (idx + 1).toString(),
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                        },
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: color,
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "white",
                            scale: 16,
                        },
                        zIndex: 10,
                    });

                    // 대표 장소(첫 번째 장소)의 마커에 인포윈도우 추가
                    if (idx === 0) {
                        const infoWindow = new window.google.maps.InfoWindow({
                            content: `<div class="p-3">
                                <h3 class="font-bold text-teal-700 text-lg">${place.title}</h3>
                                <p class="text-sm text-gray-600 mt-1">${place.address || ''}</p>
                                ${place.reason ? `<p class="text-sm text-gray-500 mt-2">${place.reason}</p>` : ''}
                            </div>`,
                            maxWidth: 300
                        });

                        marker.addListener("click", () => {
                            infoWindow.open(map, marker);
                            map.panTo(new window.google.maps.LatLng(lat, lng));
                            map.setZoom(16);
                        });
                    } else {
                        marker.addListener("click", () => {
                            setActiveTrip(idx);
                            map.panTo(new window.google.maps.LatLng(lat, lng));
                            map.setZoom(16);
                        });
                    }

                    bounds.extend(new window.google.maps.LatLng(lat, lng));
                    markerList.push({ marker, place });
                });

                markersRef.current = markerList;
                map.fitBounds(bounds);

                if (currentCourse.length === 1) {
                    map.setZoom(14);
                }

                setMapInitialized(true);
                return true;
            } catch (error) {
                console.error("지도 초기화 중 오류 발생:", error);
                return false;
            }
        }

        if (!initMap()) {
            intervalId = setInterval(() => {
                if (initMap()) clearInterval(intervalId);
            }, 100);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            markersRef.current.forEach(({ marker }) => marker?.setMap(null));
        };
    }, [trips, selectedCourse]);

    // 장소 이미지 순차 로딩 함수
    useEffect(() => {
        if (!mapInstance || !mapInitialized || !trips[selectedCourse] || trips[selectedCourse].length === 0) return;

        let isMounted = true;
        const MAX_RETRIES = 10; // 재시도 횟수 10으로 증가
        const BASE_DELAY = 2000;
        const MAX_DELAY = 32000;
        const BATCH_SIZE = 1;
        const imageCache = new Map();

        // Google Places API 제한 설정
        const API_LIMITS = {
            QUERIES_PER_SECOND: 5,   // 초당 최대 쿼리 수 감소
            QUERIES_PER_DAY: 100000,
            MIN_DELAY: 2000,          // 최소 요청 간격 2초로 증가
            IMAGE_REQUEST_DELAY: 2000 // 이미지 URL 요청 간격 2초로 증가
        };

        // 요청 제한 관리를 위한 클래스
        class RateLimiter {
            constructor() {
                this.lastRequestTime = 0;
                this.requestCount = 0;
                this.lastResetTime = Date.now();
                this.imageRequestQueue = [];
                this.isProcessingQueue = false;
            }

            async waitForNextRequest() {
                const now = Date.now();

                if (now - this.lastResetTime >= 24 * 60 * 60 * 1000) {
                    this.requestCount = 0;
                    this.lastResetTime = now;
                }

                if (this.requestCount >= API_LIMITS.QUERIES_PER_DAY) {
                    throw new Error("Daily API limit exceeded");
                }

                const timeSinceLastRequest = now - this.lastRequestTime;
                if (timeSinceLastRequest < API_LIMITS.MIN_DELAY) {
                    await new Promise(resolve =>
                        setTimeout(resolve, API_LIMITS.MIN_DELAY - timeSinceLastRequest)
                    );
                }

                this.lastRequestTime = Date.now();
                this.requestCount++;
            }

            // 이미지 URL 요청을 큐에 추가
            async queueImageRequest(requestFn) {
                return new Promise((resolve, reject) => {
                    this.imageRequestQueue.push({ requestFn, resolve, reject });
                    if (!this.isProcessingQueue) {
                        this.processImageQueue();
                    }
                });
            }

            // 이미지 요청 큐 처리
            async processImageQueue() {
                if (this.isProcessingQueue || this.imageRequestQueue.length === 0) return;

                this.isProcessingQueue = true;
                while (this.imageRequestQueue.length > 0) {
                    const { requestFn, resolve, reject } = this.imageRequestQueue.shift();
                    try {
                        await this.waitForNextRequest();
                        const result = await requestFn();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                    await new Promise(resolve => setTimeout(resolve, API_LIMITS.IMAGE_REQUEST_DELAY));
                }
                this.isProcessingQueue = false;
            }
        }

        const rateLimiter = new RateLimiter();

        // 지수 백오프 계산 함수
        const getBackoffDelay = (retryCount) => {
            const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
            return delay + Math.random() * 1000;
        };

        // 이미지 URL 가져오기 함수
        const getImageUrl = async (place, retryCount = 0) => {
            const cacheKey = place.title;
            if (imageCache.has(cacheKey)) {
                return imageCache.get(cacheKey);
            }

            const service = new window.google.maps.places.PlacesService(mapInstance);

            // 1. place_id가 있으면 getDetails로 시도
            if (place.place_id || place.id) {
                const placeId = place.place_id || place.id;
                try {
                    const photoUrl = await new Promise((resolve, reject) => {
                        service.getDetails({
                            placeId,
                            fields: ["photos"]
                        }, (result, status) => {
                            console.log('getDetails result:', { place, placeId, status, result });
                            if (status === window.google.maps.places.PlacesServiceStatus.OK && result && result.photos && result.photos.length > 0) {
                                const url = result.photos[0].getUrl({ maxWidth: 400, maxHeight: 200 });
                                imageCache.set(cacheKey, url);
                                resolve(url);
                            } else {
                                resolve(null); // fallback
                            }
                        });
                    });
                    if (photoUrl) return photoUrl;
                } catch (e) {
                    // fallback
                }
            }

            // 2. place_id가 없거나 getDetails 실패 시 textSearch fallback
            const requestFn = async () => {
                // 장소명 + 주소(시/구 등)로 쿼리 보정 (다양한 조합 시도)
                let queryList = [];
                if (place.title && place.address) {
                    const addressParts = place.address.split(' ');
                    // 예: 장소명, 장소명+시, 장소명+구, 장소명+전체주소
                    queryList.push(place.title);
                    if (addressParts.length > 0) queryList.push(`${place.title}, ${addressParts[0]}`);
                    if (addressParts.length > 1) queryList.push(`${place.title}, ${addressParts[1]}`);
                    queryList.push(`${place.title}, ${place.address}`);
                } else {
                    queryList.push(place.title);
                }
                // 갈맷길 예외처리 유지
                if (place.title.includes("갈맷길")) {
                    queryList = ["민락교, 부산"];
                }
                // 여러 쿼리 조합을 순차적으로 시도
                let lastStatus = null;
                for (let i = 0; i < queryList.length; i++) {
                    const query = queryList[i];
                    const result = await new Promise((resolve, reject) => {
                        const timeoutId = setTimeout(() => {
                            reject(new Error("Request timeout"));
                        }, 30000);
                        service.textSearch({
                            query: query,
                            fields: ["photos", "geometry"],
                        }, (results, status) => {
                            clearTimeout(timeoutId);
                            lastStatus = status;
                            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                                const photoUrl = results[0].photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 200 }) ||
                                    `/placeholder.svg?height=300&width=500&text=${encodeURIComponent(place.title)}`;
                                imageCache.set(cacheKey, photoUrl);
                                resolve(photoUrl);
                            } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                                reject(new Error("OVER_QUERY_LIMIT"));
                            } else {
                                resolve(null); // 다음 쿼리로 넘어감
                            }
                        });
                    });
                    if (result) return result;
                }
                // 모든 쿼리 실패 시 placeholder 반환
                const placeholderUrl = `/placeholder.svg?height=300&width=500&text=${encodeURIComponent(place.title)}`;
                imageCache.set(cacheKey, placeholderUrl);
                return placeholderUrl;
            };

            try {
                const photoUrl = await rateLimiter.queueImageRequest(requestFn);
                return photoUrl;
            } catch (error) {
                if (error.message === "OVER_QUERY_LIMIT" && retryCount < MAX_RETRIES) {
                    const backoffDelay = getBackoffDelay(retryCount);
                    console.log(`Rate limit exceeded. Waiting ${backoffDelay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                    return getImageUrl(place, retryCount + 1);
                }
                if (error.message === "Daily API limit exceeded") {
                    console.error("Daily API limit exceeded. Using placeholder image.");
                }
                const placeholderUrl = `/placeholder.svg?height=300&width=500&text=${encodeURIComponent(place.title)}`;
                imageCache.set(cacheKey, placeholderUrl);
                return placeholderUrl;
            }
        };

        async function loadImagesSequentially() {
            const currentCourse = trips[selectedCourse];
            let globalRetryCount = 0;

            for (let idx = 0; idx < currentCourse.length; idx++) {
                if (!isMounted) break;
                if (!currentCourse[idx].imageUrl || currentCourse[idx].imageUrl === "") {
                    try {
                        const photoUrl = await getImageUrl(currentCourse[idx], globalRetryCount);

                        if (isMounted) {
                            setTrips(prev => {
                                const updated = [...prev];
                                if (!updated[selectedCourse]) {
                                    updated[selectedCourse] = [...currentCourse];
                                }
                                updated[selectedCourse][idx] = {
                                    ...updated[selectedCourse][idx],
                                    imageUrl: photoUrl
                                };
                                return updated;
                            });
                        }

                        globalRetryCount = 0;
                    } catch (error) {
                        console.error(`장소 ${idx + 1}의 이미지 로딩 실패:`, error);
                        globalRetryCount++;
                    }
                }
            }
        }

        loadImagesSequentially().catch(error => {
            if (isMounted) {
                console.error("이미지 로딩 중 오류 발생:", error);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [mapInstance, mapInitialized, trips, selectedCourse]);

    // 지도 크기 토글
    const toggleMapSize = () => {
        setIsMapExpanded((prev) => !prev)
        setTimeout(() => {
            if (mapInstance) {
                window.google.maps.event.trigger(mapInstance, "resize")
            }
        }, 300)
    }

    // 카드 클릭 시 해당 장소로 지도 이동
    const handleCardClick = (index) => {
        if (!trips[selectedCourse] || index >= trips[selectedCourse].length) return;

        setActiveTrip(index);
        if (mapInstance) {
            const place = trips[selectedCourse][index];
            const lat = place.mapy || defaultLat;
            const lng = place.mapx || defaultLng;
            const position = new window.google.maps.LatLng(lat, lng);
            mapInstance.panTo(position);
            mapInstance.setZoom(16);

            // 마커 클릭 이벤트 트리거
            const marker = markersRef.current[index]?.marker;
            if (marker) {
                if (index === 0) {
                    // 대표 장소 마커의 경우 인포윈도우 표시
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `<div class="p-3">
                            <h3 class="font-bold text-teal-700 text-lg">${place.title}</h3>
                            <p class="text-sm text-gray-600 mt-1">${place.address || ''}</p>
                            ${place.reason ? `<p class="text-sm text-gray-500 mt-2">${place.reason}</p>` : ''}
                        </div>`,
                        maxWidth: 300
                    });
                    infoWindow.open(mapInstance, marker);
                }
                // 마커 애니메이션 효과
                marker.setAnimation(window.google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    marker.setAnimation(null);
                }, 1500);
            }
        }
    };

    // 사용자 일정 만들기 버튼 핸들러
    const handleCreateCustom = (course) => {
        if (onCreateCustom && course.length > 0) {
            onCreateCustom(course);
        }
    }

    const toggleItinerary = () => {
        setShowFullItinerary(!showFullItinerary);
    }

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 mt-8 w-full max-w-5xl mx-auto overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-teal-700 flex items-center gap-3">
                    <FaDirections className="text-teal-600 text-2xl" />
                    추천 여행 동선
                </h2>
                <button
                    onClick={toggleMapSize}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-md border border-gray-200"
                >
                    {isMapExpanded ? <FaCompress className="text-gray-600" /> : <FaExpand className="text-gray-600" />}
                    <span className="text-gray-700">{isMapExpanded ? "지도 축소" : "지도 확대"}</span>
                </button>
            </div>

            {/* 코스 선택 탭 */}
            {trips.length > 1 && (
                <div className="flex overflow-x-auto pb-3 mb-6 scrollbar-hide">
                    {trips.map((course, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedCourse(index)}
                            className={`flex-shrink-0 px-6 py-3 mr-3 rounded-full transition-all duration-300 ${selectedCourse === index
                                ? "bg-teal-500 text-white shadow-lg scale-105"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                }`}
                        >
                            코스 {index + 1}
                        </button>
                    ))}
                </div>
            )}

            <div
                className={`w-full rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${isMapExpanded ? "h-[600px]" : "h-[450px]"
                    }`}
                ref={mapContainer}
            ></div>

            {/* 대표 장소 카드 */}
            {trips[selectedCourse] && trips[selectedCourse].length > 0 && (
                <div className="mt-10">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span className="w-3 h-3 bg-teal-500 rounded-full"></span>
                        대표 장소
                    </h3>
                    <div
                        onClick={() => handleCardClick(0)}
                        className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl cursor-pointer border-2 border-teal-500 transition-all duration-300 hover:scale-[1.02] group"
                    >
                        <div className="relative h-64 overflow-hidden">
                            {trips[selectedCourse][0].imageUrl ? (
                                <img
                                    src={trips[selectedCourse][0].imageUrl}
                                    alt={trips[selectedCourse][0].title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                                    이미지를 불러올 수 없습니다
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <p className="text-sm font-medium">클릭하여 지도에서 자세히 보기</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-gray-900">{trips[selectedCourse][0].title}</h3>
                            <p className="mt-3 text-gray-600">{trips[selectedCourse][0].address}</p>
                            {trips[selectedCourse][0].reason && (
                                <p className="mt-3 text-gray-600">{trips[selectedCourse][0].reason}</p>
                            )}
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItinerary();
                                    }}
                                    className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all duration-300"
                                >
                                    {showFullItinerary ? "일정 접기" : "전체 일정 보기"}
                                    <span className="text-xs transition-transform duration-300">{showFullItinerary ? "▲" : "▼"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 전체 일정 */}
            {showFullItinerary && trips[selectedCourse] && trips[selectedCourse].length > 1 && (
                <div className="mt-10">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span className="w-3 h-3 bg-teal-500 rounded-full"></span>
                        전체 일정
                    </h3>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {trips[selectedCourse].slice(1).map((trip, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleCardClick(idx + 1)}
                                className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl cursor-pointer border-2 border-transparent hover:border-teal-200 transition-all duration-300 hover:scale-[1.02] group"
                            >
                                <div className="relative h-48 overflow-hidden">
                                    {trip.imageUrl ? (
                                        <img
                                            src={trip.imageUrl}
                                            alt={trip.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                                            이미지를 불러올 수 없습니다
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <p className="text-sm font-medium">클릭하여 지도에서 자세히 보기</p>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-gray-900">{trip.title}</h3>
                                    <p className="mt-2 text-gray-600">{trip.address}</p>
                                    {trip.reason && <p className="mt-2 text-gray-600">{trip.reason}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-center mt-10">
                <button
                    onClick={() => handleCreateCustom(trips[selectedCourse])}
                    className="flex items-center justify-center gap-3 bg-teal-600 text-white font-semibold px-10 py-4 rounded-full hover:bg-teal-700 hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg"
                >
                    <FaCalendarAlt className="text-xl" />
                    나만의 일정 만들기
                </button>
            </div>
        </div>
    )
}




