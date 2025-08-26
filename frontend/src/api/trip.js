// // api/trip 
// //키워드 기반 랜덤 추천
// import axios from 'axios';

// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// export const fetchItinerary = async (query) => {
//     const response = await axios.post(`${BASE_URL}/api/trip/itinerary`, { query });
//     return response.data;
// };




// // // src/api/trip.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const fetchItinerary = async (query, travelMode) => {
    let endpoint = "/api/trip/recommend-walk";
    if (travelMode === "DRIVING") endpoint = "/api/trip/recommend-car";
    else if (travelMode === "TRANSIT") endpoint = "/api/trip/recommend-transit";
    const response = await axios.post(`${BASE_URL}${endpoint}`, { query });
    return response.data;
};

// export const fetchRandomTrip = async () => {
//     const response = await axios.get(`${BASE_URL}/api/trip/random`);
//     return response.data;
// };


export const fetchRandomTrip = async () => {
    try {
        // API 호출
        const response = await axios.get(`${BASE_URL}/api/trip/random`);
        const data = response.data;

        // 단일 객체일 경우 배열로 감싸서 반환
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        console.error("랜덤 여행 API 호출 실패:", error);
        throw error;
    }
};

export const fetchDirections = async (originLat, originLng, destLat, destLng) => {
    const response = await axios.get(`${BASE_URL}/api/trip/directions`, {
        params: { originLat, originLng, destLat, destLng }
    });
    return response.data;
};

export const searchDestination = async (placeName) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/trip/destination/search`, {
            params: { title: placeName }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching destination:", error);
        throw error;
    }
};