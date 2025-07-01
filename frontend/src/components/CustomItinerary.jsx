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
} from "react-icons/fa"
import { fetchDirections } from '../api/trip';

const CustomItinerary = ({ initialPlaces = [] }) => {
    const [places, setPlaces] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [mapInstance, setMapInstance] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [polylines, setPolylines] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
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

    const mapContainer = useRef(null)
    const searchBoxRef = useRef(null)

    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    // 로컬 스토리지에서 저장된 일정 불러오기
    useEffect(() => {
        try {
            const savedData = localStorage.getItem("savedItineraries");
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (Array.isArray(parsed)) {
                    setSavedItineraries(parsed);
                }
            }
        } catch (error) {
            console.error("저장된 일정을 불러오는 중 오류 발생:", error);
            setSavedItineraries([]);
        }
    }, []);

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
                                    imageUrl: place.photos?.[0]?.getUrl() || null,
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
                setSelectedPlace(validPlaces[0]);

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
                            console.log("장소 상세 정보를 가져오는데 실패했습니다.");
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
                        console.log("Marker clicked:", place);
                        setActivePlace(index);
                        setSelectedPlace(place);
                        // 선택된 장소의 상세 정보 가져오기
                        if (place.id) {
                            const service = new window.google.maps.places.PlacesService(mapInstance);
                            const request = {
                                placeId: place.id,
                                fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'opening_hours', 'price_level', 'website', 'formatted_phone_number']
                            };

                            service.getDetails(request, (placeDetails, status) => {
                                if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                                    console.log("Place details loaded:", placeDetails);
                                    setSelectedPlaceDetails(placeDetails);
                                } else {
                                    console.log("Failed to load place details");
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
                                    imageUrl: place.photos?.[0]?.getUrl() || null,
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
        if (!isMapReady || !mapInstance || !selectedPlace) return;

        console.log("Selected place changed:", selectedPlace);

        let isMounted = true;
        let timeoutId = null;
        let isFetching = false;

        const fetchPlaces = async () => {
            if (isFetching || !selectedPlace || !selectedPlace.mapx || !selectedPlace.mapy) return;

            console.log("Fetching nearby places for:", selectedPlace);

            try {
                isFetching = true;
                setLoadingNearby(true);

                // 새로운 PlacesService 인스턴스 생성
                const service = new window.google.maps.places.PlacesService(mapInstance);
                const location = new window.google.maps.LatLng(selectedPlace.mapy, selectedPlace.mapx);

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
    }, [isMapReady, mapInstance, selectedPlace]);

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
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
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
                                onClick={() => {
                                    console.log("Adding place:", place);
                                    addPlace({
                                        id: place.place_id,
                                        title: place.name,
                                        address: place.vicinity || place.formatted_address,
                                        mapx: place.geometry?.location?.lng(),
                                        mapy: place.geometry?.location?.lat(),
                                        imageUrl: place.photos?.[0]?.getUrl(),
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
    const addPlace = (place) => {
        try {
            if (!place) {
                console.error("Invalid place data");
                setToastMessage("유효하지 않은 장소 데이터입니다.");
                setShowToast(true);
                return;
            }

            // 장소 데이터 구조 확인 및 변환
            const placeData = {
                id: place.place_id || place.id || Date.now(),
                title: place.name || place.title,
                address: place.vicinity || place.formatted_address || place.address,
                mapx: place.geometry?.location?.lng() || place.mapx,
                mapy: place.geometry?.location?.lat() || place.mapy,
                imageUrl: place.photos?.[0]?.getUrl() || place.imageUrl,
                rating: place.rating || 0,
                userRatingsTotal: place.user_ratings_total || place.userRatingsTotal || 0,
                opening_hours: place.opening_hours,
                price_level: place.price_level,
                website: place.website,
                formatted_phone_number: place.formatted_phone_number
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
                imageUrl: place.photos && place.photos[0] ? place.photos[0].getUrl() : null,
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
        if (!mapInstance || !selectedPlace) return;

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
                    parseFloat(selectedPlace.mapy),
                    parseFloat(selectedPlace.mapx)
                );

                let waypoints = [];
                const currentIndex = places.findIndex(place =>
                    place.mapx === selectedPlace.mapx && place.mapy === selectedPlace.mapy
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
                selectedPlace.mapy,
                selectedPlace.mapx
            );
            // data: 카카오 원본 JSON 문자열
            let kakao;
            try {
                kakao = typeof data === "string" ? JSON.parse(data) : data;
            } catch (e) {
                setDirectionsError("카카오 길찾기 응답 파싱 오류");
                return;
            }
            // 경로(폴리라인), 거리, 소요시간 추출
            const route = kakao.routes?.[0];
            if (!route) {
                setDirectionsError("경로 정보를 찾을 수 없습니다.");
                return;
            }
            const section = route.sections?.[0];
            const summary = route.summary;
            const polyline = section?.roads?.[0]?.polyline;
            const distance = summary?.distance; // (미터)
            const duration = summary?.duration; // (초)
            // 거리/시간 보기 좋게 변환
            const distanceStr = distance ? (distance / 1000).toFixed(1) + "km" : "-";
            const durationStr = duration ? Math.round(duration / 60) + "분" : "-";
            // 지도에 polyline 표시
            if (polyline) {
                if (routePolyline) {
                    routePolyline.setMap(null);
                }
                // 카카오 polyline은 좌표 배열(경도,위도) |로 구분 → 구글 polyline으로 변환
                const decodedPath = polyline.split("|").map(pair => {
                    const [lng, lat] = pair.split(",").map(Number);
                    return new window.google.maps.LatLng(lat, lng);
                });
                const polylineObj = new window.google.maps.Polyline({
                    path: decodedPath,
                    geodesic: true,
                    strokeColor: "#0D9488",
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                    map: mapInstance,
                });
                setRoutePolyline(polylineObj);
                setRouteInfo({ distance: distanceStr, duration: durationStr });
                setShowDirections(true);
            } else {
                setDirectionsError("경로 선 정보를 찾을 수 없습니다.");
            }
        } catch (error) {
            setDirectionsError("길찾기 정보를 불러오지 못했습니다.");
        }
    };

    // 길찾기 결과(거리, 소요시간 등) 표시 UI 추가
    {
        showDirections && routeInfo && (
            <div className="mt-2 p-3 bg-white rounded-lg shadow text-gray-700 flex flex-col gap-1 border border-teal-100">
                <div><b>예상 거리:</b> {routeInfo.distance}</div>
                <div><b>예상 소요시간:</b> {routeInfo.duration}</div>
            </div>
        )
    }

    // 길찾기 숨기기
    const hideRoute = () => {
        if (directionsRenderer) {
            directionsRenderer.setDirections({ routes: [] });
            setShowDirections(false);
        }
    };

    const removePlace = (index) => {
        setPlaces(prev => {
            const newPlaces = prev.filter((_, i) => i !== index);
            localStorage.setItem('currentPlaces', JSON.stringify(newPlaces));
            return newPlaces;
        });
        setToastMessage("장소가 삭제되었습니다!");
        setShowToast(true);
    };

    const movePlace = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= places.length) return;

        const newPlaces = [...places];
        const [movedPlace] = newPlaces.splice(fromIndex, 1);
        newPlaces.splice(toIndex, 0, movedPlace);

        setPlaces(newPlaces);
    };

    const saveItinerary = () => {
        if (places.length === 0) {
            alert("저장할 일정이 없습니다.");
            return;
        }

        if (!itineraryName.trim()) {
            alert("일정 이름을 입력해주세요.");
            return;
        }

        try {
            // 장소 데이터 검증
            const validPlaces = places.map(place => {
                if (!place || !place.title || !place.mapx || !place.mapy) {
                    throw new Error("유효하지 않은 장소 데이터가 있습니다.");
                }
                return {
                    id: place.id || Date.now(),
                    title: place.title,
                    address: place.address,
                    mapx: place.mapx,
                    mapy: place.mapy,
                    imageUrl: place.imageUrl,
                    rating: place.rating || 0,
                    userRatingsTotal: place.user_ratings_total || 0
                };
            });

            let updatedItineraries;

            if (editingItineraryId) {
                // 기존 일정 수정
                updatedItineraries = savedItineraries.map(item =>
                    item.id === editingItineraryId
                        ? {
                            ...item,
                            name: itineraryName.trim(),
                            places: validPlaces,
                            updatedAt: new Date().toISOString()
                        }
                        : item
                );
            } else {
                // 새 일정 생성
                const newItinerary = {
                    id: Date.now(),
                    name: itineraryName.trim(),
                    places: validPlaces,
                    createdAt: new Date().toISOString(),
                };
                updatedItineraries = [...savedItineraries, newItinerary];
            }

            // 로컬 스토리지에 저장
            localStorage.setItem("savedItineraries", JSON.stringify(updatedItineraries));
            setSavedItineraries(updatedItineraries);
            alert(editingItineraryId ? "여행 일정이 수정되었습니다!" : "여행 일정이 저장되었습니다!");
            setItineraryName("");
            setEditingItineraryId(null);
            setShowSavedItineraries(true);
        } catch (error) {
            console.error("일정 저장 중 오류 발생:", error);
            alert(error.message || "일정 저장 중 오류가 발생했습니다.");
        }
    };

    const loadItinerary = (itinerary) => {
        if (!itinerary || !Array.isArray(itinerary.places)) {
            alert("유효하지 않은 일정 데이터입니다.");
            return;
        }

        try {
            // 장소 데이터 검증
            const validPlaces = itinerary.places.filter(place =>
                place &&
                place.title &&
                place.mapx &&
                place.mapy
            );

            if (validPlaces.length === 0) {
                alert("유효한 장소가 없습니다.");
                return;
            }

            setPlaces(validPlaces);
            setItineraryName(itinerary.name);
            setEditingItineraryId(itinerary.id);
            setShowSavedItineraries(false);
        } catch (error) {
            console.error("일정 불러오기 실패:", error);
            alert("일정을 불러오는데 실패했습니다.");
        }
    };

    const deleteItinerary = (id) => {
        const confirmed = window.confirm("정말로 이 일정을 삭제하시겠습니까?");
        if (!confirmed) return;

        try {
            const updatedItineraries = savedItineraries.filter((item) => item.id !== id);
            localStorage.setItem("savedItineraries", JSON.stringify(updatedItineraries));
            setSavedItineraries(updatedItineraries);
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
                            {new Date(itinerary.createdAt).toLocaleDateString()} 생성 • {itinerary.places.length}개 장소
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {itinerary.places.slice(0, 3).map((place, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {place.title}
                                </span>
                            ))}
                            {itinerary.places.length > 3 && (
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
        if (!selectedPlace || !currentLocation) return;
        const origin = `${currentLocation.lat},${currentLocation.lng}`;
        const destination = `${selectedPlace.mapy},${selectedPlace.mapx}`;
        const mode = travelMode.toLowerCase();
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
        window.open(url, "_blank");
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
                    <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-gray-50">
                        {showSavedItineraries ? (
                            renderSavedItineraries()
                        ) : (
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
                                        <ul className="space-y-3">
                                            {places.map((place, index) => (
                                                <li
                                                    key={`${place.id || index}-${index}`}
                                                    className={`bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 relative group cursor-pointer ${activePlace === index ? "border-2 border-teal-500" : "border border-gray-100"
                                                        }`}
                                                    onClick={() => {
                                                        setActivePlace(index);
                                                        setSelectedPlace(place);
                                                        if (place.id) {
                                                            const service = new window.google.maps.places.PlacesService(mapInstance);
                                                            const request = {
                                                                placeId: place.id,
                                                                fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'opening_hours', 'price_level', 'website', 'formatted_phone_number']
                                                            };

                                                            service.getDetails(request, (placeDetails, status) => {
                                                                if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                                                                    setSelectedPlaceDetails(placeDetails);
                                                                }
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="font-bold bg-gradient-to-r from-teal-500 to-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <h4 className="font-medium text-gray-800 text-base truncate">{place.title}</h4>
                                                            <p className="text-xs text-gray-600 mt-0.5 truncate">{place.address}</p>
                                                            <div className="flex gap-1.5 mt-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        movePlace(index, index - 1);
                                                                    }}
                                                                    disabled={index === 0}
                                                                    className={`text-xs px-2 py-1 rounded-full ${index === 0
                                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                        } transition-colors`}
                                                                >
                                                                    <FaArrowUp size={10} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        movePlace(index, index + 1);
                                                                    }}
                                                                    disabled={index === places.length - 1}
                                                                    className={`text-xs px-2 py-1 rounded-full ${index === places.length - 1
                                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                        } transition-colors`}
                                                                >
                                                                    <FaArrowDown size={10} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removePlace(index);
                                                                    }}
                                                                    className="ml-auto text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                                                >
                                                                    <FaTrash className="inline-block text-xs" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* 일정 저장 폼 */}
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
                                        {selectedPlace && (
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
                                                            disabled={!selectedPlace || mapLoading || mapError}
                                                            className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${!selectedPlace || mapLoading || mapError
                                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                                : showDirections
                                                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                                    : "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md"
                                                                }`}
                                                        >
                                                            <FaDirections /> {showDirections ? "길찾기 숨기기" : "길찾기 보기"}
                                                        </button>
                                                        <button
                                                            onClick={openGoogleMapsDirections}
                                                            disabled={!selectedPlace || mapLoading || mapError}
                                                            className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${!selectedPlace || mapLoading || mapError
                                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md"
                                                                }`}
                                                        >
                                                            <FaExternalLinkAlt /> 구글 맵으로 보기
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 주변 추천 장소 탭 */}
                                        {selectedPlace && (
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
                                                    </nav>
                                                </div>
                                                <div className="mt-4">
                                                    {renderNearbyPlaces()}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 선택된 장소 상세 정보는 메뉴가 닫혀있을 때만 표시 */}
            {selectedPlace && !isMenuOpen && (
                <div className="fixed top-[90px] right-4 w-96 z-20">
                    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-xl">{selectedPlace.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{selectedPlace.address}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedPlace(null)}
                                    className="text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-sm"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {/* 선택된 장소 상세 정보 */}
                        {selectedPlaceDetails && (
                            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                                <div className="relative">
                                    {selectedPlaceDetails.photos && selectedPlaceDetails.photos[0] ? (
                                        <div className="h-72 overflow-hidden">
                                            <img
                                                src={selectedPlaceDetails.photos[0].getUrl() || "/placeholder.svg"}
                                                alt={selectedPlaceDetails.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src =
                                                        "/placeholder.svg?height=300&width=1000&text=" +
                                                        encodeURIComponent(selectedPlaceDetails.name);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                                            <span className="text-7xl">{selectedPlaceDetails.types?.includes("cafe") ? "☕" : "🍽️"}</span>
                                        </div>
                                    )}

                                    {selectedPlaceDetails.rating && selectedPlaceDetails.rating >= 4.5 && (
                                        <div className="absolute top-4 left-4 bg-yellow-400 text-white px-4 py-2 rounded-full font-bold flex items-center shadow-lg">
                                            <FaStar className="mr-2" /> 인기 장소
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                                                {selectedPlaceDetails.name}
                                                <span className="ml-2 text-2xl">
                                                    {selectedPlaceDetails.types?.includes("cafe") ? "☕" : "🍽️"}
                                                </span>
                                            </h3>
                                            <p className="text-gray-600 mt-2">{selectedPlaceDetails.formatted_address}</p>
                                        </div>
                                        {selectedPlaceDetails.rating && (
                                            <div className="bg-teal-50 px-4 py-3 rounded-xl">
                                                <div className="flex items-center justify-center">
                                                    {renderStars(selectedPlaceDetails.rating)}
                                                </div>
                                                <p className="text-center text-sm text-gray-600 mt-2">
                                                    {selectedPlaceDetails.user_ratings_total}명 평가
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {renderPriceLevel(selectedPlaceDetails.price_level) && (
                                            <div className="bg-gray-100 px-4 py-2 rounded-full text-sm">
                                                {renderPriceLevel(selectedPlaceDetails.price_level)}
                                            </div>
                                        )}
                                        {selectedPlaceDetails.opening_hours?.isOpen && (
                                            <div
                                                className={`px-4 py-2 rounded-full text-sm ${selectedPlaceDetails.opening_hours.isOpen()
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {selectedPlaceDetails.opening_hours.isOpen() ? "영업 중" : "영업 종료"}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {selectedPlaceDetails.formatted_phone_number && (
                                            <a
                                                href={`tel:${selectedPlaceDetails.formatted_phone_number}`}
                                                className="flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 py-3 px-4 rounded-xl transition-colors shadow-sm"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                    />
                                                </svg>
                                                전화하기
                                            </a>
                                        )}
                                        {selectedPlaceDetails.website && (
                                            <a
                                                href={selectedPlaceDetails.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-xl transition-colors shadow-sm"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                    />
                                                </svg>
                                                웹사이트 방문
                                            </a>
                                        )}
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                                selectedPlaceDetails.name
                                            )}&destination_place_id=${selectedPlaceDetails.place_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 px-4 rounded-xl transition-colors shadow-sm"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                                />
                                            </svg>
                                            길찾기
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomItinerary;
