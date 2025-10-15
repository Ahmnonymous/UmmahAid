import axios from "axios";
import accessToken from "./jwt-token-access/accessToken";

// base URL from .env with fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log("🌐 API_URL from .env:", import.meta.env.VITE_API_URL);
console.log("🌐 Using API_URL:", API_URL);
console.log("🌐 All env vars:", import.meta.env);

const axiosApi = axios.create({
  baseURL: API_URL,
});

// default headers
axiosApi.defaults.headers.common["Authorization"] = accessToken;

// Add Authorization header automatically if token exists
axiosApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // console.log("🚀 Sending token:", config.headers.Authorization);
  } else {
    console.log("⚠️ No token found in localStorage");
  }
  return config;
});


// Response interceptor
axiosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      
      // Check both 'message' and 'msg' fields (backend uses both)
      const errorMsg = (errorData?.message || errorData?.msg || error?.message || "").toString().toLowerCase();
      
      console.log("🔍 API Error:", { status, errorMsg, fullError: errorData });

      const looksExpired =
        errorMsg.includes("jwt exp") ||
        errorMsg.includes("jwt expired") ||
        errorMsg.includes("token expired") ||
        errorMsg.includes("token is not valid") ||
        errorMsg.includes("not valid") ||
        errorMsg.includes("unauthorized") ||
        errorMsg.includes("invalid token");

      // Trigger logout on 401 OR any token-related error message
      if (status === 401 || looksExpired) {
        console.log("🔴 JWT expired or unauthorized detected!");
        console.log("🔴 Status:", status, "| Message:", errorMsg);
        
        // Clear auth-related storage and force navigation to login
        try {
          localStorage.removeItem("authToken");
          localStorage.removeItem("UmmahAidUser");
          console.log("🗑️ Cleared authToken and UmmahAidUser");
          
          // Dispatch custom event to notify auth middleware immediately
          window.dispatchEvent(new Event("authTokenRemoved"));
          console.log("📢 Dispatched authTokenRemoved event");
        } catch (e) {
          console.error("Error clearing storage:", e);
        }

        // Avoid redirect loops if we're already on the login page
        const isOnLogin = typeof window !== "undefined" && window.location.pathname.startsWith("/login");
        if (!isOnLogin && typeof window !== "undefined") {
          console.log("🔄 Redirecting to login page...");
          window.location.replace("/login");
        } else {
          console.log("⚠️ Already on login page, skipping redirect");
        }
      }
    } catch (e) {
      console.error("Error in response interceptor:", e);
    }

    return Promise.reject(error);
  }
);

export async function get(url, config = {}) {
  return axiosApi.get(url, { ...config }).then((res) => res.data);
}

export async function post(url, data, config = {}) {
  console.log("📤 POST request to:", url);
  console.log("📤 Full URL will be:", API_URL + url);
  return axiosApi.post(url, data, { ...config }).then((res) => res.data);
}

export async function put(url, data, config = {}) {
  return axiosApi.put(url, data, { ...config }).then((res) => res.data);
}

export async function del(url, config = {}) {
  return axiosApi.delete(url, { ...config }).then((res) => res.data);
}

// ✅ Add this to fix the "default export" issue
export default axiosApi;

