import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API_URL = `${BASE_URL}/api/auth`;

export const registerMember = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/members`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    console.log('Login response:', response.data); // 추가: 응답 로그
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response.data); // 추가: 오류 로그
    throw error.response.data;
  }
};

export const logout = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};