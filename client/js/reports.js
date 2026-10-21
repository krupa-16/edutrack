// Register the datalabels plugin globally for Chart.js
Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    const user = JSON.parse(localStorage.getItem('eduTrack_currentUser'));
    if (!user) return window.location.href = 'login.html';

    const userId = user.id || user._id;
    document.getElementById('reportDate').innerText = `Generated: ${new Date().toLocaleDateString('en-GB')}`;
    
    await fetchReportData(userId);
});

async function fetchReportData(userId) {
    try {
        const [attRes, planStatsRes, planTasksRes] = await Promise.all([
            fetch(`${window.API_ATTENDANCE}/${userId}`),
            fetch(`${window.API_PLANNER}/stats/${userId}`),
            fetch(`${window.API_PLANNER}/${userId}`)
        ]);

        if (attRes.ok) renderAttendanceSection(await attRes.json());
        if (planStatsRes.ok && planTasksRes.ok) {
            renderPlannerSection(await planStatsRes.json(), await planTasksRes.json());
        }
    } catch (err) {
        console.error("Backend fetch error:", err);
    }
}

function renderAttendanceSection(data) {
    const labels = [];
    const values = [];
    let totalPerc = 0;
    let html = '';

    data.forEach(item => {
        const present = item.dates.filter(d => d.status === 'present').length;
        const total = item.dates.filter(d => d.status !== 'pending').length;
        const perc = total > 0 ? Math.round((present / total) * 100) : 0;
        
        labels.push(item.subjectName);
        values.push(perc);
        totalPerc += perc;

        const statusClass = perc >= 85 ? 'perc-high' : (perc >= 75 ? 'perc-mid' : 'perc-low');
        html += `
            <tr>
                <td class="ps-4 fw-bold text-capitalize">${item.subjectName}</td>
                <td class="text-center small text-muted">${present} / ${total} Present</td>
                <td class="text-end pe-4"><span class="perc-badge ${statusClass}">${perc}%</span></td>
            </tr>`;
    });

    const avg = data.length > 0 ? Math.round(totalPerc / data.length) : 0;
    document.getElementById('kpiAttendance').innerText = `${avg}%`;
    document.getElementById('kpiAttBar').style.width = `${avg}%`;
    document.getElementById('kpiAttSub').innerText = `Average across ${data.length} subjects`;
    document.getElementById('attendanceDetailsBody').innerHTML = html;

    // --- CHART WITH TOP LABELS ---
    const ctx = document.getElementById('attendanceBarChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Attendance %',
                data: values,
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderRadius: 8,
                barThickness: 40
            }]
        },
        
options: {
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: (value) => value + '%', // Shows % on top of bars
            font: { weight: 'bold', size: 12 },
            color: '#4f46e5' 
        }
    },
    scales: {
        y: { beginAtZero: true, max: 110, display: false } // max: 110 gives room for the label
    }
}
    });
}

function renderPlannerSection(stats, tasks) {
    document.getElementById('kpiCompletion').innerText = `${stats.overall.percent}%`;
    document.getElementById('kpiCompBar').style.width = `${stats.overall.percent}%`;
    document.getElementById('kpiDoneCount').innerText = `${stats.overall.done} Done`;
    document.getElementById('kpiPendingCount').innerText = `${stats.overall.total - stats.overall.done} Pending`;
    document.getElementById('kpiStreak').innerText = stats.streak || 0;

    const pending = tasks.filter(t => t.status === 'pending');
    const prio = { high: 0, medium: 0, low: 0 };
    pending.forEach(t => prio[t.priority]++);

    const ctx = document.getElementById('plannerDoughnutChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Med', 'Low'],
            datasets: [{
                data: [prio.high, prio.medium, prio.low],
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
            }]
        },
        options: { cutout: '75%', maintainAspectRatio: false }
    });
}

// Register the datalabels plugin globally for Chart.js
Chart.register(ChartDataLabels);

document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    const user = JSON.parse(localStorage.getItem('eduTrack_currentUser'));
    if (!user) return window.location.href = 'login.html';

    const userId = user.id || user._id;
    document.getElementById('reportDate').innerText = `Generated: ${new Date().toLocaleDateString('en-GB')}`;
    
    await fetchReportData(userId);
});

async function fetchReportData(userId) {
    try {
        const [attRes, planStatsRes, planTasksRes] = await Promise.all([
            fetch(`${window.API_ATTENDANCE}/${userId}`),
            fetch(`${window.API_PLANNER}/stats/${userId}`),
            fetch(`${window.API_PLANNER}/${userId}`)
        ]);

        if (attRes.ok) renderAttendanceSection(await attRes.json());
        if (planStatsRes.ok && planTasksRes.ok) {
            renderPlannerSection(await planStatsRes.json(), await planTasksRes.json());
        }
    } catch (err) {
        console.error("Backend fetch error:", err);
    }
}

function renderAttendanceSection(data) {
    const labels = [];
    const values = [];
    let totalPerc = 0;
    let html = '';

    data.forEach(item => {
        const present = item.dates.filter(d => d.status === 'present').length;
        const total = item.dates.filter(d => d.status !== 'pending').length;
        const perc = total > 0 ? Math.round((present / total) * 100) : 0;
        
        labels.push(item.subjectName);
        values.push(perc);
        totalPerc += perc;

        const statusClass = perc >= 85 ? 'perc-high' : (perc >= 75 ? 'perc-mid' : 'perc-low');
        html += `
            <tr>
                <td class="ps-4 fw-bold text-capitalize">${item.subjectName}</td>
                <td class="text-center small text-muted">${present} / ${total} Present</td>
                <td class="text-end pe-4"><span class="perc-badge ${statusClass}">${perc}%</span></td>
            </tr>`;
    });

    const avg = data.length > 0 ? Math.round(totalPerc / data.length) : 0;
    document.getElementById('kpiAttendance').innerText = `${avg}%`;
    document.getElementById('kpiAttBar').style.width = `${avg}%`;
    document.getElementById('kpiAttSub').innerText = `Average across ${data.length} subjects`;
    document.getElementById('attendanceDetailsBody').innerHTML = html;

    // --- CHART WITH TOP LABELS ---
    const ctx = document.getElementById('attendanceBarChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Attendance %',
                data: values,
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => value + '%',
                    font: { weight: 'bold', size: 12 },
                    color: '#4f46e5'
                }
            },
            scales: {
                y: { beginAtZero: true, max: 115, display: false }, // Hide axis to make it cleaner
                x: { grid: { display: false } }
            }
        }
    });
}

function renderPlannerSection(stats, tasks) {
    document.getElementById('kpiCompletion').innerText = `${stats.overall.percent}%`;
    document.getElementById('kpiCompBar').style.width = `${stats.overall.percent}%`;
    document.getElementById('kpiDoneCount').innerText = `${stats.overall.done} Done`;
    document.getElementById('kpiPendingCount').innerText = `${stats.overall.total - stats.overall.done} Pending`;
    document.getElementById('kpiStreak').innerText = stats.streak || 0;

    const pending = tasks.filter(t => t.status === 'pending');
    const prio = { high: 0, medium: 0, low: 0 };
    pending.forEach(t => prio[t.priority]++);

    const ctx = document.getElementById('plannerDoughnutChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Med', 'Low'],
            datasets: [{
                data: [prio.high, prio.medium, prio.low],
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
            }]
        },
       // Look for the Doughnut Chart config
options: {
    maintainAspectRatio: false,
    plugins: {
        datalabels: {
            color: '#fff',
            font: { weight: 'bold', size: 11 },
            formatter: (value, ctx) => {
                let sum = 0;
                let dataArr = ctx.chart.data.datasets[0].data;
                dataArr.map(data => sum += data); // Calculate total tasks
                let percentage = (value * 100 / sum).toFixed(0) + "%";
                return sum > 0 ? percentage : ""; // Shows % inside the slice
            }
        }
    }
}
    });
}

function exportToPDF() {
    const element = document.getElementById('printableArea');
    html2pdf().from(element).save('EduTrack_Academic_Audit.pdf');
}