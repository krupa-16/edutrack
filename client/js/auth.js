
const API_URL = window.API_AUTH;
const SESSION_KEY = 'eduTrack_currentUser';
async function readResponse(response) {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch {
        throw new Error("The server returned an invalid response. Check the API URL and server logs.");
    }
}
async function registerUser(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('regPasswordInput').value;
    if (!username || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await readResponse(response);
        if (!response.ok) {
            throw new Error(data.message || data.error || "Registration failed.");
        }
        alert("Registration successful. Please log in.");
        window.location.href = 'login.html';
    } catch (err) {
        console.error("Registration error:", err);
        alert(err.message || "Could not connect to the server. Please try again.");
    }
}
async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await readResponse(response);
        if (!response.ok) {
            throw new Error(data.message || data.error || "Login failed. Check your credentials.");
        }
        const user = data.user || data;
        const id = user.userId || user.id || user._id || data.userId || data.id || data._id;
        const name = user.username || user.name || data.username || data.name;
        const userEmail = user.email || data.email || email;
        if (!id) {
            throw new Error("Login response did not include a user ID. The backend response needs to be checked.");
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            id: String(id),
            name: name || userEmail,
            email: userEmail
        }));
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error("Login error:", err);
        alert(err.message || "Could not connect to the server. Please try again.");
    }
}
function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}
document.addEventListener('DOMContentLoaded', () => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (err) {
        localStorage.removeItem(SESSION_KEY);
    }
    if (user && document.getElementById('sidebarName')) {
        document.getElementById('sidebarName').textContent = user.name || '';
        const emailElement = document.getElementById('sidebarEmail');
        if (emailElement) emailElement.textContent = user.email || '';
        const avatar = document.getElementById('sidebarAvatar');
        if (avatar) avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4f46e5&color=fff`;
        const display = document.getElementById('userNameDisplay');
        if (display) display.textContent = user.name || '';
    }
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
