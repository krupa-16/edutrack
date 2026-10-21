// --- CONFIGURATION ---
const API_URL = `${window.API_AUTH}`;
const SESSION_KEY = 'eduTrack_currentUser';


/**
 * REGISTER LOGIC
 */
async function registerUser(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('regPasswordInput').value;

    try {
        const response = await fetch('${window.API_AUTH}/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Success: Move straight to login without the "Created" popup
            window.location.href = 'login.html';
        } else {
            // Keep error alerts for now so you know if something is wrong
            alert(data.message || "Registration failed");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

/**
 * LOGIN LOGIC
 */
/**
 * LOGIN LOGIC (Fixed to include ID)
 */
async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('${window.API_AUTH}/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('eduTrack_currentUser', JSON.stringify({
                id: data.userId || data.id || data._id, // Capture the ID from the server
                name: data.username,
                email: data.email
            }));
            
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || "Invalid credentials");
        }
    } catch (err) {
        console.error("Login error:", err);
    }
}


/**
 * LOGOUT LOGIC (Stays the same!)
 */
function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

/**
 * UI UPDATE LOGIC (Keep this!)
 */
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY));
    
    // Only run this if we are on a page with these IDs (like the Dashboard)
    if (user && document.getElementById('sidebarName')) {
        document.getElementById('sidebarName').textContent = user.name;
        document.getElementById('sidebarEmail').textContent = user.email;
        document.getElementById('sidebarAvatar').src = `https://ui-avatars.com/api/?name=${user.name}&background=4f46e5&color=fff`;
        
        if (document.getElementById('userNameDisplay')) {
            document.getElementById('userNameDisplay').textContent = user.name;
        }
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});