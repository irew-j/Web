import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

export const fetchFestivals = async (areaCode) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/trip/festivals`, {
            params: { areaCode },
        })
        return response.data
    } catch (error) {
        console.error("Error fetching festivals:", error)
        return []
    }
}
