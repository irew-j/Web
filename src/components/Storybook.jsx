// src/components/Storybook.jsx
import React from 'react';

function Storybook({ trip }) {
    if (!trip) return null;

    return (
        <div className="bg-[#fffefc] text-gray-800 p-6 rounded-xl shadow-md max-w-3xl mx-auto space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 font-[Pretendard]">📖 나만의 여행 스토리북</h2>
                <p className="text-sm text-gray-500">{trip.date} · {trip.location}</p>
            </div>

            <div className="bg-white border border-yellow-100 rounded-xl overflow-hidden shadow-sm">
                <img
                    src={trip.imageUrl}
                    alt="trip preview"
                    className="w-full h-64 object-cover"
                />
                <div className="p-4 space-y-2">
                    <h3 className="text-xl font-semibold text-yellow-800">{trip.keywords.join(', ')}</h3>
                    <p className="text-gray-700 leading-relaxed">{trip.memo}</p>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold mb-2">🗺 지도 보기</h4>
                {/* 여기에 KakaoMap 컴포넌트를 삽입 */}
                <div className="rounded overflow-hidden border">
                    <div style={{ width: '100%', height: '300px' }}>
                        {/* ex) <KakaoMap location={trip.location} /> */}
                        <p className="text-gray-500 text-center mt-12">[카카오맵 삽입 영역]</p>
                    </div>
                </div>
            </div>

            <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500">✨ 이 순간을 기억해요</p>
            </div>
        </div>
    );
}

export default Storybook;
