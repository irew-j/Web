"use client"

import React from 'react';
import RandomTrip from "../components/RandomTrip";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const RandomTripPage = () => {
    const navigate = useNavigate();

    const goToMainView = () => {
        navigate("/");
    };

    const handleCreateCustom = (place) => {
        if (!place) return;
        try {
            localStorage.setItem('currentPlaces', JSON.stringify([place]));
        } catch (error) {
            console.error('로컬 스토리지 저장 실패:', error);
        }
        navigate("/custom");
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