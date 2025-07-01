"use client"

import React, { useState, useEffect } from 'react';
import CustomItinerary from "../components/CustomItinerary";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const CustomItineraryPage = () => {
    const [initialPlaces, setInitialPlaces] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const storedPlaces = localStorage.getItem('currentPlaces');
            if (storedPlaces) {
                setInitialPlaces(JSON.parse(storedPlaces));
            }
        } catch (error) {
            console.error('로컬 스토리지에서 데이터 로드 실패:', error);
        }
    }, []);

    const goToMainView = () => {
        try {
            localStorage.removeItem('currentPlaces');
        } catch (error) {
            console.error('로컬 스토리지 정리 실패:', error);
        }
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