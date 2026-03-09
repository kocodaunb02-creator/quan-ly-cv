import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
    baseURL: '/api', // Proxied to http://localhost:5002 via Vite
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiry or global errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // localStorage.removeItem('token');
            // localStorage.removeItem('user');
            // window.location.href = '/login'; // Or handle via React state
        }
        return Promise.reject(error);
    }
);

export default apiClient;
