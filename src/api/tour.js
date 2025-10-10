import axios from "axios";

// 위치 방문 인증 API
export const verifyTourLocation = async ({ destinationId, lat, lon }) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
        "/api/tour/verify",
        { destinationId, lat, lon },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return response.data;
};

// 현재 위치 기반 가이드 조회 API
export const getGuideByLocation = async ({ lat, lon }) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
        `/api/tour/guide?lat=${lat}&lon=${lon}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return response.data;
};