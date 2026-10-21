
const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const BASE_URL = isLocal
  ? "http://localhost:5000"
  : "https://edutrack-seven-rho.vercel.app";
window.API_AUTH = `${BASE_URL}/api/auth`;
window.API_PLANNER = `${BASE_URL}/api/planner`;
window.API_ATTENDANCE = `${BASE_URL}/api/attendance`;
