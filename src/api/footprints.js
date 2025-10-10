import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

const getToken = () => {
  return localStorage.getItem('authToken');
};

export const createFootprint = async (footprintData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/footprints`, footprintData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating footprint:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const verifyLocation = async (destinationId, currentLat, currentLng, radius = 100) => {
  try {
    const response = await axios.post(`${API_URL}/footprints/verify-location`, {
      destinationId,
      currentLat,
      currentLng,
      radius
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying location:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const getFootprintStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/footprints/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching footprint stats:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const getFootprints = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/footprints`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching footprints:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const updateFootprint = async (id, footprintData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${API_URL}/footprints/${id}`, footprintData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating footprint ${id}:`, error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const deleteFootprint = async (id) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${API_URL}/footprints/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting footprint ${id}:`, error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const getSasUrl = async (fileName) => {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/storage/sas-url`, { fileName }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting SAS URL:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const uploadImageToBlob = async (sasUrl, file) => {
  try {
    const response = await fetch(sasUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type,
        'x-ms-version': '2020-04-08',
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error uploading image to Azure Blob Storage:', error.message);
    throw error.message;
  }
};

export const getImageSasUrl = async (fileName, permission = 'r') => {
  try {
    console.log(`SAS URL 요청 중: ${fileName} (권한: ${permission})`);
    const response = await axios.post(`${API_URL}/storage/sas-url`, { fileName, permission }, {
      // headers: {
      //   Authorization: `Bearer ${token}`,
      // },
    });
    console.log('SAS URL 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting image SAS URL:', error.response?.data || error.message);

    // 에러 상세 정보 로깅
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }

    // 기본 에러 응답 반환
    return {
      sasUrl: null,
      permanentUrl: null,
      error: error.response?.data || error.message
    };
  }
};