import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 새 일정 생성 (POST /api/itineraries)
export const createItinerary = async (itineraryData) => {
    const token = localStorage.getItem('authToken'); // Get token from localStorage
    const response = await axios.post(`${BASE_URL}/api/itineraries`, itineraryData, {
        headers: {
            Authorization: `Bearer ${token}` // Include token in headers
        }
    });
    return response.data;
};

// 내 모든 일정 조회 (GET /api/itineraries)
export const getAllItineraries = async () => {
    const token = localStorage.getItem('authToken'); // Get token from localStorage
    const response = await axios.get(`${BASE_URL}/api/itineraries`, {
        headers: {
            Authorization: `Bearer ${token}` // Include token in headers
        }
    });
    return response.data;
};

// 특정 일정 상세 조회 (GET /api/itineraries/{itineraryId})
export const getItineraryDetails = async (itineraryId) => {
    const token = localStorage.getItem('authToken'); // Get token from localStorage
    const response = await axios.get(`${BASE_URL}/api/itineraries/${itineraryId}`, {
        headers: {
            Authorization: `Bearer ${token}` // Include token in headers
        }
    });
    return response.data;
};

// 일정에 장소 추가 (POST /api/itineraries/{itineraryId}/items)
export const addItemToItinerary = async (itineraryId, itemData) => { // 인자 변경: itineraryId와 itemData를 받도록 수정
    console.log("addItemToItinerary called with itineraryId:", itineraryId, "and itemData:", itemData); // 로그 내용 수정
    const token = localStorage.getItem('authToken'); // Get token from localStorage
    try {
        const response = await axios.post(`${BASE_URL}/api/itineraries/${itineraryId}/items`, itemData, { // 'api' 대신 'axios' 사용
            headers: {
                Authorization: `Bearer ${token}` // Include token in headers
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error adding item to itinerary:', error);
        throw error;
    }
};

// 일정에서 장소 삭제 (DELETE /api/itineraries/items/{itemId})
export const removeItemFromItinerary = async (itemId) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${BASE_URL}/api/itineraries/items/${itemId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

// 일정 내 장소 순서 변경 (PUT /api/itineraries/{itineraryId}/items/order)
export const updateItemOrder = async (itineraryId, orderData) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${BASE_URL}/api/itineraries/${itineraryId}/items/order`, orderData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

// 일정 업데이트 (PUT /api/itineraries/{itineraryId})
export const updateItinerary = async (itineraryId, itineraryData) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${BASE_URL}/api/itineraries/${itineraryId}`, itineraryData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

// 일정 삭제 (DELETE /api/itineraries/{itineraryId})
export const deleteItinerary = async (itineraryId) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${BASE_URL}/api/itineraries/${itineraryId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};