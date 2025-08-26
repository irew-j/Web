import { useEffect, useState } from 'react';
import { recommendTrip } from '../api/trip';

const Recommendation = () => {
    const [message, setMessage] = useState("⏳ 여행지 추천 중...");

    useEffect(() => {
        const fetchRecommendation = async () => {
            try {
                const data = await recommendTrip("힐링 인천");
                setMessage(data.result || JSON.stringify(data));
            } catch (error) {
                setMessage(`백엔드 연결 실패: ${error.message}`);
            }
        };

        fetchRecommendation();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <h1 className="text-2xl font-bold text-center px-4">{message}</h1>
        </div>
    );
};

export default Recommendation;

