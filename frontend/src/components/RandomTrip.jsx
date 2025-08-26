"use client"

import { useState, useEffect, useRef } from "react"
import { fetchRandomTrip } from "../api/trip"
import {
    FaDice,
    FaSpinner,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaGlobeAsia,
    FaPlane,
    FaRedo,
    FaPlus,
} from "react-icons/fa"

const RandomTrip = ({ onCreateCustom }) => {
    const [isSpinning, setIsSpinning] = useState(false)
    const [randomTrip, setRandomTrip] = useState(null)
    const [error, setError] = useState("")
    const [showCapsule, setShowCapsule] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [animationComplete, setAnimationComplete] = useState(true)
    const [selectedPlace, setSelectedPlace] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const renderStars = (rating) => {
        const stars = []
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 >= 0.5

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) stars.push(<FaStar key={i} className="text-yellow-400" />)
            else if (i === fullStars && hasHalfStar)
                stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />)
            else stars.push(<FaRegStar key={i} className="text-yellow-400" />)
        }
        return stars
    }

    const spinGacha = async () => {
        if (!animationComplete) return;

        setIsSpinning(true);
        setAnimationComplete(false);
        setError("");
        setShowCapsule(false);
        setShowResult(false);
        setIsLoading(true);

        try {
            const data = await fetchRandomTrip();
            if (!data || data.length === 0) {
                throw new Error("랜덤 여행지를 가져오는데 실패했습니다.");
            }

            // 데이터 유효성 검사
            const validData = data.filter(place =>
                place &&
                place.title &&
                place.mapx &&
                place.mapy
            );

            if (validData.length === 0) {
                throw new Error("유효한 여행지 데이터가 없습니다.");
            }

            // 애니메이션 효과를 위한 타이밍 조정
            await new Promise(resolve => setTimeout(resolve, 1000));
            setShowCapsule(true);

            await new Promise(resolve => setTimeout(resolve, 2000));
            setRandomTrip(validData);
            setShowResult(true);
            setSelectedPlace(validData[0]);
        } catch (err) {
            console.error("랜덤 여행 가져오기 실패:", err);
            setError(err.message || "랜덤 여행을 가져오는데 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSpinning(false);
            setAnimationComplete(true);
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        if (!isLoading) {
            spinGacha();
        }
    };

    const handleCreateCustom = () => {
        if (selectedPlace && onCreateCustom) {
            try {
                const place = {
                    id: selectedPlace.id || Date.now(),
                    title: selectedPlace.title,
                    address: selectedPlace.address,
                    mapx: selectedPlace.mapx,
                    mapy: selectedPlace.mapy,
                    imageUrl: selectedPlace.imageUrl,
                    rating: selectedPlace.rating,
                    userRatingsTotal: selectedPlace.userRatingsTotal
                };
                onCreateCustom(place);
            } catch (error) {
                console.error("일정 생성 중 오류 발생:", error);
                setError("일정 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
            }
        }
    };

    const onSelect = (place) => {
        if (onCreateCustom) {
            try {
                const selectedPlace = {
                    id: place.id || Date.now(),
                    title: place.title,
                    address: place.address,
                    mapx: place.mapx,
                    mapy: place.mapy,
                    imageUrl: place.imageUrl,
                    rating: place.rating,
                    userRatingsTotal: place.userRatingsTotal
                };
                onCreateCustom(selectedPlace);
            } catch (error) {
                console.error("장소 선택 중 오류 발생:", error);
                setError("장소 선택 중 오류가 발생했습니다. 다시 시도해주세요.");
            }
        }
    };

    const onCustomClick = () => {
        if (selectedPlace && onCreateCustom) {
            const place = {
                id: selectedPlace.id || Date.now(),
                title: selectedPlace.title,
                address: selectedPlace.address,
                mapx: selectedPlace.mapx,
                mapy: selectedPlace.mapy,
                imageUrl: selectedPlace.imageUrl,
                rating: selectedPlace.rating,
                userRatingsTotal: selectedPlace.userRatingsTotal
            };
            onCreateCustom(place);
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6 max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-teal-700 mb-2">랜덤 여행지 뽑기</h2>
                <p className="text-gray-600">오늘의 운세를 확인하고 새로운 여행지를 발견해보세요!</p>
            </div>

            <div className="relative">
                {/* 가챠 기계 디자인 */}
                <div className="bg-gradient-to-b from-teal-100 to-teal-50 rounded-2xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500"></div>

                    {/* 가챠 기계 상단 */}
                    <div className="flex justify-center mb-6">
                        <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full opacity-20"></div>
                            <FaDice className="text-4xl text-teal-600" />
                        </div>
                    </div>

                    {/* 결과 표시 영역 */}
                    <div className="bg-white rounded-xl p-6 shadow-md mb-6 min-h-[200px] flex items-center justify-center">
                        {isLoading ? (
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">여행지를 찾는 중...</p>
                            </div>
                        ) : selectedPlace ? (
                            <div className="text-center">
                                {selectedPlace.imageUrl && (
                                    <div className="mb-4 rounded-lg overflow-hidden shadow-md">
                                        <img
                                            src={selectedPlace.imageUrl}
                                            alt={selectedPlace.title}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null
                                                e.target.src = `/placeholder.svg?height=300&width=500&text=${encodeURIComponent(selectedPlace.title)}`
                                            }}
                                        />
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedPlace.title}</h3>
                                <p className="text-gray-600 mb-4">{selectedPlace.address}</p>
                                {selectedPlace.rating > 0 && (
                                    <div className="flex items-center justify-center gap-2 mb-4">
                                        <div className="flex text-yellow-400">
                                            {renderStars(selectedPlace.rating)}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {selectedPlace.rating.toFixed(1)} ({selectedPlace.userRatingsTotal || 0}명 평가)
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={handleRetry}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        <FaRedo size={14} />
                                        다시 뽑기
                                    </button>
                                    <button
                                        onClick={() => onSelect(selectedPlace)}
                                        className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2"
                                    >
                                        <FaPlus size={14} />
                                        일정에 추가
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <p>버튼을 눌러 새로운 여행지를 뽑아보세요!</p>
                            </div>
                        )}
                    </div>

                    {/* 뽑기 버튼 */}
                    <div className="flex justify-center">
                        <button
                            onClick={spinGacha}
                            disabled={isLoading}
                            className={`relative px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg transform transition-all duration-300 hover:scale-105 ${isLoading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                                }`}
                        >
                            <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
                            <div className="relative flex items-center gap-2">
                                <FaDice className="text-xl" />
                                {isLoading ? "뽑는 중..." : "여행지 뽑기"}
                            </div>
                        </button>
                    </div>
                </div>

                {/* 가챠 효과 */}
                {isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-b from-teal-500/20 to-transparent animate-pulse"></div>
                )}
            </div>

            {/* 커스텀 일정 만들기 버튼 */}
            <div className="text-center mt-8">
                <button
                    onClick={onCustomClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-teal-500 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                >
                    <FaPlus size={14} />
                    나만의 일정 만들기
                </button>
            </div>
        </div>
    )
}

export default RandomTrip
