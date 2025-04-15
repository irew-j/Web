import React from 'react';

function TripResult({ weather }) {
    return (
        <div className="bg-white rounded shadow p-4 mt-4">
            <h2 className="text-lg font-semibold mb-2">📍 추천 여행 일정</h2>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <h3 className="text-md font-medium">예시 장소</h3>
                    <p className="text-sm text-gray-700">이곳은 힐링에 딱 좋은 감성 여행지입니다.</p>
                </div>
                <div className="flex-1">
                    <img
                        src="https://source.unsplash.com/400x300/?nature,travel"
                        alt="여행지"
                        className="w-full h-auto rounded"
                    />
                </div>
            </div>

            {weather && (
                <div className="mt-4 text-sm text-gray-600">
                    <p>현재 날씨: {weather.description}</p>
                    <p>온도: {weather.temp}°C</p>
                </div>
            )}
        </div>
    );
}

export default TripResult;