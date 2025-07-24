import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"

export const fetchFestivals = async (region) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/festivals`, {
            params: { region },
        })
        return response.data
    } catch (error) {
        console.error("Error fetching festivals:", error)
        return []
    }
}
