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
  (error) => Promise.reject(error)
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
