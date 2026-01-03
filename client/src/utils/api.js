import axios from 'axios';

// Vite exposes env variables on `import.meta.env`. Use VITE_API_URL for the API base URL.
// Falls back to localhost when the env var isn't provided.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a base axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create axios instances for different endpoints
export const authAPI = axios.create({
  baseURL: `${BASE_URL}/auth`,
});

export const userAPI = axios.create({
  baseURL: `${BASE_URL}/users`,
});

export const productAPI = axios.create({
  baseURL: `${BASE_URL}/products`,
});

export const orderAPI = axios.create({
  baseURL: `${BASE_URL}/orders`,
});

export const storyAPI = axios.create({
  baseURL: `${BASE_URL}/stories`,
});

export const requestAPI = axios.create({
  baseURL: `${BASE_URL}/requests`,
});

export const supportAPI = axios.create({
  baseURL: `${BASE_URL}/support`,
});

export const adminAPI = axios.create({
  baseURL: `${BASE_URL}/admin`,
});

export const cartAPI = axios.create({
  baseURL: `${BASE_URL}/cart`,
});

// Add auth token to all requests
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor to handle common errors
const handleResponseError = (error) => {
  console.error('API Error:', {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  if (error.response?.status === 401) {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?session=expired';
    }
  }

  return Promise.reject(error);
};

// Add request interceptor to the base API
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Base API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to the base API
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    return Promise.reject(error.response?.data || { message: 'Network Error' });
  }
);

// Add request logging for all other APIs
// Include all API instances that need auth headers and response handling
const apiInstances = [authAPI, userAPI, productAPI, orderAPI, storyAPI, requestAPI, supportAPI, adminAPI, cartAPI];

apiInstances.forEach(apiInstance => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log all API requests in development
      if (import.meta.env.DEV) {
        console.log(`🔵 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
      }
      
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );
  
  apiInstance.interceptors.response.use(
    (response) => {
      // Log successful responses in development
      if (import.meta.env.DEV) {
        console.log(`🟢 ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
      }
      return response;
    },
    handleResponseError
  );
});

// Utility functions
export const handleApiError = (error) => {
  console.error('API Error Details:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  // Extract meaningful error message
  let message = 'Something went wrong. Please try again.';
  let errors = [];

  if (error.response) {
    // Server responded with error
    const responseData = error.response.data;
    
    if (responseData.message) {
      message = responseData.message;
    }
    
    if (responseData.errors) {
      if (Array.isArray(responseData.errors)) {
        errors = responseData.errors;
      } else if (typeof responseData.errors === 'object') {
        errors = Object.values(responseData.errors).flat();
      }
      
      if (errors.length > 0) {
        message = errors[0];
      }
    }
  } else if (error.request) {
    // Request made but no response
    message = 'Network error. Please check your internet connection.';
  } else {
    // Something else happened
    message = error.message || 'An unexpected error occurred.';
  }

  return { 
    message, 
    errors,
    originalError: error 
  };
};

export const makeFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      if (Array.isArray(data[key])) {
        data[key].forEach(item => formData.append(key, item));
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  return formData;
};

// Helper function to format error messages for display
export const formatErrorMessage = (error) => {
  const { message, errors } = handleApiError(error);
  
  if (errors.length > 0) {
    return errors.join(', ');
  }
  
  return message;
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Simple token validation (could be enhanced with JWT decoding)
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Order-specific API helper functions
export const orderHelpers = {
  placeOrder: async (orderData) => {
    try {
      console.log('Placing order with data:', orderData);
      const response = await orderAPI.post('/', orderData);
      return response.data;
    } catch (error) {
      console.error('Order placement failed:', error);
      throw error;
    }
  },
  
  getBuyerOrders: async (status = 'all', page = 1, limit = 10) => {
    try {
      const response = await orderAPI.get('/my-orders', {
        params: { status, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch buyer orders:', error);
      throw error;
    }
  },
  
  getSellerOrders: async (status = 'all', page = 1, limit = 10) => {
    try {
      const response = await orderAPI.get('/seller/my-orders', {
        params: { status, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch seller orders:', error);
      throw error;
    }
  },
  
  updateOrderStatus: async (orderId, status, data = {}) => {
    try {
      const response = await orderAPI.patch(`/seller/${orderId}/status`, {
        status,
        ...data
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }
};

// Help Request API - FIXED: Now using the base 'api' instance
export const helpRequestAPI = {
  create: (formData) => {
    return api.post('/help/requests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getMyRequests: (params = {}) => {
    return api.get('/help/my-requests', { params });
  },

  getRequest: (id) => {
    return api.get(`/help/requests/${id}`);
  },

  update: (id, formData) => {
    return api.put(`/help/requests/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  delete: (id) => {
    return api.delete(`/help/requests/${id}`);
  }
};

// Export default API instance
export default {
  auth: authAPI,
  user: userAPI,
  product: productAPI,
  order: orderAPI,
  story: storyAPI,
  request: requestAPI,
  support: supportAPI,
  admin: adminAPI,
  cart: cartAPI,
  helpers: {
    handleApiError,
    formatErrorMessage,
    makeFormData,
    isAuthenticated,
    getAuthHeaders,
    order: orderHelpers
  }
};