"use client"

import { useState, useRef, useEffect } from "react"
import {
    FaPlus,
    FaTimes,
    FaSearch,
    FaSave,
    FaTrash,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaUtensils,
    FaCoffee,
    FaDirections,
    FaRoute,
    FaWalking,
    FaCar,
    FaSubway,
    FaList,
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaExternalLinkAlt,
    FaSpinner,
    FaInfoCircle,
    FaArrowUp,
    FaArrowDown,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaRuler,
    FaExclamationTriangle,
    FaCheckCircle,
} from "react-icons/fa"
import { fetchDirections } from '../api/trip';
import { fetchFestivals } from '../api/festivals';
import { verifyTourLocation } from '../api/tour';
import {
    addItemToItinerary,
    removeItemFromItinerary,
    updateItemOrder,
    getAllItineraries,
    createItinerary,
    deleteItinerary as deleteItineraryApi,
    updateItinerary,
    getItineraryDetails // Added for fetching itinerary details
} from "../api/itinerary";
import { useParams } from "react-router-dom";

const CustomItinerary = ({ initialPlaces = [] }) => {
    const { itineraryId } = useParams();
    const [places, setPlaces] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [mapInstance, setMapInstance] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [polylines, setPolylines] = useState([]);
    const [selectedPlaceForNearby, setSelectedPlaceForNearby] = useState(null); // 주변 장소 추천 기준
    const [selectedPlaceForDetail, setSelectedPlaceForDetail] = useState(null); // 상세 정보 패널
    const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
    const [activePlace, setActivePlace] = useState(0);
    const [mapLoading, setMapLoading] = useState(true);
    const [mapError, setMapError] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [originalItineraryName, setOriginalItineraryName] = useState(""); // 원본 일정 이름
    const [originalPlaces, setOriginalPlaces] = useState([]); // 원본 장소 목록
    const mapInitialized = useRef(false);
    const placesRef = useRef([]);
    const isInitialized = useRef(false);

    // Nearby places state
    const [nearbyRestaurants, setNearbyRestaurants] = useState([])
    const [nearbyCafes, setNearbyCafes] = useState([])
    const [nearbyAttractions, setNearbyAttractions] = useState([])
    const [loadingNearby, setLoadingNearby] = useState(false)
    const [activeTab, setActiveTab] = useState("attractions") // "attractions", "restaurants", "cafes"

    // Directions state
    const [showDirections, setShowDirections] = useState(false)
    const [travelMode, setTravelMode] = useState("WALKING") // "WALKING", "DRIVING", "TRANSIT"
    const [directionsRenderer, setDirectionsRenderer] = useState(null)
    const [directionsService, setDirectionsService] = useState(null)
    const [directionsError, setDirectionsError] = useState("")

    // Saved itineraries state
    const [savedItineraries, setSavedItineraries] = useState([])
    const [itineraryName, setItineraryName] = useState("")
    const [showSavedItineraries, setShowSavedItineraries] = useState(true)
    const [editingItineraryId, setEditingItineraryId] = useState(null)
    const [selectedItineraryId, setSelectedItineraryId] = useState(null);

    const mapContainer = useRef(null)
    const searchBoxRef = useRef(null)

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [routeInfo, setRouteInfo] = useState(null);
    const [routePolyline, setRoutePolyline] = useState(null);

    // 축제 정보 상태
    const [festivals, setFestivals] = useState([]);
    const [festivalLoading, setFestivalLoading] = useState(false);
    const [festivalError, setFestivalError] = useState("");
    const [festivalAreaCode, setFestivalAreaCode] = useState("1"); // 기본값: 서울

    // 상태 추가
    const [activeMenuTab, setActiveMenuTab] = useState('itinerary'); // 'itinerary' | 'directions'

    // places 상태가 변경될 때마다 ref 업데이트
    useEffect(() => {
        placesRef.current = places;
    }, [places]);

    // 컴포넌트 마운트 시 저장된 장소 불러오기
    useEffect(() => {
        if (isInitialized.current) return;

        const loadSavedPlaces = () => {
            try {
                setIsLoading(true);
                const savedPlaces = localStorage.getItem('currentPlaces');

                // 저장된 장소가 있고 유효한 경우
                if (savedPlaces) {
                    const parsedPlaces = JSON.parse(savedPlaces);
                    if (Array.isArray(parsedPlaces) && parsedPlaces.length > 0) {
                        setPlaces(parsedPlaces);
                        isInitialized.current = true;
                        setIsLoading(false);
                        setShowSavedItineraries(false); // 저장된 장소가 있으면 일정 만들기 화면으로 전환
                        return;
                    }
                }

                // 저장된 장소가 없고 initialPlaces가 있는 경우
                if (initialPlaces && initialPlaces.length > 0) {
                    const validPlaces = initialPlaces.filter(place =>
                        place &&
                        place.title &&
                        place.mapx &&
                        place.mapy
                    );

                    if (validPlaces.length > 0) {
                        setPlaces(validPlaces);
                        localStorage.setItem('currentPlaces', JSON.stringify(validPlaces));
                        setShowSavedItineraries(false); // 초기 장소가 있으면 일정 만들기 화면으로 전환
                    }
                }

                setIsLoading(false);
            } catch (error) {
                console.error("장소 로딩 중 오류 발생:", error);
                setToastMessage("장소를 불러오는 중 오류가 발생했습니다.");
                setShowToast(true);
                setIsLoading(false);
            }
        };

        loadSavedPlaces();
    }, [initialPlaces]);

    // 토스트 메시지 표시
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    // 장소 상태가 변경될 때마다 로컬 스토리지 업데이트
    useEffect(() => {
        if (places.length > 0) {
            try {
                const validPlaces = places.filter(place =>
                    place &&
                    place.title &&
                    place.mapx &&
                    place.mapy
                );

                if (validPlaces.length > 0) {
                    localStorage.setItem('currentPlaces', JSON.stringify(validPlaces));
                }
            } catch (error) {
                console.error('로컬 스토리지 업데이트 실패:', error);
            }
        }
    }, [places]);

    // 저장된 일정 불러오기
    useEffect(() => {
        const fetchSavedItineraries = async () => {
            try {
                const allItineraries = await getAllItineraries();
                const detailedItineraries = await Promise.all(
                    allItineraries.map(async (itinerary) => {
                        try {
                            const details = await getItineraryDetails(itinerary.id);
                            return {
                                ...itinerary,
                                createdAt: details.createdAt || new Date().toISOString(), // 상세 정보에서 createdAt 가져오기
                                itemCount: details.items ? details.items.length : 0, // 상세 정보에서 itemCount 가져오기
                            };
                        } catch (detailError) {
                            console.error(`일정 ${itinerary.id} 상세 정보 불러오기 실패:`, detailError);
                            return {
                                ...itinerary,
                                createdAt: new Date().toISOString(), // 오류 발생 시 현재 시간으로 대체
                                itemCount: 0, // 오류 발생 시 0으로 대체
                            };
                        }
                    })
                );
                setSavedItineraries(detailedItineraries);
            } catch (error) {
                console.error("저장된 일정 불러오기 실패:", error);
                setToastMessage("저장된 일정을 불러오는 데 실패했습니다.");
                setShowToast(true);
            }
        };

        fetchSavedItineraries();
    }, []); // 빈 배열을 넣어 컴포넌트 마운트 시 한 번만 실행되도록 합니다.

    // 지도 초기화
    useEffect(() => {
        if (mapInitialized.current) return;

        const initMap = () => {
            // 구글 맵 객체가 완전히 로드됐는지 확인
            if (!window.google || !window.google.maps || !window.google.maps.LatLng) {
                setTimeout(initMap, 100);
                return;
            }

            if (!mapContainer.current || mapInstance || !window.google) {
                return;
            }

            try {
                const map = new window.google.maps.Map(mapContainer.current, {
                    center: new window.google.maps.LatLng(37.5665, 126.978),
                    zoom: 12,
                    zoomControl: true,
                    mapTypeControl: true,
                });

                setMapInstance(map);
                mapInitialized.current = true;
                setMapLoading(false);
                setIsMapReady(true);

                // 검색 박스 초기화
                if (searchBoxRef.current) {
                    const searchBox = new window.google.maps.places.SearchBox(searchBoxRef.current);
                    map.addListener("bounds_changed", () => {
                        searchBox.setBounds(map.getBounds());
                    });

                    searchBox.addListener("places_changed", () => {
                        const places = searchBox.getPlaces();
                        if (places.length === 0) return;

                        try {
                            const results = places.map((place) => {
                                if (!place.geometry || !place.geometry.location) {
                                    return null;
                                }

                                return {
                                    id: place.place_id,
                                    title: place.name,
                                    address: place.formatted_address || place.vicinity,
                                    mapx: place.geometry.location.lng(),
                                    mapy: place.geometry.location.lat(),
                                    imageUrl: place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : null,
                                    rating: place.rating || 0,
                                    userRatingsTotal: place.user_ratings_total || 0,
                                };
                            }).filter(Boolean);

                            setSearchResults(results);
                        } catch (error) {
                            console.error("Error processing search results:", error);
                            setSearchResults([]);
                        }
                    });
                }
            } catch (error) {
                console.error("지도 초기화 중 오류 발생:", error);
                setMapLoading(false);
                setMapError(true);
            }
        };

        const loadGoogleMapsScript = () => {
            return new Promise((resolve, reject) => {
                if (window.google && window.google.maps) {
                    resolve();
                    return;
                }

                const script = document.createElement("script");
                // script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`;
                script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
                script.async = true;
                script.defer = true;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        const initializeMap = async () => {
            try {
                await loadGoogleMapsScript();
                initMap();
            } catch (error) {
                console.error("Google Maps 스크립트 로드 실패:", error);
                setMapLoading(false);
                setMapError(true);
            }
        };

        initializeMap();

        return () => {
            if (mapInstance) {
                markers.forEach(marker => marker.setMap(null));
                polylines.forEach(polyline => polyline.setMap(null));
            }
        };
    }, []);

    // initialPlaces 처리
    useEffect(() => {
        if (!initialPlaces || !mapInstance) return;

        try {
            // 이중 배열 처리
            let places = Array.isArray(initialPlaces) ? initialPlaces : [initialPlaces];

            // 중첩된 배열 처리
            while (places.length === 1 && Array.isArray(places[0])) {
                places = places[0];
            }

            // 유효한 장소만 필터링
            const validPlaces = places.filter(place => {
                return place &&
                    typeof place === 'object' &&
                    place.title &&
                    place.mapx &&
                    place.mapy;
            });

            if (validPlaces.length > 0) {
                setPlaces(validPlaces);
                setActivePlace(0);
                setSelectedPlaceForNearby(validPlaces[0]);
                setSelectedPlaceForDetail(validPlaces[0]);

                // 선택된 장소의 상세 정보 가져오기
                if (validPlaces[0].id) {
                    const service = new window.google.maps.places.PlacesService(mapInstance);
                    const request = {
                        placeId: validPlaces[0].id,
                        fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'opening_hours', 'price_level', 'website', 'formatted_phone_number']
                    };

                    service.getDetails(request, (place, status) => {
                        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                            setSelectedPlaceDetails(place);
                        } else {
                            console.error('Place details error:', status, place);
                            setToastMessage('장소 상세 정보를 불러오지 못했습니다. (오류: ' + status + ')');
                            setShowToast(true);
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error processing initial places:", error);
        }
    }, [initialPlaces, mapInstance]);

    // 장소 변경 시 마커 업데이트
    useEffect(() => {
        if (!isMapReady || !mapInstance || places.length === 0) return;

        const updateMarkers = () => {
            try {
                // 기존 마커 제거
                markers.forEach(marker => marker.setMap(null));
                polylines.forEach(polyline => polyline.setMap(null));

                const newMarkers = places.map((place, index) => {
                    if (!place || !place.mapy || !place.mapx) return null;

                    const position = new window.google.maps.LatLng(place.mapy, place.mapx);
                    const marker = new window.google.maps.Marker({
                        position,
                        map: mapInstance,
                        title: place.title,
                        label: {
                            text: (index + 1).toString(),
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                        },
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: "#0D9488",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "white",
                            scale: 16,
                        },
                        zIndex: 10,
                    });

                    marker.addListener("click", () => {
                        setActivePlace(index);
                        setSelectedPlaceForNearby(place);
                        setSelectedPlaceForDetail(place);
                        setSelectedPlaceDetails(null); // 상세 정보 초기화
                        // placeId가 구글 place_id(보통 'Ch'로 시작, 10자 이상)인 경우에만 getDetails 호출
                        if (place.id && typeof place.id === 'string' && place.id.startsWith('Ch') && place.id.length > 10) {
                            const service = new window.google.maps.places.PlacesService(mapInstance);
                            const request = {
                                placeId: place.id,
                                fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'opening_hours', 'price_level', 'website', 'formatted_phone_number']
                            };
                            service.getDetails(request, (placeDetails, status) => {
                                if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                                    setSelectedPlaceDetails(placeDetails);
                                } else {
                                    console.error('Place details error:', status, placeDetails);
                                    setToastMessage('장소 상세 정보를 불러오지 못했습니다. (오류: ' + status + ')');
                                    setShowToast(true);
                                }
                            });
                        }
                    });

                    return marker;
                }).filter(Boolean);

                setMarkers(newMarkers);

                // 장소 간 연결선 추가
                if (places.length > 1) {
                    const newPolylines = [];
                    for (let i = 0; i < places.length - 1; i++) {
                        const start = new window.google.maps.LatLng(places[i].mapy, places[i].mapx);
                        const end = new window.google.maps.LatLng(places[i + 1].mapy, places[i + 1].mapx);

                        const polyline = new window.google.maps.Polyline({
                            path: [start, end],
                            geodesic: true,
                            strokeColor: "#0D9488",
                            strokeOpacity: 0.7,
                            strokeWeight: 3,
                            map: mapInstance,
                        });

                        newPolylines.push(polyline);
                    }
                    setPolylines(newPolylines);
                }

                // 지도 범위 조정
                const bounds = new window.google.maps.LatLngBounds();
                places.forEach(place => {
                    if (place && place.mapy && place.mapx) {
                        bounds.extend(new window.google.maps.LatLng(place.mapy, place.mapx));
                    }
                });
                mapInstance.fitBounds(bounds);

                if (places.length === 1) {
                    mapInstance.setZoom(14);
                }
            } catch (error) {
                console.error("마커 업데이트 중 오류 발생:", error);
            }
        };

        updateMarkers();
    }, [isMapReady, mapInstance, places]);

    // 검색 결과 처리
    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchBoxRef.current || !mapInstance) return;

        // 엔터로 검색 시, 결과가 있으면 첫 번째 결과를 추가
        if (searchResults && searchResults.length > 0) {
            addPlace(searchResults[0]);
            setSearchResults([]); // 결과창 닫기
            setSearchQuery(""); // 입력창 초기화(선택)
            return;
        }

        let isMounted = true;
        let searchTimeout = null;

        const processSearch = () => {
            try {
                const searchBox = new window.google.maps.places.SearchBox(searchBoxRef.current);

                // 검색 범위 설정
                const bounds = mapInstance.getBounds();
                if (bounds) {
                    searchBox.setBounds(bounds);
                }

                // 검색 이벤트 리스너
                const searchListener = searchBox.addListener("places_changed", () => {
                    if (!isMounted) return;

                    try {
                        const places = searchBox.getPlaces();
                        if (!places || places.length === 0) {
                            setSearchResults([]);
                            return;
                        }

                        const results = places.map((place) => {
                            try {
                                if (!place.geometry || !place.geometry.location) {
                                    return null;
                                }

                                return {
                                    id: place.place_id,
                                    title: place.name,
                                    address: place.formatted_address || place.vicinity,
                                    mapx: place.geometry.location.lng(),
                                    mapy: place.geometry.location.lat(),
                                    imageUrl: place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : null,
                                    rating: place.rating || 0,
                                    userRatingsTotal: place.user_ratings_total || 0
                                };
                            } catch (error) {
                                console.error("Error processing place:", error);
                                return null;
                            }
                        }).filter(Boolean);

                        if (isMounted) {
                            setSearchResults(results);
                        }
                    } catch (error) {
                        console.error("Error processing search results:", error);
                        if (isMounted) {
                            setSearchResults([]);
                        }
                    }
                });

                // 이벤트 리스너 정리
                return () => {
                    if (searchListener) {
                        window.google.maps.event.removeListener(searchListener);
                    }
                };
            } catch (error) {
                console.error("Error setting up search:", error);
                if (isMounted) {
                    setSearchResults([]);
                }
                return () => { };
            }
        };

        // 디바운스 처리
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            const cleanup = processSearch();
            return () => {
                isMounted = false;
                cleanup();
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
            };
        }, 300);

        return () => {
            isMounted = false;
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    };

    // 검색 결과 렌더링
    const renderSearchResults = () => {
        if (!searchResults || searchResults.length === 0) return null;

        return (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
                {searchResults.map((result) => (
                    <div
                        key={result.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
                        onClick={() => addPlace(result)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium text-gray-800">{result.title}</p>
                                <p className="text-sm text-gray-600">{result.address}</p>
                                {result.rating > 0 && (
                                    <div className="flex items-center mt-1">
                                        <div className="flex text-xs">{renderStars(result.rating)}</div>
                                        <span className="text-xs text-gray-600 ml-1">
                                            {result.rating.toFixed(1)} ({result.userRatingsTotal || 0})
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button className="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-1 rounded-full transition-colors">
                                <FaPlus />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // 선택된 장소 변경 시 주변 장소 검색
    useEffect(() => {
        if (!isMapReady || !mapInstance || !selectedPlaceForNearby) return;

        console.log("Selected place changed:", selectedPlaceForNearby);

        let isMounted = true;
        let timeoutId = null;
        let isFetching = false;

        const fetchPlaces = async () => {
            if (isFetching || !selectedPlaceForNearby || !selectedPlaceForNearby.mapx || !selectedPlaceForNearby.mapy) return;

            console.log("Fetching nearby places for:", selectedPlaceForNearby);

            try {
                isFetching = true;
                setLoadingNearby(true);

                // 새로운 PlacesService 인스턴스 생성
                const service = new window.google.maps.places.PlacesService(mapInstance);
                const location = new window.google.maps.LatLng(selectedPlaceForNearby.mapy, selectedPlaceForNearby.mapx);

                // 장소 검색 함수
                const searchPlaces = (keyword) => {
                    return new Promise((resolve) => {
                        const request = {
                            location: location,
                            radius: 1000,
                            keyword: keyword,
                            type: keyword === '관광지' ? 'tourist_attraction' :
                                keyword === '맛집' ? 'restaurant' :
                                    'cafe'
                        };

                        service.nearbySearch(request, (results, status) => {
                            console.log(`Search results for ${keyword}:`, status, results?.length);
                            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                                // 최대 4개의 결과만 반환
                                const limitedResults = results.slice(0, 4);
                                resolve(limitedResults);
                            } else {
                                resolve([]);
                            }
                        });
                    });
                };

                // 각 카테고리별 검색 실행
                const [attractions, restaurants, cafes] = await Promise.all([
                    searchPlaces('관광지'),
                    searchPlaces('맛집'),
                    searchPlaces('카페')
                ]);

                console.log("Search completed:", { attractions, restaurants, cafes });

                if (isMounted) {
                    // 상태 업데이트 전에 로그 추가
                    console.log("Updating state with new places");
                    setNearbyAttractions(attractions);
                    setNearbyRestaurants(restaurants);
                    setNearbyCafes(cafes);
                    console.log("State updated");
                }
            } catch (error) {
                console.error("Error fetching nearby places:", error);
                if (isMounted) {
                    setNearbyAttractions([]);
                    setNearbyRestaurants([]);
                    setNearbyCafes([]);
                }
            } finally {
                if (isMounted) {
                    isFetching = false;
                    setLoadingNearby(false);
                }
            }
        };

        // 디바운스 처리
        const debouncedFetch = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(fetchPlaces, 1000);
        };

        debouncedFetch();

        return () => {
            isMounted = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isMapReady, mapInstance, selectedPlaceForNearby]);

    // 주변 장소 탭 렌더링
    const renderNearbyPlaces = () => {
        console.log("Rendering nearby places:", {
            activeTab,
            attractions: nearbyAttractions,
            restaurants: nearbyRestaurants,
            cafes: nearbyCafes
        });

        if (loadingNearby) {
            return (
                <div className="flex items-center justify-center py-8">
                    <FaSpinner className="animate-spin text-2xl text-teal-500 mr-2" />
                    <span className="text-gray-600">주변 장소를 찾는 중...</span>
                </div>
            );
        }

        const places = activeTab === "attractions" ? nearbyAttractions :
            activeTab === "restaurants" ? nearbyRestaurants :
                nearbyCafes;

        console.log("Current places to render:", places);

        if (!places || places.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>주변에 {activeTab === "attractions" ? "관광지" : activeTab === "restaurants" ? "맛집" : "카페"}가 없습니다.</p>
                </div>
            );
        }

        return (
            <div className="mt-4 space-y-4">
                {places.map((place) => (
                    <div
                        key={place.place_id || place.id}
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                            setSelectedPlaceForDetail({
                                ...place,
                                id: place.place_id || place.id,
                                title: place.name || place.title,
                                address: place.vicinity || place.formatted_address || place.address,
                                mapx: place.geometry?.location?.lng?.() ?? place.mapx,
                                mapy: place.geometry?.location?.lat?.() ?? place.mapy,
                                imageUrl: place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : place.imageUrl,
                                rating: place.rating ?? 0,
                                userRatingsTotal: place.user_ratings_total ?? place.userRatingsTotal ?? 0,
                                opening_hours: place.opening_hours,
                                price_level: place.price_level,
                                website: place.website,
                                formatted_phone_number: place.formatted_phone_number
                            });
                            setSelectedPlaceDetails(null); // 상세 정보 초기화
                        }}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-grow">
                                <h4 className="font-medium text-gray-800">{place.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{place.vicinity || place.formatted_address}</p>
                                {place.rating > 0 && (
                                    <div className="flex items-center mt-2">
                                        <div className="flex text-xs">{renderStars(place.rating)}</div>
                                        <span className="text-xs text-gray-600 ml-1">
                                            {place.rating.toFixed(1)} ({place.user_ratings_total || 0})
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    addPlace({
                                        id: place.place_id,
                                        title: place.name,
                                        address: place.vicinity || place.formatted_address,
                                        mapx: place.geometry?.location?.lng(),
                                        mapy: place.geometry?.location?.lat(),
                                        imageUrl: place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : null,
                                        rating: place.rating,
                                        userRatingsTotal: place.user_ratings_total
                                    });
                                }}
                                className="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-2 rounded-full transition-colors ml-4"
                            >
                                <FaPlus />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // 장소 추가
    const addPlace = async (place) => {
        try {
            if (!place) {
                console.error("Invalid place data");
                setToastMessage("유효하지 않은 장소 데이터입니다.");
                setShowToast(true);
                return;
            }

            // 장소 데이터 구조 확인 및 변환
            let rawId = String(place.place_id ?? place.id ?? `${Date.now()}-${Math.random()}`); // Ensure ID is always a string

            const placeData = {
                id: rawId,
                title: place.name || place.title || '', // Ensure title is not empty
                address: place.vicinity || place.formatted_address || place.address || '', // Ensure address is not empty
                mapx: parseFloat(place.geometry?.location?.lng?.() ?? place.mapx) || 0,
                mapy: parseFloat(place.geometry?.location?.lat?.() ?? place.mapy) || 0,
                imageUrl: (place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : place.imageUrl) || null,
                rating: place.rating || 0,
                userRatingsTotal: place.user_ratings_total || place.userRatingsTotal || 0,
                opening_hours: place.opening_hours || null,
                price_level: place.price_level || null,
                website: place.website || null,
                formatted_phone_number: place.formatted_phone_number || null
            };

            // 필수 데이터 검증
            if (!placeData.title) {
                console.error("장소 이름이 없습니다:", place);
                setToastMessage("장소 정보가 불완전합니다.");
                setShowToast(true);
                return;
            }

            // 위치 정보 검증
            if (!placeData.mapx || !placeData.mapy) {
                console.error("위치 정보가 없습니다:", place);
                setToastMessage("위치 정보가 없는 장소는 추가할 수 없습니다.");
                setShowToast(true);
                return;
            }

            // 중복 체크
            const isDuplicate = places.some(p =>
                (p.mapx === placeData.mapx && p.mapy === placeData.mapy) ||
                (p.id === placeData.id)
            );

            if (isDuplicate) {
                setToastMessage("이미 일정에 추가된 장소입니다.");
                setShowToast(true);
                return;
            }

            if (itineraryId) {
                // API를 통해 일정에 장소 추가
                try {
                    // Modified: Send the full placeData object as destination
                    await addItemToItinerary(itineraryId, { destination: placeData });
                    setToastMessage("장소가 일정에 추가되었습니다!");
                } catch (error) {
                    console.error('API를 통한 장소 추가 실패:', error);
                    setToastMessage("API를 통한 장소 추가에 실패했습니다.");
                    setShowToast(true);
                    return;
                }
            }

            // 상태 업데이트
            setPlaces(prevPlaces => {
                const updatedPlaces = [...prevPlaces, placeData];
                // 로컬 스토리지에 저장
                try {
                    localStorage.setItem('currentPlaces', JSON.stringify(updatedPlaces));
                } catch (error) {
                    console.error('로컬 스토리지 저장 실패:', error);
                }
                return updatedPlaces;
            });

            setSearchResults([]);
            setSearchQuery("");
            setToastMessage("장소가 추가되었습니다!");
            setShowToast(true);
        } catch (error) {
            console.error("장소 추가 중 오류 발생:", error);
            setToastMessage("장소 추가 중 오류가 발생했습니다.");
            setShowToast(true);
        }
    };

    // 주변 장소 추가
    const addNearbyPlace = (place) => {
        try {
            if (!place || !place.geometry || !place.geometry.location) {
                console.error("Invalid place data");
                setToastMessage("유효하지 않은 장소 데이터입니다.");
                setShowToast(true);
                return;
            }

            // 중복 체크
            const isDuplicate = places.some(p =>
                p.mapx === place.geometry.location.lng() &&
                p.mapy === place.geometry.location.lat()
            );

            if (isDuplicate) {
                setToastMessage("이미 일정에 추가된 장소입니다.");
                setShowToast(true);
                return;
            }

            const newPlace = {
                id: place.place_id || Date.now(),
                title: place.name,
                address: place.vicinity || place.formatted_address,
                mapx: place.geometry.location.lng(),
                mapy: place.geometry.location.lat(),
                imageUrl: place.photos && place.photos[0] ? place.photos[0].getUrl({ maxWidth: 400 }) : null,
                rating: place.rating || 0,
                userRatingsTotal: place.user_ratings_total || 0,
                opening_hours: place.opening_hours,
                price_level: place.price_level,
                website: place.website,
                formatted_phone_number: place.formatted_phone_number
            };

            // 상태 업데이트
            setPlaces(prevPlaces => {
                const updatedPlaces = [...prevPlaces, newPlace];
                // 로컬 스토리지에 저장
                try {
                    localStorage.setItem('currentPlaces', JSON.stringify(updatedPlaces));
                } catch (error) {
                    console.error('로컬 스토리지 저장 실패:', error);
                }
                return updatedPlaces;
            });

            setToastMessage("장소가 추가되었습니다!");
            setShowToast(true);
        } catch (error) {
            console.error("장소 추가 중 오류 발생:", error);
            setToastMessage("장소 추가 중 오류가 발생했습니다.");
            setShowToast(true);
        }
    };

    // 현재 위치 가져오기
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
            return;
        }

        setLoadingNearby(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation({ lat: latitude, lng: longitude });
                setLocationError(null);
                console.log("현재 위치 가져오기 성공:", { latitude, longitude });
                setLoadingNearby(false);
            },
            (error) => {
                console.error("위치 정보 가져오기 실패:", error);
                setLocationError("위치 정보를 가져오는데 실패했습니다.");
                setCurrentLocation(null);
                setLoadingNearby(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    // 길찾기 표시
    const showRoute = async () => {
        if (!mapInstance || !selectedPlaceForNearby) return;

        setDirectionsError("");

        // 현재 위치가 없으면 먼저 위치 정보를 가져옴
        if (!currentLocation) {
            setToastMessage("현재 위치를 가져오는 중입니다...");
            setShowToast(true);
            getCurrentLocation();
            return;
        }

        if (travelMode === "TRANSIT") {
            // 기존 대중교통 로직 유지
            try {
                let currentDirectionsService = directionsService;
                if (!currentDirectionsService) {
                    currentDirectionsService = new window.google.maps.DirectionsService();
                    setDirectionsService(currentDirectionsService);
                }

                let currentDirectionsRenderer = directionsRenderer;
                if (!currentDirectionsRenderer) {
                    currentDirectionsRenderer = new window.google.maps.DirectionsRenderer({
                        suppressMarkers: true,
                        polylineOptions: {
                            strokeColor: "#0D9488",
                            strokeOpacity: 0.8,
                            strokeWeight: 5,
                        },
                    });
                    currentDirectionsRenderer.setMap(mapInstance);
                    setDirectionsRenderer(currentDirectionsRenderer);
                }

                const origin = new window.google.maps.LatLng(
                    parseFloat(currentLocation.lat),
                    parseFloat(currentLocation.lng)
                );
                const destination = new window.google.maps.LatLng(
                    parseFloat(selectedPlaceForNearby.mapy),
                    parseFloat(selectedPlaceForNearby.mapx)
                );

                let waypoints = [];
                const currentIndex = places.findIndex(place =>
                    place.mapx === selectedPlaceForNearby.mapx && place.mapy === selectedPlaceForNearby.mapy
                );
                if (currentIndex > 0) {
                    waypoints = places.slice(0, currentIndex).map((place) => ({
                        location: new window.google.maps.LatLng(
                            parseFloat(place.mapy),
                            parseFloat(place.mapx)
                        ),
                        stopover: true,
                    }));
                }

                const request = {
                    origin,
                    destination,
                    waypoints,
                    travelMode: window.google.maps.TravelMode[travelMode],
                    optimizeWaypoints: false,
                    provideRouteAlternatives: true,
                    avoidHighways: false,
                    avoidTolls: false,
                    transitOptions: {
                        modes: ['BUS', 'SUBWAY', 'TRAIN', 'TRAM'],
                        routingPreference: 'LESS_WALKING'
                    }
                };

                currentDirectionsService.route(request, (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        currentDirectionsRenderer.setDirections(result);
                        setShowDirections(true);
                        setDirectionsError("");
                    } else {
                        setDirectionsError("길찾기 서비스를 이용할 수 없습니다. 다시 시도해주세요.");
                        hideRoute();
                    }
                });
            } catch (error) {
                setDirectionsError("길찾기 서비스를 이용할 수 없습니다. 다시 시도해주세요.");
                hideRoute();
            }
            return;
        }

        // 도보/자동차는 백엔드 directions API 사용
        try {
            setDirectionsError("");
            setShowDirections(false);
            const data = await fetchDirections(
                currentLocation.lat,
                currentLocation.lng,
                selectedPlaceForNearby.mapy,
                selectedPlaceForNearby.mapx
            );
            // data: 카카오/티맵 스타일 응답 (vertexes)
            if (data && data.routes && data.routes[0] && data.routes[0].sections && data.routes[0].sections[0]) {
                const roads = data.routes[0].sections[0].roads;
                let path = [];
                roads.forEach(road => {
                    const v = road.vertexes;
                    for (let i = 0; i < v.length; i += 2) {
                        path.push({ lng: v[i], lat: v[i + 1] });
                    }
                });
                if (routePolyline) {
                    routePolyline.setMap(null);
                }
                const polyline = new window.google.maps.Polyline({
                    path: path,
                    geodesic: true,
                    strokeColor: "#0D9488",
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    map: mapInstance,
                });
                setRoutePolyline(polyline);
                // 거리/시간 변환
                const summary = data.routes[0].summary;
                setRouteInfo({
                    distance: (summary.distance / 1000).toFixed(1) + 'km',
                    duration: Math.round(summary.duration / 60) + '분'
                });
                setShowDirections(true);
            } else {
                setDirectionsError("경로 정보를 불러올 수 없습니다.");
            }
        } catch (error) {
            setDirectionsError("길찾기 정보를 불러오지 못했습니다.");
        }
    };

    // 길찾기 결과(거리, 소요시간 등) 표시 UI 개선
    {
        showDirections && routeInfo && (
            <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl shadow flex items-center gap-6 border border-teal-100">
                <div className="flex items-center gap-2 text-lg font-semibold text-teal-700">
                    <FaRoute className="text-teal-500 text-2xl" />
                    경로 안내
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <FaRuler className="text-gray-400" />
                    <span className="font-medium">{routeInfo.distance}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <FaClock className="text-gray-400" />
                    <span className="font-medium">{routeInfo.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 ml-auto">
                    {travelMode === "WALKING" && <FaWalking className="text-teal-400" title="도보" />}
                    {travelMode === "DRIVING" && <FaCar className="text-teal-400" title="자동차" />}
                </div>
            </div>
        )
    }
    {
        directionsError && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-xl flex items-center gap-2">
                <FaExclamationTriangle className="text-red-400 text-xl" />
                <span>{directionsError}</span>
            </div>
        )
    }

    // 길찾기 숨기기
    const hideRoute = () => {
        if (directionsRenderer) {
            directionsRenderer.setDirections({ routes: [] });
        }
        if (routePolyline) {
            routePolyline.setMap(null);
            setRoutePolyline(null);
        }
        setShowDirections(false);
        setRouteInfo(null);
    };

    const removePlace = async (index) => {
        try {
            const placeToRemove = places[index];

            if (itineraryId && placeToRemove) {
                // API를 통해 일정에서 장소 제거
                try {
                    await removeItemFromItinerary(itineraryId, placeToRemove.id);
                } catch (error) {
                    console.error('API를 통한 장소 제거 실패:', error);
                    setToastMessage("API를 통한 장소 제거에 실패했습니다.");
                    setShowToast(true);
                    return;
                }
            }

            setPlaces(prev => {
                const newPlaces = prev.filter((_, i) => i !== index);
                localStorage.setItem('currentPlaces', JSON.stringify(newPlaces));
                return newPlaces;
            });
            setToastMessage("장소가 삭제되었습니다!");
            setShowToast(true);
        } catch (error) {
            console.error("장소 제거 중 오류 발생:", error);
            setToastMessage("장소 제거 중 오류가 발생했습니다.");
            setShowToast(true);
        }
    };

    const movePlace = async (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= places.length) return;

        try {
            const newPlaces = [...places];
            const [movedPlace] = newPlaces.splice(fromIndex, 1);
            newPlaces.splice(toIndex, 0, movedPlace);

            if (itineraryId) {
                // API를 통해 일정 내 장소 순서 변경
                try {
                    await updateItemOrder(itineraryId, {
                        itemId: movedPlace.id,
                        newPosition: toIndex
                    });
                } catch (error) {
                    console.error('API를 통한 장소 순서 변경 실패:', error);
                    setToastMessage("API를 통한 장소 순서 변경에 실패했습니다.");
                    setShowToast(true);
                    return;
                }
            }

            setPlaces(newPlaces);
            localStorage.setItem('currentPlaces', JSON.stringify(newPlaces));
        } catch (error) {
            console.error("장소 이동 중 오류 발생:", error);
            setToastMessage("장소 이동 중 오류가 발생했습니다.");
            setShowToast(true);
        }
    };

    const saveItinerary = async () => {
        try {
            let itineraryResponse;
            const itineraryData = {
                name: itineraryName,
            };

            // Use selectedItineraryId to determine if it's an update or a new save
            if (selectedItineraryId) {
                // Update existing itinerary name
                itineraryResponse = await updateItinerary(selectedItineraryId, itineraryData);
                setToastMessage("일정이 성공적으로 수정되었습니다!");
                setSavedItineraries(prev => prev.map(it => it.id === itineraryResponse.id ? itineraryResponse : it));
            } else {
                // Create new itinerary
                itineraryResponse = await createItinerary({
                    ...itineraryData,
                    createdAt: new Date().toISOString(),
                });
                setToastMessage("일정이 성공적으로 저장되었습니다!");
                setSavedItineraries(prev => [...prev, itineraryResponse]);
            }

            const currentItineraryId = selectedItineraryId || itineraryResponse.id;

            // Fetch existing items for the itinerary to compare and manage updates
            const existingItineraryDetails = await getItineraryDetails(currentItineraryId);
            const existingItems = existingItineraryDetails.items || []; // Ensure 'items' is used here

            // Items to add
            const itemsToAdd = places.filter(place =>
                !existingItems.some(existingItem => existingItem.destination.id === place.id)
            );

            // Items to remove
            const itemsToRemove = existingItems.filter(existingItem =>
                !places.some(place => place.id === existingItem.destination.id)
            );

            // Remove old items
            for (const item of itemsToRemove) {
                await removeItemFromItinerary(item.id); // Use item.id for removal
            }

            // Add new items
            for (const place of itemsToAdd) {
                await addItemToItinerary(currentItineraryId, {
                    // Removed 'destination' wrapper, sending place data directly
                    id: place.id,
                    title: place.title,
                    mapx: place.mapx,
                    mapy: place.mapy,
                    address: place.address,
                    imageUrl: place.imageUrl || null,
                    rating: place.rating || 0,
                    userRatingsTotal: place.userRatingsTotal || 0,
                    opening_hours: place.opening_hours || null,
                    price_level: place.price_level || null,
                    website: place.website || null,
                    formatted_phone_number: place.formatted_phone_number || null,
                    description: place.description || null, // 추가
                    reason: place.reason || null, // 추가
                    areaCode: place.areaCode || null, // 추가
                    contentTypeId: place.contentTypeId || null, // 추가
                    festivalPeriod: place.festivalPeriod || null // 추가
                });
            }

            setShowToast(true);

        } catch (error) {
            console.error("일정 저장 실패:", error);
            setToastMessage("일정 저장에 실패했습니다.");
            setShowToast(true);
        }
    };

    const loadItinerary = async (itinerary) => {
        try {
            const itineraryId = itinerary.id; // Extract itineraryId from the passed object
            // API를 통해 최신 일정 상세 정보를 가져옵니다.
            const fetchedItinerary = await getItineraryDetails(itineraryId);
            console.log("Fetched Itinerary:", fetchedItinerary);

            // 가져온 일정 데이터에서 장소 정보를 사용합니다. fetchedItinerary.items가 undefined일 경우 빈 배열을 사용
            if (fetchedItinerary && fetchedItinerary.items) {
                const loadedPlaces = fetchedItinerary.items.map(item => ({
                    id: item.destination.id,
                    title: item.destination.title,
                    mapx: item.destination.mapx,
                    mapy: item.destination.mapy,
                    address: item.destination.address,
                    imageUrl: item.destination.imageUrl || null,
                    rating: item.destination.rating || 0,
                    userRatingsTotal: item.destination.userRatingsTotal || 0,
                    opening_hours: item.destination.opening_hours || null,
                    price_level: item.destination.price_level || null,
                    website: item.destination.website || null,
                    formatted_phone_number: item.destination.formatted_phone_number || null,
                }));
                setPlaces(loadedPlaces);
                setItineraryName(fetchedItinerary.name);
                setSelectedItineraryId(fetchedItinerary.id);
                setEditingItineraryId(fetchedItinerary.id); // Set editingItineraryId here
                setToastMessage(`일정 '${fetchedItinerary.name}'을(를) 불러왔습니다.`);
                setShowToast(true);
            } else {
                setToastMessage("유효하지 않은 일정 데이터입니다.");
                setShowToast(true);
                setPlaces([]);
                setItineraryName('');
                setSelectedItineraryId(null);
                setEditingItineraryId(null); // Clear editingItineraryId if data is invalid
            }
        } catch (error) {
            console.error("일정 불러오기 실패:", error);
            setToastMessage("일정을 불러오는 데 실패했습니다.");
            setShowToast(true);
            setPlaces([]);
            setItineraryName('');
            setSelectedItineraryId(null);
            setEditingItineraryId(null); // Clear editingItineraryId on error
        }
    };

    const deleteItinerary = async (id) => {
        const confirmed = window.confirm("정말로 이 일정을 삭제하시겠습니까?");
        if (!confirmed) return;

        try {
            await deleteItineraryApi(id);
            setSavedItineraries(prevItineraries => prevItineraries.filter((item) => item.id !== id));
            alert("일정이 성공적으로 삭제되었습니다.");
        } catch (error) {
            console.error("일정 삭제 중 오류 발생:", error);
            alert("일정 삭제 중 오류가 발생했습니다.");
        }
    };

    // 별점 렌더링 함수
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<FaStar key={i} className="text-yellow-400" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
            } else {
                stars.push(<FaRegStar key={i} className="text-yellow-400" />);
            }
        }
        return stars;
    };

    // 가격 수준 렌더링
    const renderPriceLevel = (priceLevel) => {
        if (priceLevel === undefined || priceLevel === null) return null;

        const priceLevels = {
            0: "무료",
            1: "저렴함 ₩",
            2: "보통 ₩₩",
            3: "비쌈 ₩₩₩",
            4: "매우 비쌈 ₩₩₩₩",
        };

        return priceLevels[priceLevel] || null;
    };

    // 저장된 일정 목록 렌더링
    const renderSavedItineraries = () => {
        if (savedItineraries.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500">
                    <p>저장된 일정이 없습니다.</p>
                    <button
                        onClick={() => {
                            setShowSavedItineraries(false);
                            setEditingItineraryId(null);
                            setItineraryName("");
                            setPlaces([]);
                        }}
                        className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                        새 일정 만들기
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {savedItineraries.map((itinerary) => (
                    <div
                        key={itinerary.id}
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 hover:border-teal-200"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800">{itinerary.name}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        loadItinerary(itinerary);
                                        setShowSavedItineraries(false);
                                    }}
                                    className="text-xs px-2 py-1 bg-teal-100 text-teal-600 rounded hover:bg-teal-200"
                                >
                                    불러오기
                                </button>
                                <button
                                    onClick={() => deleteItinerary(itinerary.id)}
                                    className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            {new Date(itinerary.createdAt).toLocaleDateString()} 생성 • {itinerary.places?.length || 0}개 장소
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {itinerary.places && itinerary.places.slice(0, 3).map((place, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {place.title}
                                </span>
                            ))}
                            {itinerary.places && itinerary.places.length > 3 && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">+{itinerary.places.length - 3}개 더</span>
                            )}
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => {
                        setShowSavedItineraries(false);
                        setEditingItineraryId(null);
                        setItineraryName("");
                        setPlaces([]);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                >
                    새 일정 만들기
                </button>
            </div>
        );
    };

    // 일정 저장 폼 제출 핸들러
    const handleSaveItinerary = (e) => {
        e.preventDefault();
        saveItinerary();
    };

    // 구글 맵으로 길찾기 열기 함수 복구
    const openGoogleMapsDirections = () => {
        if (!selectedPlaceForNearby || !currentLocation) return;
        const origin = `${currentLocation.lat},${currentLocation.lng}`;
        const destination = `${selectedPlaceForNearby.mapy},${selectedPlaceForNearby.mapx}`;
        const mode = travelMode.toLowerCase();
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
        window.open(url, "_blank");
    };

    // 축제 정보 불러오기
    useEffect(() => {
        const loadFestivals = async () => {
            setFestivalLoading(true);
            setFestivalError("");
            try {
                const data = await fetchFestivals(festivalAreaCode);
                setFestivals(data);
            } catch (e) {
                setFestivalError("축제 정보를 불러오지 못했습니다.");
                setFestivals([]);
            } finally {
                setFestivalLoading(false);
            }
        };
        loadFestivals();
    }, [festivalAreaCode]);

    // 축제 리스트 렌더링 함수
    const renderFestivals = () => {
        if (festivalLoading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <FaSpinner className="animate-spin text-2xl text-teal-500 mr-2" />
                    <span className="text-gray-600">축제 정보를 불러오는 중...</span>
                </div>
            );
        }
        if (festivalError) {
            return <div className="text-center py-8 text-red-500">{festivalError}</div>;
        }
        if (!festivals || festivals.length === 0) {
            return <div className="text-center py-8 text-gray-500">해당 지역의 축제 정보가 없습니다.</div>;
        }
        return (
            <div className="mt-4 space-y-4">
                {festivals.map((festival, idx) => (
                    <div
                        key={festival.id || idx}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                            const detail = {
                                ...festival,
                                id: festival.id || `${festival.title || festival.name}-${festival.eventstartdate}`,
                                title: festival.title || festival.name,
                                address: festival.address || festival.addr1,
                                imageUrl: festival.imageUrl || null,
                                mapx: festival.mapx || (festival.longitude || null),
                                mapy: festival.mapy || (festival.latitude || null),
                            };
                            setSelectedPlaceForNearby(detail);
                            setSelectedPlaceForDetail(detail);
                        }}
                    >
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="font-bold text-teal-700 text-base truncate">{festival.title || festival.name}</span>
                            <span className="text-sm text-gray-600 truncate">{festival.address || festival.addr1}</span>
                            {festival.eventstartdate && festival.eventenddate && (
                                <span className="text-xs text-gray-500">{festival.eventstartdate} ~ {festival.eventenddate}</span>
                            )}
                            {festival.tel && <span className="text-xs text-gray-500">{festival.tel}</span>}
                        </div>
                        <button
                            className="ml-4 p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-800 rounded-full transition-colors"
                            onClick={e => {
                                e.stopPropagation();
                                addPlace({
                                    id: festival.id || `${festival.title || festival.name}-${festival.eventstartdate}`,
                                    title: festival.title || festival.name,
                                    address: festival.address || festival.addr1,
                                    mapx: festival.mapx || (festival.longitude || null),
                                    mapy: festival.mapy || (festival.latitude || null),
                                    imageUrl: festival.imageUrl || null,
                                    rating: festival.rating || 0,
                                    userRatingsTotal: festival.userRatingsTotal || 0,
                                });
                            }}
                            title="일정에 추가"
                        >
                            <FaPlus />
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    // 시/도명 → areaCode 매핑 테이블
    const areaNameToCode = {
        '서울': '1',
        '인천': '2',
        '대전': '3',
        '대구': '4',
        '광주': '5',
        '부산': '6',
        '울산': '7',
        '세종': '8',
        '경기': '31',
        '강원': '32',
        '충북': '33',
        '충남': '34',
        '경북': '35',
        '경남': '36',
        '전북': '37',
        '전남': '38',
        '제주': '39',
    };

    // 일정 장소가 바뀔 때마다 첫 장소의 address에서 시/도명을 추출해 festivalAreaCode를 자동 변경
    useEffect(() => {
        if (!places || places.length === 0) return;
        const address = places[0].address || '';
        // address에서 시/도명 추출 (예: '서울특별시', '경기도', '부산광역시' 등)
        const area = Object.keys(areaNameToCode).find(key => address.includes(key));
        if (area && areaNameToCode[area] !== festivalAreaCode) {
            setFestivalAreaCode(areaNameToCode[area]);
        }
    }, [places]);

    // 카카오맵 길찾기 열기 함수 추가
    const openKakaoDirections = () => {
        if (!selectedPlaceForNearby || !currentLocation) return;
        setActiveMenuTab('directions'); // 탭 전환
    };

    // 일정관리 UI를 함수로 분리
    const renderItineraryMenu = () => (
        <>
            {/* 검색 폼 */}
            <form onSubmit={handleSearch} className="relative mb-4">
                <div className="flex">
                    <div className="relative flex-grow">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchBoxRef}
                            type="text"
                            placeholder="장소 검색 (예: 경복궁, 명동, 카페...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 p-3 w-full border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm text-base"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 rounded-r-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-300 shadow-sm flex items-center justify-center text-base"
                    >
                        검색
                    </button>
                </div>
                {renderSearchResults()}
            </form>
            {places.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <FaMapMarkerAlt className="mx-auto text-3xl mb-3 text-gray-400" />
                    <p className="text-lg">장소를 검색하여 일정에 추가해보세요.</p>
                </div>
            ) : (
                <>
                    {/* 내 일정(places) 리스트에만 인증 버튼/뱃지 적용 */}
                    <ul className="space-y-3">
                        {places.map((place, index) => (
                            <li
                                key={place.id}
                                className={
                                    `relative bg-white p-4 pt-7 pr-7 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border border-gray-100${activePlace === index ? " border-2 border-teal-500" : ""}`
                                }
                                onClick={() => {
                                    setActivePlace(index);
                                    setSelectedPlaceForNearby(place);
                                    setSelectedPlaceForDetail(place);
                                    setSelectedPlaceDetails(null); // 상세 정보 초기화
                                }}
                            >
                                {/* X 삭제 버튼 - 카드 오른쪽 상단 모서리 바깥쪽 */}
                                <button
                                    className="absolute -right-3 -top-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-gray-400 border border-gray-200 shadow-lg transition-all duration-200 z-30"
                                    title="장소 삭제"
                                    onClick={e => {
                                        e.stopPropagation();
                                        removePlace(index);
                                    }}
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                                <div className="flex flex-col min-w-0 w-full">
                                    <span className="font-bold text-teal-700 text-base truncate">{place.title}</span>
                                    <span className="block text-sm text-gray-600 truncate">{place.address}</span>
                                    {/* 위치 인증 버튼/뱃지: 카드 하단 오른쪽에 깔끔하게 */}
                                    <div className="mt-3 flex justify-end w-full">
                                        {verifyStatus[place.id] === 'success' ? (
                                            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow animate-fade-in">
                                                <FaCheckCircle className="w-5 h-5" /> 인증 완료
                                            </span>
                                        ) : verifyStatus[place.id] === 'pending' ? (
                                            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold shadow animate-pulse">
                                                <FaSpinner className="animate-spin w-5 h-5" /> 인증 중...
                                            </span>
                                        ) : verifyStatus[place.id] === 'fail' ? (
                                            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow animate-shake">
                                                <FaExclamationTriangle className="w-5 h-5" /> 실패
                                                <button
                                                    className="ml-2 underline text-xs text-white hover:text-yellow-200"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleVerifyLocation(place);
                                                    }}
                                                >재시도</button>
                                            </span>
                                        ) : (
                                            <button
                                                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md flex items-center gap-2 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleVerifyLocation(place);
                                                }}
                                            >
                                                <FaMapMarkerAlt className="w-4 h-4" /> 위치 인증
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {/* 일정 저장 폼 등 기존 코드 유지 */}
                    <div className="mt-4 border-t pt-4">
                        <form onSubmit={handleSaveItinerary} className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="일정 이름"
                                value={itineraryName}
                                onChange={(e) => setItineraryName(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm text-sm"
                            />
                            <button
                                type="submit"
                                disabled={places.length === 0 || !itineraryName.trim()}
                                className={`w-full ${places.length === 0 || !itineraryName.trim()
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                                    } text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md text-sm`}
                            >
                                <FaSave /> {editingItineraryId ? "일정 수정하기" : "일정 저장하기"}
                            </button>
                        </form>
                    </div>

                    {/* 길찾기 컨트롤 */}
                    {selectedPlaceForNearby && (
                        <div className="mt-6 border-t pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <FaRoute className="text-teal-600" />
                                    길찾기
                                </h4>
                                <button
                                    onClick={getCurrentLocation}
                                    className="text-sm px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-sm"
                                >
                                    <FaMapMarkerAlt /> 현재 위치
                                </button>
                            </div>

                            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl mb-4">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <button
                                        onClick={() => setTravelMode("WALKING")}
                                        className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${travelMode === "WALKING"
                                            ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md"
                                            : "bg-white text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        <FaWalking /> 도보
                                    </button>
                                    <button
                                        onClick={() => setTravelMode("DRIVING")}
                                        className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${travelMode === "DRIVING"
                                            ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md"
                                            : "bg-white text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        <FaCar /> 자동차
                                    </button>
                                    <button
                                        onClick={() => setTravelMode("TRANSIT")}
                                        className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${travelMode === "TRANSIT"
                                            ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md"
                                            : "bg-white text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        <FaSubway /> 대중교통
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={showDirections ? hideRoute : showRoute}
                                        disabled={!selectedPlaceForNearby || mapLoading || mapError}
                                        className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${!selectedPlaceForNearby || mapLoading || mapError
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : showDirections
                                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                : "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md"
                                            }`}
                                    >
                                        <FaDirections /> {showDirections ? "길찾기 숨기기" : "길찾기 보기"}
                                    </button>
                                    {travelMode === "TRANSIT" ? (
                                        <button
                                            onClick={openKakaoDirections}
                                            disabled={!selectedPlaceForNearby || mapLoading || mapError}
                                            className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${!selectedPlaceForNearby || mapLoading || mapError
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md"
                                                }`}
                                        >
                                            <span className="w-4 h-4 flex items-center justify-center">
                                                <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                                                    <rect width="40" height="40" rx="8" fill="#FEE500" />
                                                    <path d="M20 10C14.477 10 10 13.582 10 18.09c0 2.77 2.09 5.19 5.25 6.62-.22.77-.8 2.8-.92 3.25 0 0-.02.17.09.24.11.07.25.02.25.02.33-.05 3.81-2.51 4.41-2.92.64.06 1.3.09 1.92.09 5.523 0 10-3.582 10-8.09C30 13.582 25.523 10 20 10z" fill="#391B1B" />
                                                </svg>
                                            </span>
                                            카카오맵으로 보기
                                        </button>
                                    ) : (
                                        <button
                                            onClick={openKakaoDirections}
                                            disabled={!selectedPlaceForNearby || mapLoading || mapError}
                                            className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${!selectedPlaceForNearby || mapLoading || mapError
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-md"
                                                }`}
                                        >
                                            <span className="w-4 h-4 flex items-center justify-center">
                                                <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                                                    <rect width="40" height="40" rx="8" fill="#FEE500" />
                                                    <path d="M20 10C14.477 10 10 13.582 10 18.09c0 2.77 2.09 5.19 5.25 6.62-.22.77-.8 2.8-.92 3.25 0 0-.02.17.09.24.11.07.25.02.25.02.33-.05 3.81-2.51 4.41-2.92.64.06 1.3.09 1.92.09 5.523 0 10-3.582 10-8.09C30 13.582 25.523 10 20 10z" fill="#391B1B" />
                                                </svg>
                                            </span>
                                            카카오맵으로 보기
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 주변 추천 장소 탭 */}
                    {selectedPlaceForNearby && (
                        <div className="mt-6 border-t pt-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">주변 추천 장소</h4>
                            <div className="border-b border-gray-200">
                                <nav className="flex -mb-px">
                                    <button
                                        onClick={() => setActiveTab("attractions")}
                                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === "attractions"
                                            ? "border-b-2 border-teal-500 text-teal-600"
                                            : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <FaMapMarkerAlt className="inline-block mr-2" /> 관광지
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("restaurants")}
                                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === "restaurants"
                                            ? "border-b-2 border-teal-500 text-teal-600"
                                            : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <FaUtensils className="inline-block mr-2" /> 맛집
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("cafes")}
                                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === "cafes"
                                            ? "border-b-2 border-teal-500 text-teal-600"
                                            : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <FaCoffee className="inline-block mr-2" /> 카페
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("festivals")}
                                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeTab === "festivals"
                                            ? "border-b-2 border-pink-500 text-pink-600"
                                            : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <FaStar className="inline-block mr-2 text-pink-400" /> 축제
                                    </button>
                                </nav>
                            </div>
                            <div className="mt-4">
                                {activeTab === "attractions" && renderNearbyPlaces()}
                                {activeTab === "restaurants" && renderNearbyPlaces()}
                                {activeTab === "cafes" && renderNearbyPlaces()}
                                {activeTab === "festivals" && (
                                    <div>
                                        <div className="mb-4 flex gap-2 items-center">
                                            <label htmlFor="festival-area-select" className="text-sm text-gray-700 font-medium">지역 선택:</label>
                                            <select
                                                id="festival-area-select"
                                                value={festivalAreaCode}
                                                onChange={e => setFestivalAreaCode(e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                                            >
                                                <option value="1">서울</option>
                                                <option value="2">인천</option>
                                                <option value="3">대전</option>
                                                <option value="4">대구</option>
                                                <option value="5">광주</option>
                                                <option value="6">부산</option>
                                                <option value="7">울산</option>
                                                <option value="8">세종</option>
                                                <option value="31">경기도</option>
                                                <option value="32">강원도</option>
                                                <option value="33">충청북도</option>
                                                <option value="34">충청남도</option>
                                                <option value="35">경상북도</option>
                                                <option value="36">경상남도</option>
                                                <option value="37">전라북도</option>
                                                <option value="38">전라남도</option>
                                                <option value="39">제주도</option>
                                            </select>
                                        </div>
                                        {renderFestivals()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );

    // 인증 상태 관리 (장소별)
    const [verifyStatus, setVerifyStatus] = useState({});

    // 위치 인증 함수
    const handleVerifyLocation = (place) => {
        if (!navigator.geolocation) {
            setToastMessage('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
            setShowToast(true);
            return;
        }
        setVerifyStatus(prev => ({ ...prev, [place.id]: 'pending' }));
        setToastMessage('위치 정보를 확인 중입니다...');
        setShowToast(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                const result = await verifyTourLocation({
                    destinationId: place.id,
                    lat,
                    lon,
                });
                if (result.success) {
                    setVerifyStatus(prev => ({ ...prev, [place.id]: 'success' }));
                    setToastMessage('위치 인증이 완료되었습니다!');
                } else {
                    setVerifyStatus(prev => ({ ...prev, [place.id]: 'fail' }));
                    setToastMessage(result.message || '위치 인증에 실패했습니다.');
                }
            } catch (err) {
                setVerifyStatus(prev => ({ ...prev, [place.id]: 'fail' }));
                setToastMessage('위치 인증 중 오류가 발생했습니다.');
            }
            setShowToast(true);
        }, (err) => {
            setVerifyStatus(prev => ({ ...prev, [place.id]: 'fail' }));
            setToastMessage('위치 정보를 가져올 수 없습니다. 위치 권한을 허용해 주세요.');
            setShowToast(true);
        });
    };

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden">
            {/* 로딩 상태 표시 */}
            {isLoading && (
                <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
                        <p className="mt-4 text-gray-600">일정을 불러오는 중...</p>
                    </div>
                </div>
            )}

            {/* 토스트 메시지 */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-teal-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-fade-in-up z-50">
                    {toastMessage}
                </div>
            )}

            {/* 전체 화면 지도 */}
            <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0"></div>

            {/* 상단 헤더 */}
            <div className="fixed top-4 left-4 right-4 z-20">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white/95 rounded-2xl shadow-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-teal-700 flex items-center gap-2">
                                <FaCalendarAlt className="text-teal-600" />
                                나만의 여행 일정 만들기
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* 메뉴 토글 버튼 (항상 왼쪽에 고정) */}
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`fixed top-1/2 -translate-y-1/2 z-30
                    px-4 py-2 rounded-r-lg transition-all duration-300 ease-in-out
                    flex items-center justify-center gap-0 shadow-lg border border-gray-200
                    ${isMenuOpen
                        ? 'left-[404px] bg-white/90 text-gray-700 hover:bg-gray-100' // 메뉴가 열려있을 때
                        : 'left-4 bg-teal-500 text-white hover:bg-teal-600' // 메뉴가 닫혀있을 때
                    }`
                }
            >
                {isMenuOpen ? (
                    <>
                        <FaChevronLeft />
                    </>
                ) : (
                    <>
                        <FaChevronRight />
                    </>
                )}
            </button>

            {/* 왼쪽 메뉴 패널 */}
            <div
                className={`fixed top-[90px] left-0 h-[calc(100vh-7rem)] w-[400px] z-20 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)]'}`}
            >
                <div className="bg-white/95 backdrop-blur-md h-full w-[400px] shadow-xl rounded-r-2xl overflow-hidden flex flex-col border border-gray-100">
                    {/* 메뉴 헤더 */}
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">일정 관리</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowSavedItineraries(!showSavedItineraries);
                                        if (!showSavedItineraries) {
                                            setEditingItineraryId(null);
                                            setItineraryName("");
                                            setPlaces([]);
                                        }
                                    }}
                                    className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all duration-300 ${showSavedItineraries
                                        ? "bg-teal-500 text-white hover:bg-teal-600 shadow-sm"
                                        : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
                                        }`}
                                >
                                    <FaList size={14} />
                                    <span>{showSavedItineraries ? "새 일정 만들기" : "저장된 일정 보기"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 메뉴 컨텐츠 */}
                    <div className={`flex-1 overflow-y-auto ${activeMenuTab === 'directions' ? 'relative p-0' : 'p-4'} bg-gradient-to-b from-white to-gray-50`}>
                        {/* 탭 헤더 */}
                        <div className="flex mb-4 border-b border-gray-200 z-10 relative bg-white">
                            <button
                                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeMenuTab === 'itinerary' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveMenuTab('itinerary')}
                            >
                                일정
                            </button>
                            <button
                                className={`ml-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeMenuTab === 'directions' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveMenuTab('directions')}
                            >
                                길찾기
                            </button>
                        </div>
                        {/* 탭 컨텐츠 */}
                        {activeMenuTab === 'itinerary' ? (
                            showSavedItineraries ? renderSavedItineraries() : renderItineraryMenu()
                        ) : (
                            <div className="w-full" style={{ height: 'calc(100% - 48px)' }}>
                                <iframe
                                    title="카카오맵 길찾기"
                                    src={`https://map.kakao.com/?sName=${encodeURIComponent(currentLocation ? '내 위치' : '')}&eName=${encodeURIComponent(selectedPlaceForNearby ? selectedPlaceForNearby.title : '')}`}
                                    className="w-full h-full rounded-xl border border-gray-200 shadow"
                                    style={{ minHeight: 0, minWidth: 0, borderRadius: '1rem' }}
                                    allowFullScreen
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 선택된 장소 상세 정보는 메뉴가 닫혀있을 때만 표시 */}
            {selectedPlaceForDetail && (
                <div className="fixed top-[90px] right-4 w-96 z-50">
                    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-xl">{selectedPlaceForDetail.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{selectedPlaceForDetail.address}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedPlaceForDetail(null)}
                                    className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-sm"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {/* 상세 정보: 구글 장소 or 축제 등 커스텀 */}
                        {selectedPlaceDetails && selectedPlaceForDetail.id && typeof selectedPlaceForDetail.id === 'string' && selectedPlaceForDetail.id.startsWith('Ch') && selectedPlaceForDetail.id.length > 10 ? (
                            // 구글 상세 정보 UI
                            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">{/* ... */}</div>
                        ) : (
                            // 축제 등 placeId 없는 경우: 커스텀 상세 정보 카드
                            <div className="bg-gradient-to-br from-pink-50 to-teal-50 p-6 rounded-xl shadow-md border border-gray-200 flex flex-col gap-4 items-center">
                                {/* 이미지 */}
                                {selectedPlaceForDetail.imageUrl ? (
                                    <img
                                        src={selectedPlaceForDetail.imageUrl}
                                        alt={selectedPlaceForDetail.title}
                                        className="w-full max-h-60 object-contain rounded-xl border border-gray-100 shadow-sm bg-white"
                                    />
                                ) : (
                                    <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-pink-100 to-teal-100 rounded-xl">
                                        <FaStar className="text-pink-300 text-6xl" />
                                    </div>
                                )}
                                {/* 날짜 */}
                                {(selectedPlaceForDetail.eventstartdate || selectedPlaceForDetail.eventenddate) && (
                                    <div className="flex items-center gap-2 text-base text-gray-700">
                                        <FaCalendarAlt className="text-teal-500" />
                                        <span>
                                            {selectedPlaceForDetail.eventstartdate || ''}
                                            {selectedPlaceForDetail.eventenddate ? ` ~ ${selectedPlaceForDetail.eventenddate}` : ''}
                                        </span>
                                    </div>
                                )}
                                {/* 주소 */}
                                {selectedPlaceForDetail.address && (
                                    <div className="flex items-center gap-2 text-base text-gray-700">
                                        <FaMapMarkerAlt className="text-teal-500" />
                                        <span>{selectedPlaceForDetail.address}</span>
                                    </div>
                                )}
                                {/* 전화번호 */}
                                {selectedPlaceForDetail.tel && (
                                    <div className="flex items-center gap-2 text-base text-gray-700">
                                        <FaInfoCircle className="text-teal-500" />
                                        <span>{selectedPlaceForDetail.tel}</span>
                                    </div>
                                )}
                                {/* 외부 링크 (있으면) */}
                                {selectedPlaceForDetail.website && (
                                    <a
                                        href={selectedPlaceForDetail.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-base text-blue-700 hover:underline mt-2"
                                    >
                                        <FaExternalLinkAlt className="text-blue-500" />
                                        공식 홈페이지
                                    </a>
                                )}
                                {/* 상세 설명 */}
                                {selectedPlaceForDetail.description && (
                                    <div className="w-full mt-4 p-4 bg-white/80 rounded-xl text-gray-800 text-sm whitespace-pre-line border border-gray-100 shadow-inner">
                                        {selectedPlaceForDetail.description}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomItinerary;
