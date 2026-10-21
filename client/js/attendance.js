const dummyUser = {
    id: "6580f1e8c1d3a52b8c8b4567",
    name: "Test Mode User"
};

if (!localStorage.getItem('eduTrack_currentUser')) {
    localStorage.setItem('eduTrack_currentUser', JSON.stringify(dummyUser));
    console.log("Dummy user injected into LocalStorage");
}

document.addEventListener('DOMContentLoaded', () => {
    loadAttendance();
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

function notify(msg) {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toastMsg');
    if (toastEl && toastBody) {
        toastBody.innerText = msg;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
}

/**
 * 1. GENERATE & SAVE TO CLOUD
 */
async function generateSchedule() {
    const user = JSON.parse(localStorage.getItem('eduTrack_currentUser'));
    const name = document.getElementById('subName').value;
    const startStr = document.getElementById('startDate').value;
    const endStr = document.getElementById('endDate').value;
    const selectedDays = Array.from(document.querySelectorAll('#dayPicker input:checked')).map(cb => parseInt(cb.value));

    if (!name || !startStr || !endStr || selectedDays.length === 0) {
        alert("Please fill all fields.");
        return;
    }

    // --- Your Original Logic for generating dates ---
    const start = new Date(startStr);
    const end = new Date(endStr);
    let generatedDates = [];
    let current = new Date(start);

    while (current <= end) {
        if (selectedDays.includes(current.getDay())) {
            generatedDates.push({
                date: current.toLocaleDateString('en-GB'),
                status: 'pending' 
            });
        }
        current.setDate(current.getDate() + 1);
    }

    // --- CLOUD SAVE ---
    try {
        await fetch('${window.API_ATTENDANCE}/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                subjectName: name,
                dates: generatedDates
            })
        });

        // UI Reset
        const modal = bootstrap.Modal.getInstance(document.getElementById('setupSubjectModal'));
        modal.hide();
        document.getElementById('subName').value = '';
        document.querySelectorAll('#dayPicker input').forEach(cb => cb.checked = false);
        
        notify(`${name} schedule created!`);
        loadAttendance();
    } catch (err) {
        console.error("Save failed", err);
    }
}

/**
 * 2. LOAD FROM CLOUD
 */
async function loadAttendance() {
    const userJson = localStorage.getItem('eduTrack_currentUser');
    const grid = document.getElementById('attendanceGrid');
    if (!grid) return;

    const user = JSON.parse(userJson);
    const userId = user.id || user._id;

    if (!userId || userId === "undefined") {
        grid.innerHTML = '<div class="alert alert-danger">Session Error: Please log out and log back in.</div>';
        return;
    }

    try {
        // Calling: /api/attendance/USER_ID
        const response = await fetch(`${window.API_ATTENDANCE}/${userId}`);
        const subjects = await response.json();

        if (!response.ok) throw new Error(subjects.message || "Failed to fetch");

        grid.innerHTML = '';

        if (!Array.isArray(subjects) || subjects.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center py-5 text-muted">No schedules found.</div>';
            return;
        }

        subjects.forEach((sub) => {
            const present = sub.dates.filter(d => d.status === 'present').length;
            const absent = sub.dates.filter(d => d.status === 'absent').length;
            const totalConsidered = present + absent;
            const perc = totalConsidered === 0 ? 0 : Math.round((present / totalConsidered) * 100);
            const color = perc < 75 ? '#ef4444' : (perc < 85 ? '#f59e0b' : '#10b981');

            grid.innerHTML += `
                <div class="col-lg-6 mb-4">
                    <div class="card border-0 shadow-sm overflow-hidden" style="border-radius: 28px;">
                        <div class="p-4 bg-white d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="fw-bold mb-0 text-capitalize">${sub.subjectName}</h5>
                                <small class="text-primary fw-bold">${sub.dates.length} Sessions</small>
                            </div>
                            <div class="progress-circle shadow-sm" style="--p:${perc}; --c:${color}">
                                <span>${perc}%</span>
                            </div>
                        </div>
                        <div class="date-list-container p-3 pt-0" style="max-height: 250px; overflow-y: auto; background: #fafafa;">
                            ${sub.dates.map((d, dIdx) => `
                                <div class="d-flex align-items-center justify-content-between p-2 px-3 mb-2 bg-white" style="border-radius: 16px; border: 1px solid #f1f5f9;">
                                    <div class="small fw-bold text-dark">${d.date}</div>
                                    <div class="status-group">
                                        <button class="btn-status btn-present ${d.status === 'present' ? 'active' : ''}" onclick="updateStatus('${sub._id}', ${dIdx}, 'present')">P</button>
                                        <button class="btn-status btn-absent ${d.status === 'absent' ? 'active' : ''}" onclick="updateStatus('${sub._id}', ${dIdx}, 'absent')">A</button>
                                        <button class="btn-status btn-suspended ${d.status === 'suspended' ? 'active' : ''}" onclick="updateStatus('${sub._id}', ${dIdx}, 'suspended')">S</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="p-3 d-flex gap-2 bg-white border-top">
                            <button class="btn btn-soft-primary w-100 rounded-pill btn-sm fw-bold" onclick="openExtraClassModal('${sub._id}')">Extra Class</button>
                            <button class="btn btn-outline-danger w-100 rounded-pill btn-sm fw-bold" onclick="openDeleteModal('${sub._id}')">Delete</button>
                        </div>
                    </div>
                </div>`;
        });
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error("Network error:", err);
        grid.innerHTML = '<div class="col-12 text-center py-5 text-danger">Cannot connect to server.</div>';
    }
}

/**
 * 3. UPDATE STATUS (P/A/S)
 */
async function updateStatus(subId, dIdx, status) {
    try {
        await fetch('${window.API_ATTENDANCE}/update-status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjectId: subId, dateIndex: dIdx, status: status })
        });
        loadAttendance(); // Recalculate %
    } catch (err) {
        console.error("Update failed", err);
    }
}

/**
 * 4. EXTRA CLASS
 */
function openExtraClassModal(id) {
    document.getElementById('activeSubIdx').value = id; // This is now a MongoDB _id
    const modal = new bootstrap.Modal(document.getElementById('extraClassModal'));
    modal.show();
}

async function confirmExtraClass() {
    const id = document.getElementById('activeSubIdx').value;
    const dateVal = document.getElementById('extraClassDate').value;
    if (!dateVal) return;

    const formattedDate = new Date(dateVal).toLocaleDateString('en-GB');

    try {
        await fetch('${window.API_ATTENDANCE}/extra-class', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjectId: id, date: formattedDate })
        });
        bootstrap.Modal.getInstance(document.getElementById('extraClassModal')).hide();
        notify("Extra session added!");
        loadAttendance();
    } catch (err) {
        console.error("Extra class failed", err);
    }
}

/**
 * 5. DELETE SUBJECT
 */
function openDeleteModal(id) {
    document.getElementById('deleteSubIdx').value = id;
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
}

async function confirmDelete() {
    const id = document.getElementById('deleteSubIdx').value;
    try {
        await fetch('${window.API_ATTENDANCE}/${id}', { method: 'DELETE' });
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        notify("Subject removed.");
        loadAttendance();
    } catch (err) {
        console.error("Delete failed", err);
    }
}
/**
 * ATTENDANCE REPORT GENERATOR (Cloud Version)
 * Fetches data from MongoDB and calculates summaries
 */

/**
 * GENERATE ATTENDANCE SUMMARY
 * Processes the raw subject data into a readable report
 */
