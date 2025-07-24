"use client"

import { useState, useEffect } from "react"
import { FaCalendarAlt, FaTrash, FaPlus, FaMapMarkerAlt, FaStar } from "react-icons/fa"

const ItineraryManager = ({ onSelectItinerary }) => {
    const [savedItineraries, setSavedItineraries] = useState([])
    const [selectedItineraryId, setSelectedItineraryId] = useState(null)
    const [viewItinerary, setViewItinerary] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    // 로컬 스토리지에서 저장된 일정 불러오기
    useEffect(() => {
        const loadSavedItineraries = () => {
            try {
                setIsLoading(true);
                const savedData = localStorage.getItem("savedItineraries")
                if (savedData) {
                    const parsed = JSON.parse(savedData)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setSavedItineraries(parsed)
                        setSelectedItineraryId(parsed[0].id)
                        setViewItinerary(parsed[0])
                    }
                }
                setIsLoading(false);
            } catch (error) {
                console.error("저장된 일정을 불러오는 중 오류 발생:", error)
                setToastMessage("일정을 불러오는 중 오류가 발생했습니다.");
                setShowToast(true);
                setIsLoading(false);
            }
        }

        loadSavedItineraries();
    }, [])

    // 토스트 메시지 표시
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    // 일정 선택 시 호출
    const handleSelectItinerary = (itinerary) => {
        setSelectedItineraryId(itinerary.id)
        setViewItinerary(itinerary)
        setToastMessage("일정이 선택되었습니다!");
        setShowToast(true);
    }

    // 일정 편집하기
    const handleEditItinerary = (itinerary) => {
        if (onSelectItinerary) {
            onSelectItinerary(itinerary)
            setToastMessage("일정 편집을 시작합니다!");
            setShowToast(true);
        }
    }

    // 일정 삭제
    const handleDeleteItinerary = (id, e) => {
        e.stopPropagation() // 이벤트 버블링 방지

        const confirmed = window.confirm("정말로 이 일정을 삭제하시겠습니까?")
        if (!confirmed) return

        try {
            const updatedItineraries = savedItineraries.filter((item) => item.id !== id)
            setSavedItineraries(updatedItineraries)
            localStorage.setItem("savedItineraries", JSON.stringify(updatedItineraries))

            // 삭제한 일정이 현재 선택된 일정이면 다른 일정 선택
            if (id === selectedItineraryId) {
                if (updatedItineraries.length > 0) {
                    setSelectedItineraryId(updatedItineraries[0].id)
                    setViewItinerary(updatedItineraries[0])
                } else {
                    setSelectedItineraryId(null)
                    setViewItinerary(null)
                }
            }

            setToastMessage("일정이 삭제되었습니다!");
            setShowToast(true);
        } catch (error) {
            console.error("일정 삭제 중 오류 발생:", error);
            setToastMessage("일정 삭제 중 오류가 발생했습니다.");
            setShowToast(true);
        }
    }

    // 새 일정 만들기로 이동
    const handleCreateNew = () => {
        if (onSelectItinerary) {
            onSelectItinerary({ isNew: true })
            setToastMessage("새 일정 만들기를 시작합니다!");
            setShowToast(true);
        }
    }

    return (
        <div className="relative min-h-screen bg-gray-50">
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
                <div className="fixed bottom-4 right-4 bg-teal-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-fade-in-up">
                    {toastMessage}
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-6 mt-6 max-w-5xl mx-auto">
                    {/* 배경 그라데이션 효과 */}
                    <div className="absolute -z-10 top-0 left-0 right-0 h-64 bg-gradient-to-b from-teal-50 to-transparent"></div>

                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-teal-700 flex items-center gap-2">
                            <FaCalendarAlt className="text-teal-600" />내 여행 일정 관리
                        </h2>
                        <button
                            onClick={handleCreateNew}
                            className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2.5 rounded-full hover:from-teal-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <FaPlus size={14} /> 새 일정 만들기
                        </button>
                    </div>

                    {savedItineraries.length === 0 ? (
                        <div className="text-center py-16 bg-gradient-to-b from-teal-50 to-white rounded-2xl shadow-sm">
                            <FaMapMarkerAlt className="mx-auto text-5xl mb-4 text-teal-400" />
                            <h3 className="text-2xl font-medium text-gray-700 mb-3">저장된 일정이 없습니다</h3>
                            <p className="text-gray-500 mb-8">새로운 여행 일정을 만들어보세요!</p>
                            <button
                                onClick={handleCreateNew}
                                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-full hover:from-teal-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg text-lg"
                            >
                                일정 만들기 시작하기
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <h3 className="font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">저장된 일정 목록</h3>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                                    {savedItineraries.map((itinerary) => (
                                        <div
                                            key={itinerary.id}
                                            onClick={() => handleSelectItinerary(itinerary)}
                                            className={`bg-white border-2 ${selectedItineraryId === itinerary.id
                                                ? "border-teal-500 shadow-lg scale-[1.02]"
                                                : "border-gray-200 hover:border-teal-200"
                                                } rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-md`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-gray-800 text-lg">{itinerary.name}</h3>
                                                <button
                                                    onClick={(e) => handleDeleteItinerary(itinerary.id, e)}
                                                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">
                                                {new Date(itinerary.createdAt).toLocaleDateString()} 생성 • {itinerary.places.length}개 장소
                                            </p>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {itinerary.places.slice(0, 3).map((place, idx) => (
                                                    <span key={idx} className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full">
                                                        {place.title}
                                                    </span>
                                                ))}
                                                {itinerary.places.length > 3 && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                                                        +{itinerary.places.length - 3}개 더
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditItinerary(itinerary)
                                                }}
                                                className={`w-full text-center py-2 text-sm rounded-lg transition-all duration-300 ${selectedItineraryId === itinerary.id
                                                    ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {selectedItineraryId === itinerary.id ? "선택됨" : "선택하기"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                {viewItinerary ? (
                                    <div className="bg-gradient-to-b from-teal-50 to-white p-8 rounded-2xl shadow-sm">
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-2xl font-bold text-gray-800">{viewItinerary.name}</h3>
                                            <button
                                                onClick={() => handleEditItinerary(viewItinerary)}
                                                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-2.5 rounded-full hover:from-teal-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                            >
                                                이 일정으로 여행 계획하기
                                            </button>
                                        </div>

                                        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm">
                                            <p className="text-sm text-gray-600 mb-2">
                                                <strong>생성일:</strong> {new Date(viewItinerary.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>장소 수:</strong> {viewItinerary.places.length}개
                                            </p>
                                        </div>

                                        <h4 className="font-bold text-gray-700 mb-4 text-lg">여행 장소</h4>
                                        <div className="space-y-4">
                                            {viewItinerary.places.map((place, index) => (
                                                <div key={index} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-start gap-5">
                                                        {place.imageUrl ? (
                                                            <img
                                                                src={place.imageUrl || "/placeholder.svg"}
                                                                alt={place.title}
                                                                className="w-24 h-24 object-cover rounded-lg shadow-sm"
                                                                onError={(e) => {
                                                                    e.target.onerror = null
                                                                    e.target.src = "/placeholder.svg?height=96&width=96"
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-24 h-24 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg flex items-center justify-center shadow-sm">
                                                                <FaMapMarkerAlt className="text-teal-400 text-2xl" />
                                                            </div>
                                                        )}
                                                        <div className="flex-grow">
                                                            <div className="flex items-center mb-2">
                                                                <span className="font-bold bg-gradient-to-r from-teal-500 to-teal-600 text-white w-7 h-7 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                                                    {index + 1}
                                                                </span>
                                                                <h5 className="font-bold text-gray-800 text-lg">{place.title}</h5>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">{place.address}</p>
                                                            {place.rating > 0 && (
                                                                <div className="flex items-center mt-3">
                                                                    <FaStar className="text-yellow-400 mr-1" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {place.rating.toFixed(1)} ({place.userRatingsTotal || 0})
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-b from-teal-50 to-white p-8 rounded-2xl shadow-sm flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <FaMapMarkerAlt className="mx-auto text-5xl mb-4 text-teal-400" />
                                            <p className="text-gray-500 text-lg">왼쪽에서 일정을 선택하거나 새 일정을 만들어보세요</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ItineraryManager
