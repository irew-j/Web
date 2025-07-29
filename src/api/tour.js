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