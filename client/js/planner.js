
let timerInterval;
let timeLeft = 25 * 60; // 25 minutes default
let isRunning = false;
const API_BASE = "${window.API_PLANNER}";


// --- HELPERS ---
function getUserId() {
    const user = JSON.parse(localStorage.getItem('eduTrack_currentUser'));
    return user ? (user.id || user._id) : null;
}

function notify(msg, type = "success") {
    const container = document.getElementById('toastContainer');
    if(!container) return; 
    const toast = document.createElement('div');
    toast.className = `custom-toast border-start border-4 ${type === 'danger' ? 'border-danger' : 'border-primary'}`;
    toast.innerHTML = `<div class="d-flex align-items-center gap-2">${msg}</div>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 500); 
    }, 3000);
}

// --- MODAL CONTROLS ---
function openModal(type) {
    document.getElementById('entryType').value = type;
    document.getElementById('modalHeading').innerText = "Add " + type.toUpperCase();
    new bootstrap.Modal(document.getElementById('entryModal')).show();
}

function openExamModal() {
    const container = document.getElementById('subTaskContainer');
    if(container) { container.innerHTML = ''; addSubTask(); }
    new bootstrap.Modal(document.getElementById('examModal')).show();
}

function addSubTask() {
    const container = document.getElementById('subTaskContainer');
    const div = document.createElement('div');
    div.className = "input-group input-group-sm mb-1";
    div.innerHTML = `<input type="text" class="form-control sub-input" placeholder="Task step..."><button class="btn btn-outline-danger" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(div);
}

// --- CLOUD SAVE LOGIC ---
async function saveEntry() {
    const title = document.getElementById('entryTitle')?.value;
    const date = document.getElementById('entryDate')?.value;
    const type = document.getElementById('entryType')?.value;
    const priority = document.getElementById('entryPriority')?.value;

    if(!title || !date) return notify("Please fill all fields", "danger");

    await fetch(`${API_BASE}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), type, title, priority, date, status: 'pending' })
    });
    
    notify(`${type.toUpperCase()} created in cloud!`);
    bootstrap.Modal.getInstance(document.getElementById('entryModal')).hide();
    render();
}

async function saveExam() {
    const title = document.getElementById('examTitle')?.value;
    const date = document.getElementById('examDate')?.value;
    if(!title || !date) return notify("Please fill Subject and Date", "danger");

    const subs = Array.from(document.querySelectorAll('.sub-input'))
        .map(i => ({ title: i.value, done: false }))
        .filter(t => t.title);
    
    await fetch(`${API_BASE}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getUserId(), type: 'exam', title, date, subtasks: subs, priority: 'high', status: 'pending' })
    });
    
    notify("Exam schedule activated in cloud!");
    bootstrap.Modal.getInstance(document.getElementById('examModal')).hide();
    render();
}

// --- CORE RENDER (FETCH FROM MONGO) ---
let searchTerm = "";
async function render() {
    const userId = getUserId();
    if(!userId) return;

    const response = await fetch(`${API_BASE}/${userId}`);
    const entries = await response.json();

    const activeTasks = document.getElementById('activeTasks');
    const completedTasks = document.getElementById('completedTasks');
    const examList = document.getElementById('examList');
    const intel = document.getElementById('intelFeed');

    if(activeTasks) activeTasks.innerHTML = ''; 
    if(completedTasks) completedTasks.innerHTML = ''; 
    if(examList) examList.innerHTML = '';

    const filteredEntries = entries.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));

    filteredEntries.forEach(e => {
        const isDone = e.status === 'completed';
const pClass = `p-${(e.priority || 'medium').toLowerCase()}`;
        let progress = 0;
        
        if(e.type === 'exam' && e.subtasks?.length > 0) {
            const doneCount = e.subtasks.filter(s => s.done).length;
            progress = Math.round((doneCount / e.subtasks.length) * 100);
        }

        const cardHtml = `
    <div class="card expandable-card ${pClass} ${isDone ? 'opacity-50' : ''} mb-3 shadow-sm border-0">
        <div class="p-3 d-flex justify-content-between align-items-center" onclick="document.getElementById('body-${e._id}').classList.toggle('d-none')" style="cursor:pointer">
            <div>
                <h6 class="fw-bold mb-0 ${isDone ? 'text-decoration-line-through' : ''}">${e.title}</h6>
                
                <div class="d-flex align-items-center gap-2 mt-1">
                    <small class="text-muted font-monospace">${e.date}</small>
                    ${e.type === 'exam' && !isDone ? 
                        `<span class="badge bg-light text-dark border fw-medium" style="font-size: 0.65rem;">
                            ${getCountdown(e.date)}
                        </span>` : ''
                    }
                </div>
            </div>

            <div class="d-flex align-items-center gap-2">
                ${e.type === 'exam' ? `<span class="badge bg-primary rounded-pill">${progress}%</span>` : ''}
                <i data-lucide="chevron-down" style="width:16px" class="text-muted"></i>
            </div>
        </div>

        <div id="body-${e._id}" class="d-none px-3 pb-3">
            <hr class="mt-0">
            ${e.type === 'exam' ? `
                <div class="progress mb-2" style="height: 8px;"><div class="progress-bar" style="width: ${progress}%"></div></div>
                <div class="checklist mb-3">
                    ${e.subtasks.map((s, i) => `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" ${s.done ? 'checked' : ''} onchange="toggleSub('${e._id}', ${i})">
                            <label class="small ${s.done ? 'text-decoration-line-through text-muted' : ''}">${s.title}</label>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="d-flex justify-content-between">
                <button class="btn btn-sm text-danger p-0 fw-bold" onclick="deleteItem('${e._id}')">Delete</button>
                <button class="btn btn-sm ${isDone ? 'btn-secondary' : 'btn-success'} rounded-pill px-3" onclick="toggleStatus('${e._id}', '${e.status}')">
                    ${isDone ? 'Undo' : 'Complete'}
                </button>
            </div>
        </div>
    </div>`;

        if(e.type === 'exam' && examList) examList.innerHTML += cardHtml;
        else if(isDone && completedTasks) completedTasks.innerHTML += cardHtml;
        else if(activeTasks) activeTasks.innerHTML += cardHtml;
    });

   if(intel) {
    const exams = entries.filter(x => x.type === 'exam' && x.status === 'pending');
    
    intel.innerHTML = exams.length > 0 
        ? exams.map(ex => {
            // Map priority to border colors
            let borderColor = 'border-primary'; // Default Blue
            if (ex.priority === 'high') borderColor = 'border-danger';   // Red
            if (ex.priority === 'low') borderColor = 'border-success';   // Green

            return `
                <div class="p-3 bg-white rounded-4 border-start border-4 ${borderColor} shadow-sm mb-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="fw-bold mb-0">${ex.title}</h6>
                            <small class="text-muted">${ex.date}</small>
                        </div>
                        <div class="text-end">
                            <div class="small">${getCountdown(ex.date)}</div> </div>
                    </div>
                </div>`;
        }).join('')
        : `<div class="p-3 bg-white rounded-4 border-start border-4 border-primary shadow-sm">
             <small class="text-muted fw-bold">ALL CLEAR</small>
           </div>`;
}
    if (window.lucide) lucide.createIcons();
}

// --- CLOUD UTILITIES ---
async function toggleSub(entryId, subIndex) {
    await fetch(`${API_BASE}/subtask/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subIndex })
    });
    render();
}

let itemToDeleteId = null; // Global variable to track what we are deleting

// 1. Function called when clicking the "Delete" button on a card
async function deleteItem(id) {
    itemToDeleteId = id; // Store the ID
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
    if (window.lucide) lucide.createIcons(); // Refresh icons
}

// 2. Event listener for the actual "Delete Anyway" button inside the modal
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!itemToDeleteId) return;

    try {
        await fetch(`${API_BASE}/delete/${itemToDeleteId}`, { method: 'DELETE' });
        
        // Hide modal and refresh
        const modalEl = document.getElementById('deleteConfirmModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();

        notify("Entry deleted successfully", "danger");
        render(); // Reload the cards
    } catch (err) {
        notify("Error deleting item", "danger");
    } finally {
        itemToDeleteId = null; // Reset
    }
});

function handleSearch() {
    searchTerm = document.getElementById('mainSearch').value;
    render();
}
// / --- TIMER ---
function setTimer(m) { timeLeft = m * 60; updateTimerDisplay(); }

function updateTimerDisplay() {
    const el = document.getElementById('timer');
    if(!el) return;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    el.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function toggleTimer() {
    const ring = document.getElementById('timerRing');
    const btn = document.getElementById('timerBtn');
    if(!btn || !ring) return;

    if(isRunning) {
        clearInterval(timerInterval);
        ring.classList.remove('active');
        btn.innerText = "RESUME SESSION";
    } else {
        ring.classList.add('active');
        btn.innerText = "PAUSE";
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if(timeLeft <= 0) {
                clearInterval(timerInterval);
                notify("Focus session complete!");
                isRunning = false;
            }
        }, 1000);
    }
    isRunning = !isRunning;
}

// Helper to get the current logged-in user
function getActiveUser() {
    const data = localStorage.getItem('eduTrack_currentUser');
    return data ? JSON.parse(data) : null;
}

async function getFullPlannerStats() {
    const user = JSON.parse(localStorage.getItem('eduTrack_currentUser'));
    if (!user) return null;

    try {
        // We call a specific 'stats' endpoint that returns the pre-calculated numbers
        const response = await fetch(`${API_BASE}/stats/${user.id || user._id}`);
        const data = await response.json();
        
        return {
            overall: data.overall, // { total, done, percent, high, med, low }
            weekly: data.weekly,   // { done }
            streak: data.streak    // Pulled from the User document
        };
    } catch (err) {
        console.error("Error fetching cloud stats:", err);
        return null;
    }
}

// --- UPDATED TOGGLE STATUS (With Cloud Streak) ---
async function toggleStatus(id, currentStatus) {
    const user = getActiveUser(); // Get current user from localStorage
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    
    try {
        const response = await fetch(`${API_BASE}/update/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: user.id || user._id, 
                status: newStatus 
            })
        });

        const result = await response.json();
        
        // --- THIS IS WHERE YOU UPDATE THE STREAK ---
        if (result.updatedStreak !== null && result.updatedStreak !== undefined) {
            
            // 1. Update the UI element immediately
            const streakEl = document.getElementById('streakCount');
            if (streakEl) {
                streakEl.innerText = `${result.updatedStreak} Day Streak 🔥`;
            }

            // 2. Update LocalStorage so the streak stays updated if they refresh
            user.streak = result.updatedStreak;
            localStorage.setItem('eduTrack_currentUser', JSON.stringify(user));

            // 3. Optional: Show a nice notification
            if (newStatus === 'completed') {
                notify(`Consistency is key! Streak: ${result.updatedStreak}`, "success");
            }
        }
        
        render(); // Refresh the task lists
    } catch (err) {
        notify("Server error updating task", "danger");
    }
}



// --- DYNAMIC STARTUP ---
window.onload = async () => {
    const user = getActiveUser();
    const userId = user ? (user.id || user._id) : null;

    if (!userId || userId === "undefined") {
        console.warn("No valid user session found. Redirecting...");
        window.location.href = 'login.html';
        return;
    }

    try {
        await fetch(`${API_BASE}/sync-streak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId })
        });
    } catch (err) {
        console.error("Streak sync failed:", err);
    }

    render(); 
};
/**
 * CLOUD DATA BRIDGE (Overall + Weekly)
 * Fetches computed analytics directly from the MongoDB-backed API
 */
function getCountdown(dateString) {
    const examDate = new Date(dateString);
    const today = new Date();
    
    // Reset time to midnight for accurate day counting
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);

    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return `<span class="text-danger fw-bold">Today!</span>`;
    if (diffDays === 1) return `<span class="text-warning fw-bold">Tomorrow</span>`;
    if (diffDays < 0) return `<span class="text-muted">Completed</span>`;
    return `<span class="text-primary fw-bold">${diffDays} days left</span>`;
}
