// // components/ TripList.jsx
// "use client"

// import TripResult from "./TripResult"
// import { FaDice, FaMapMarkerAlt } from "react-icons/fa"

// const TripList = ({ trips, onRecommendNew, searchMode = "keyword" }) => {
//     const trip = trips[0]

//     return (
//         <div className="space-y-8 mt-10">
//             <div className="flex justify-center items-center">
//                 {trip ? (
//                     <TripResult tripPlan={trip} color="#0D9488" />
//                 ) : (
//                     <p className="text-center text-gray-600">추천된 여행지가 없습니다.</p>
//                 )}
//             </div>

//             <div className="flex justify-center mt-8">
//                 <button
//                     onClick={onRecommendNew}
//                     className={`group flex items-center gap-2 ${searchMode === "location"
//                         ? "bg-gradient-to-r from-blue-500 to-cyan-500"
//                         : "bg-gradient-to-r from-teal-500 to-cyan-500"
//                         } text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition duration-300 transform`}
//                 >
//                     {searchMode === "location" ? (
//                         <FaMapMarkerAlt className="text-lg group-hover:animate-pulse" />
//                     ) : (
//                         <FaDice className="text-lg group-hover:rotate-90 transition-transform duration-300" />
//                     )}
//                     {searchMode === "location" ? "다른 위치 여행지 추천" : "다시 여행 추천 받기"}
//                 </button>
//             </div>
//         </div>
//     )
// }

// export default TripList


// import React from 'react';
// import TripResult from "./TripResult";
// import { FaDice, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";

// const TripList = ({ trips, onRecommendNew, onCreateCustom, searchMode = "keyword" }) => {
//     const trip = trips[0];

//     const handleCreateCustom = () => {
//         if (onCreateCustom && trip) {
//             onCreateCustom(trip);
//         }
//     };

//     return (
//         <div className="space-y-8 mt-10">
//             <div className="flex justify-center items-center">
//                 {trip ? (
//                     <TripResult tripPlan={trip} color="#0D9488" />
//                 ) : (
//                     <p className="text-center text-gray-600">추천된 여행지가 없습니다.</p>
//                 )}
//             </div>

//             <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
//                 <button
//                     onClick={onRecommendNew}
//                     className={`group flex items-center justify-center gap-2 ${searchMode === "location"
//                         ? "bg-gradient-to-r from-blue-500 to-cyan-500"
//                         : "bg-gradient-to-r from-teal-500 to-cyan-500"
//                         } text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition duration-300 transform`}
//                 >
//                     {searchMode === "location" ? (
//                         <FaMapMarkerAlt className="text-lg group-hover:animate-pulse" />
//                     ) : (
//                         <FaDice className="text-lg group-hover:rotate-90 transition-transform duration-300" />
//                     )}
//                     {searchMode === "location" ? "다른 위치 여행지 추천" : "다시 여행 추천 받기"}
//                 </button>

//                 <button
//                     onClick={handleCreateCustom}
//                     className="group flex items-center justify-center gap-2 bg-white text-teal-600 border-2 border-teal-500 font-semibold px-8 py-3 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition duration-300 transform"
//                 >
//                     <FaCalendarAlt className="text-lg" />
//                     나만의 여행 일정 만들기
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default TripList;


"use client"

import { useState } from "react"
import TripResult from "./TripResult"
import { FaDice, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa"

const TripList = ({ trips, onRecommendNew, onCreateCustom, searchMode = "keyword" }) => {
    const [selectedTripIndex, setSelectedTripIndex] = useState(0)

    const handleCreateCustom = () => {
        if (onCreateCustom && trips && trips.length > 0) {
            // 선택된 여행지를 전달
            onCreateCustom(trips[selectedTripIndex])
        }
    }

    const handleTripSelect = (index) => {
        setSelectedTripIndex(index)
    }

    return (
        <div className="space-y-8 mt-10">
            {/* 여행지 선택 탭 */}
            {trips.length > 1 && (
                <div className="flex overflow-x-auto pb-2 mb-4">
                    {trips.map((trip, index) => (
                        <button
                            key={index}
                            onClick={() => handleTripSelect(index)}
                            className={`flex-shrink-0 px-4 py-2 mr-2 rounded-full ${selectedTripIndex === index ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {index + 1}. {trip.title}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex justify-center items-center">
                {trips[selectedTripIndex] ? (
                    <TripResult
                        tripPlan={trips[selectedTripIndex]}
                        color="#0D9488"
                        onCreateCustom={onCreateCustom}
                        selectedTripIndex={selectedTripIndex}
                    />
                ) : (
                    <p className="text-center text-gray-600">추천된 여행지가 없습니다.</p>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <button
                    onClick={onRecommendNew}
                    className={`group flex items-center justify-center gap-2 ${searchMode === "location"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : "bg-gradient-to-r from-teal-500 to-cyan-500"
                        } text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition duration-300 transform`}
                >
                    {searchMode === "location" ? (
                        <FaMapMarkerAlt className="text-lg group-hover:animate-pulse" />
                    ) : (
                        <FaDice className="text-lg group-hover:rotate-90 transition-transform duration-300" />
                    )}
                    {searchMode === "location" ? "다른 위치 여행지 추천" : "다시 여행 추천 받기"}
                </button>


            </div>
        </div>
    )
}

export default TripList

