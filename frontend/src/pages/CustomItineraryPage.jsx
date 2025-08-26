"use client"

import React, { useState, useEffect } from 'react';
import CustomItinerary from "../components/CustomItinerary";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { getItineraryDetails } from "../api/itinerary";
import { FaArrowLeft } from "react-icons/fa";

const CustomItineraryPage = () => {
  const { itineraryId } = useParams();
  const [initialPlaces, setInitialPlaces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadItinerary = async () => {
      if (itineraryId) {
        try {
          const details = await getItineraryDetails(itineraryId);
          const places = details.items.map(item => item.destination); // API 응답에 맞게 추출
          setInitialPlaces(places);
        } catch (error) {
          console.error('일정 로드 실패:', error);
        }
      }
    };
    loadItinerary();
  }, [itineraryId]);

  const goToMainView = () => {
    navigate("/");
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
      <CustomItinerary initialPlaces={initialPlaces} />
    </div>
  );
};

export default CustomItineraryPage;