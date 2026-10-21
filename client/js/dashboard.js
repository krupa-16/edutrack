// Helper to get ID safely
function getUserId() {
    const user = JSON.parse(localStorage.getItem('eduTrack_currentUser'));
    if (!user) return null;
    const id = user.id || user._id || user.userId;
    return (id && id !== "undefined") ? id : null;
}

document.addEventListener('DOMContentLoaded', async () => {
    const userId = getUserId();
    const user = JSON.parse(localStorage.getItem('eduTrack_currentUser'));

    // 1. SESSION GUARD
    if (!userId) {
        console.error("User ID is missing or undefined in localStorage");
        window.location.href = 'login.html';
        return;
    }

    // 2. PERSONALIZATION
    if (user && user.name) {
        const nameDisplay = document.getElementById('userNameDisplay');
        if (nameDisplay) nameDisplay.textContent = user.name;
        
        // Update Sidebar/Avatar if they exist
        const sidebarName = document.getElementById('sidebarName');
        const avatar = document.getElementById('sidebarAvatar');
        if (sidebarName) sidebarName.textContent = user.name;
        if (avatar) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`;
        }
    }

    // 3. TRIGGER CLOUD SYNC
    // We call both functions here to ensure the UI updates
    await syncDashboardStats(userId);
    await loadPlannerPreview(userId);
    
    // Initialize Lucide icons once everything is loaded
    if (window.lucide) lucide.createIcons();
});

async function syncDashboardStats(userId) {
    console.log("Fetching attendance from:", `${window.API_ATTENDANCE}/${userId}`);
    try {
        const [attResponse, planResponse] = await Promise.all([
            fetch(`${window.API_ATTENDANCE}/${userId}`),
            fetch(`${window.API_PLANNER}/stats/${userId}`)
        ]);

        if (attResponse.ok) {
            const subjects = await attResponse.json();
            updateAttendanceUI(subjects);
        }

        if (planResponse.ok) {
            const plannerData = await planResponse.json();
            updateStatsUI(plannerData);
        }
    } catch (err) {
        console.error("Dashboard Sync Error:", err);
    }
}

function updateAttendanceUI(subjects) {
    const attText = document.getElementById('totalAttendance'); // Matches your HTML
    const attBar = document.getElementById('totalProgress');    // Matches your HTML
    
    if (!attText) return;

    let totalPercentage = 0;
    let countedSubjects = 0;

    subjects.forEach(sub => {
        const markedDates = sub.dates.filter(d => d.status !== 'pending');
        if (markedDates.length > 0) {
            const present = markedDates.filter(d => d.status === 'present').length;
            totalPercentage += (present / markedDates.length) * 100;
            countedSubjects++;
        }
    });

    const finalAvg = countedSubjects > 0 ? Math.round(totalPercentage / countedSubjects) : 0;
    
    attText.innerText = `${finalAvg}%`;
    if (attBar) attBar.style.width = `${finalAvg}%`;
}

function updateStatsUI(data) {
    const streakEl = document.getElementById('streakDisplay');   // Matches your HTML
    const completedEl = document.getElementById('completedTasks');
    const pendingEl = document.getElementById('pendingTasks');
    const efficiencyEl = document.getElementById('efficiencyPerc');

    if (streakEl) streakEl.innerText = `${data.streak || 0} Days`;
    if (completedEl) completedEl.innerText = data.overall.done;
    
    if (pendingEl) {
        const pendingCount = data.overall.total - data.overall.done;
        pendingEl.innerText = pendingCount > 0 ? pendingCount : 0;
    }

    if (efficiencyEl) {
        efficiencyEl.innerText = `${data.overall.percent}%`;
    }
}

async function loadPlannerPreview(userId) {
    const previewContainer = document.getElementById('plannerPreview');
    if (!previewContainer) return;

    try {
        const res = await fetch(`${window.API_PLANNER}/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch planner");
        
        const tasks = await res.json();
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        
        const prioritizedTasks = tasks
            .filter(t => t.status === 'pending')
            .sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4))
            .slice(0, 3);

        if (prioritizedTasks.length === 0) {
            previewContainer.innerHTML = `
                <div class="col-12 text-center text-success py-3">
                    <p>No pending tasks! 🎉</p>
                </div>`;
            return;
        }

        previewContainer.innerHTML = prioritizedTasks.map(t => `
            <div class="col-md-4">
                <div class="p-3 border rounded-4 bg-white h-100 shadow-sm border-start border-4 ${t.priority === 'high' ? 'border-danger' : 'border-primary'}">
                    <div class="badge ${t.priority === 'high' ? 'bg-danger' : 'bg-primary'} mb-2 text-uppercase" style="font-size:0.7rem">${t.priority}</div>
                    <h6 class="fw-bold mb-1 text-truncate">${t.title}</h6>
                    <small class="text-muted">${t.date}</small>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Preview Error:", err);
        previewContainer.innerHTML = `<p class="text-danger text-center">Error loading tasks.</p>`;
    }
}

function logout() {
    localStorage.removeItem('eduTrack_currentUser');
    window.location.href = 'login.html';
}