import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const ngoAPI = axios.create({
  baseURL: `${API_URL}/ngo`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
ngoAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ngoToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
ngoAPI.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ngoToken');
      localStorage.removeItem('ngoUser');
      window.location.href = '/ngo/login';
    }
    return Promise.reject(error.response?.data || { message: 'Network Error' });
  }
);

// Authentication
export const ngoLogin = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/ngo/login`, { email, password });

    // Server returns { status: 'success'|'error', message, data: { token, user, ngo } }
    const payload = response.data || {};

    if (payload.status === 'success' && payload.data) {
      // Persist both NGO-specific and generic auth keys so AuthContext/ProtectedRoute recognize login
      localStorage.setItem('ngoToken', payload.data.token);
      localStorage.setItem('ngoUser', JSON.stringify(payload.data.user));
      localStorage.setItem('token', payload.data.token);
      localStorage.setItem('user', JSON.stringify(payload.data.user));
      return { success: true, message: payload.message, data: payload.data };
    }

    return { success: false, message: payload.message || 'Login failed' };
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

export const ngoLogout = () => {
  localStorage.removeItem('ngoToken');
  localStorage.removeItem('ngoUser');
};

// Dashboard
export const getNGODashboardStats = () => {
  return ngoAPI.get('/dashboard/stats');
};

// Help Requests
export const getAllHelpRequests = (params = {}) => {
  return ngoAPI.get('/requests', { params });
};

export const getHelpRequestDetails = (id) => {
  return ngoAPI.get(`/requests/${id}`);
};

export const assignHelpRequest = (id) => {
  return ngoAPI.put(`/requests/${id}/assign`);
};

export const updateRequestStatus = (id, status, notes = '') => {
  return ngoAPI.put(`/requests/${id}/status`, { status, notes });
};

export const fulfillRequest = (id, data, files) => {
  const formData = new FormData();
  
  if (data.notes) {
    formData.append('notes', data.notes);
  }
  
  if (files) {
    files.forEach((file, index) => {
      formData.append(`proofFiles`, file);
    });
  }
  
  return ngoAPI.post(`/requests/${id}/fulfill`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Check NGO authentication
export const checkNGOLogin = () => {
  const token = localStorage.getItem('ngoToken');
  const user = localStorage.getItem('ngoUser');
  
  if (!token || !user) {
    return false;
  }
  
  try {
    return JSON.parse(user);
  } catch (error) {
    return false;
  }
};

export default ngoAPI;