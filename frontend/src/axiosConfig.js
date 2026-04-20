import axios from "axios";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// Helper to wait for the first auth state check
const waitForAuth = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Add a request interceptor to attach the Firebase ID token
axiosInstance.interceptors.request.use(
  async (config) => {
    let user = auth.currentUser;
    
    // If user is null, it might be initializing
    if (!user) {
      user = await waitForAuth();
    }

    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("[Axios] No authenticated user found for request:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
