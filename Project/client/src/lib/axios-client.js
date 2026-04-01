import axios from "axios";
// Dynamically determine API URL based on current host
const getApiUrl = () => {
    if (import.meta.env.MODE === "production") {
        return "/api";
    }
    // In development, use the current hostname to determine backend URL
    const hostname = window.location.hostname;
    const backendPort = 3001;
    // If accessed via IP (mobile), use the same IP for backend
    // If accessed via localhost (PC), use localhost for backend
    return `http://${hostname}:${backendPort}/api`;
};
export const API = axios.create({
    baseURL: getApiUrl(),
    withCredentials: true,
});

// Request interceptor - log outgoing requests
API.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error("[API] Request failed:", error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
API.interceptors.response.use(
    (response) => {
        console.log(`[API] Response from ${response.config.url}:`, response.status);
        return response;
    },
    (error) => {
        console.error(`[API] Error from ${error.config?.url}:`, error.response?.status, error.message);
        return Promise.reject(error);
    }
);
