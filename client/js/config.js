// js/config.js

// 1. Detect if the app is running on your computer (localhost) or online
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// 2. Set the Base URL
const BASE_URL = isLocal 
    ? "http://localhost:5000" 
    : "https://edutrack.vercel.app/api";

// 3. Define all your specific API paths
window.API_AUTH = `${BASE_URL}/api/auth`;
window.API_PLANNER = `${BASE_URL}/api/planner`;
window.API_ATTENDANCE = `${BASE_URL}/api/attendance`;