"use client"

import React from 'react';
import RandomTrip from "../components/RandomTrip";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { createItinerary, addItemToItinerary } from "../api/itinerary";
import { useAuth } from "../context/AuthContext";

const RandomTripPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth(); // 토큰 사용 (인증 필요 시)

    const goToMainView = () => {
        navigate("/");
    };

    const handleCreateCustom = async (place) => {
        if (!place) return;
        try {
            // 새로운 일정 생성
            const itineraryData = { name: "랜덤 여행 일정" };
            const newItinerary = await createItinerary(itineraryData);
            const itineraryId = newItinerary.id;

            // 장소 추가 (place.id가 destinationId라고 가정)
            const itemData = { destinationId: place.id };
            await addItemToItinerary(itineraryId, itemData);

            // Custom 페이지로 이동하며 itineraryId 전달
            navigate(`/custom/${itineraryId}`);
        } catch (error) {
            console.error('일정 생성 실패:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={goToMainView}
                className="mb-8 flex items-center text-teal-600 hover:text-teal-800 transition-colors duration-200 text-lg font-medium"
            >
                <FaArrowLeft className="mr-2" />
                메인으로 돌아가기
            </button>
            <RandomTrip onCreateCustom={handleCreateCustom} />
        </div>
    );
};

export default RandomTripPage;