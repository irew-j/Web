"use client"

import { useState, useEffect } from "react";
import { FaDice, FaSearch, FaWalking, FaCar, FaSubway } from "react-icons/fa";
import SearchBar from "../components/SearchBar";
import TripList from "../components/TripList";
import { fetchItinerary } from "../api/trip";
import ErrorBoundary from "../components/ErrorBoundary";
import { useNavigate } from "react-router-dom";
import TripResult from "../components/TripResult";

const HomePage = () => {
    const [query, setQuery] = useState("");
    const [tripData, setTripData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedTripIndex, setSelectedTripIndex] = useState(0);
    const [travelMode, setTravelMode] = useState("WALKING");
    const navigate = useNavigate();

    const handleSearch = async () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setErrorMessage("여행지와 키워드를 입력해주세요.");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        setTripData([]);
        setShowResults(false);
        setSearchResults([]);

        try {
            const data = await fetchItinerary(trimmedQuery, travelMode);
            console.log("API 응답 데이터:", data);

            let processedData = data;
            while (Array.isArray(processedData) && processedData.length === 1 && Array.isArray(processedData[0])) {
                processedData = processedData[0];
            }

            if (processedData && Array.isArray(processedData) && processedData.length > 0) {
                setTripData(processedData);
                setSearchResults(processedData);
                setShowResults(true);
            } else {
                setErrorMessage("검색된 여행지가 없습니다. 다른 키워드로 시도해보세요.");
            }
        } catch (error) {
            console.error("API 호출 에러:", error);
            setErrorMessage(
                error.response?.data?.message ||
                "데이터 로딩에 실패했습니다. 다시 시도해 주세요."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRecommendNew = async () => {
        if (!query.trim()) {
            setErrorMessage("여행지와 키워드를 입력해주세요.");
            return;
        }

        setLoading(true);
        setErrorMessage("");
        setTripData([]);
        setShowResults(false);
        setSearchResults([]);

        try {
            const data = await fetchItinerary(query.trim(), travelMode);
            console.log("새로운 추천 API 응답:", data);

            let processedData = data;
            while (Array.isArray(processedData) && processedData.length === 1 && Array.isArray(processedData[0])) {
                processedData = processedData[0];
            }

            if (processedData && Array.isArray(processedData) && processedData.length > 0) {
                setTripData(processedData);
                setSearchResults(processedData);
                setShowResults(true);
            } else {
                setErrorMessage("검색된 여행지가 없습니다. 다른 키워드로 시도해보세요.");
            }
        } catch (error) {
            console.error("새로운 추천 API 호출 에러:", error);
            setErrorMessage(
                error.response?.data?.message ||
                "데이터 로딩에 실패했습니다. 다시 시도해 주세요."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomItinerary = (trips) => {
        if (!trips) return;

        const tripsArray = Array.isArray(trips) ? trips : [trips];
        if (tripsArray.length === 0) return;

        try {
            localStorage.setItem('currentPlaces', JSON.stringify(tripsArray));
        } catch (error) {
            console.error('로컬 스토리지 저장 실패:', error);
        }
        navigate("/custom");
    };

    const handleBackToSearch = () => {
        setShowResults(false);
        setSearchResults([]);
        setSelectedTripIndex(0);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight drop-shadow-lg">
                    TripLovers
                </h1>
                <p className="text-xl text-gray-600 font-medium mb-2">당신만의 특별한 여행을 찾아보세요</p>
                <p className="text-base text-gray-400">키워드와 지역을 입력하면 맞춤 여행 코스를 추천해드려요!</p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setTravelMode("WALKING")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all duration-200 ${travelMode === "WALKING" ? "bg-teal-500 text-white border-teal-600 shadow-md" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                >
                    <FaWalking /> 도보
                </button>
                <button
                    onClick={() => setTravelMode("DRIVING")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all duration-200 ${travelMode === "DRIVING" ? "bg-teal-500 text-white border-teal-600 shadow-md" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                >
                    <FaCar /> 자동차
                </button>
                <button
                    onClick={() => setTravelMode("TRANSIT")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all duration-200 ${travelMode === "TRANSIT" ? "bg-teal-500 text-white border-teal-600 shadow-md" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                >
                    <FaSubway /> 대중교통
                </button>
            </div>

            <SearchBar
                query={query}
                setQuery={setQuery}
                onSearch={handleSearch}
                className="mb-10"
            />

            {loading && (
                <div className="flex flex-col items-center justify-center my-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">여행지를 찾고 있습니다...</p>
                </div>
            )}

            {!loading && errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 my-8 rounded-xl shadow-sm">
                    <p className="text-center text-red-600 text-lg font-semibold">{errorMessage}</p>
                </div>
            )}

            {!loading && tripData.length > 0 && !showResults && (
                <ErrorBoundary>
                    <TripList
                        trips={tripData}
                        onRecommendNew={handleRecommendNew}
                        onCreateCustom={handleCreateCustomItinerary}
                    />
                </ErrorBoundary>
            )}

            {showResults && (
                <TripResult
                    tripPlan={searchResults.filter(result =>
                        Array.isArray(result) &&
                        result.length > 0 &&
                        result.every(trip => trip && trip.mapy && trip.mapx)
                    )}
                    onCreateCustom={handleCreateCustomItinerary}
                    selectedTripIndex={selectedTripIndex}
                    onBack={handleBackToSearch}
                />
            )}
        </div>
    );
};

export default HomePage; 