import React from 'react';
import { useParams } from 'react-router-dom';

function TripDetailPage() {
    // 여행 데이터 (여기서는 예시 데이터를 사용)
    const tripData = {
        id: 1,
        location: '춘천',
        date: '2025-03-24',
        keywords: ['감성', '호수', '힐링'],
        memo: '춘천 남이섬에서 봄바람 맞으며 힐링한 하루 🌸',
        imageUrl: 'https://source.unsplash.com/400x250/?lake,spring',
    };

    const { id } = useParams(); // URL에서 여행 ID를 받아옵니다 (추후 실제 데이터 연동 시 사용)

    // 예시 tripData로 실제 데이터 처리 및 API 호출 로직을 넣을 수 있습니다.

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">여행 상세 정보</h2>

            <div className="bg-white shadow-md rounded-lg p-6">
                {/* 여행 이미지 */}
                <img src={tripData.imageUrl} alt={tripData.location} className="w-full h-60 object-cover rounded-md mb-4" />

                {/* 여행 정보 */}
                <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">{tripData.location}</h3>
                    <p className="text-sm text-gray-500">{tripData.date}</p>
                </div>

                {/* 키워드 */}
                <div className="mb-4">
                    <h4 className="text-lg font-semibold">키워드</h4>
                    <div className="flex flex-wrap gap-2">
                        {tripData.keywords.map((keyword, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 여행 메모 */}
                <div className="mb-4">
                    <h4 className="text-lg font-semibold">여행 메모</h4>
                    <p>{tripData.memo}</p>
                </div>

                {/* 수정, 삭제 버튼 (추후 기능 추가) */}
                <div className="mt-6 flex gap-4">
                    <button className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-400">
                        여행 수정
                    </button>
                    <button className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-400">
                        여행 삭제
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TripDetailPage;
