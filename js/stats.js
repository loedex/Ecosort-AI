// ──────────────────────────────────────────────
// EcoSort AI — Statistics Dashboard
// Reads from localStorage and renders all stats
// ──────────────────────────────────────────────

// ── Level definitions (same as app.js) ─────────
const ECO_LEVELS = [
    { min:0,    max:100,      emoji:'🌱', title:'Eco Beginner'  },
    { min:101,  max:300,      emoji:'🌿', title:'Green Learner' },
    { min:301,  max:600,      emoji:'♻️',  title:'Recycling Pro' },
    { min:601,  max:1000,     emoji:'🌍', title:'Eco Champion'  },
    { min:1001, max:Infinity, emoji:'🏆', title:'EcoSort Legend'}
];

// CO2 values per category (kg per item)
const CO2_VALUES = {
    Glass   : 0.3,
    Metal   : 0.8,
    Organic : 0.5,
    Paper   : 0.2,
    Plastic : 0.6
};

// Category icons
const CATEGORY_ICONS = {
    Glass   : { emoji:'🪟', color:'#3B82F6' },
    Metal   : { emoji:'⚙️',  color:'#F59E0B' },
    Organic : { emoji:'🍃', color:'#10B981' },
    Paper   : { emoji:'📄', color:'#60A5FA' },
    Plastic : { emoji:'🧴', color:'#8B5CF6' }
};

// ── Load all data from localStorage ─────────────
function loadAllData() {
    return {
        score   : parseInt(
            localStorage.getItem('ecosort_score') || '0'
        ),
        scans   : parseInt(
            localStorage.getItem('ecosort_scan_count') || '0'
        ),
        history : JSON.parse(
            localStorage.getItem('ecosort_history') || '[]'
        )
    };
}

// ── Get current level ────────────────────────────
function getLevel(score) {
    return ECO_LEVELS.find(
        l => score >= l.min && score <= l.max
    ) || ECO_LEVELS[0];
}

// ── Calculate total CO2 saved ────────────────────
function calcCo2(history) {
    return history.reduce((total, entry) => {
        return total + (CO2_VALUES[entry.className] || 0);
    }, 0).toFixed(1);
}

// ── Build category counts ────────────────────────
function buildCategoryCounts(history) {
    const counts = {};
    history.forEach(entry => {
        counts[entry.className] =
            (counts[entry.className] || 0) + 1;
    });
    return counts;
}

// ── Calculate high confidence rate ──────────────
function calcAccuracyRate(history) {
    if (history.length === 0) return 0;
    const highConf = history.filter(
        e => parseFloat(e.confidence) >= 75
    ).length;
    return Math.round((highConf / history.length) * 100);
}

// ── Render Summary Cards ─────────────────────────
function renderSummaryCards(data) {
    const level = getLevel(data.score);

    document.getElementById('statTotalScans').textContent =
        data.scans;
    document.getElementById('statEcoScore').textContent   =
        data.score;
    document.getElementById('statCo2').textContent        =
        calcCo2(data.history);
    document.getElementById('statLevelEmoji').textContent =
        level.emoji;
    document.getElementById('statLevelName').textContent  =
        level.title;
}

// ── Render Category Breakdown ────────────────────
function renderCategoryBreakdown(history) {
    const container = document.getElementById('categoryBreakdown');

    if (history.length === 0) {
        container.innerHTML = `
            <p class="text-muted text-center py-4">
                No scans yet — start scanning to see breakdown!
            </p>`;
        return;
    }

    const counts = buildCategoryCounts(history);
    const total  = history.length;

    // Sort by count descending
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1]);

    container.innerHTML = sorted.map(([category, count]) => {
        const percent = Math.round((count / total) * 100);
        const info    = CATEGORY_ICONS[category] || 
                        { emoji:'♻️', color:'#10B981' };

        return `
        <div class="mb-4">
            <div class="d-flex justify-content-between
                align-items-center mb-2">
                <span class="fw-600 d-flex align-items-center gap-2">
                    <span>${info.emoji}</span>
                    <span class="fw-bold">${category}</span>
                </span>
                <span class="text-muted small">
                    ${count} scan${count > 1 ? 's' : ''}
                    (${percent}%)
                </span>
            </div>
            <div class="progress rounded-pill"
                style="height:12px; background:#F3F4F6;">
                <div class="progress-bar rounded-pill"
                    style="width:${percent}%;
                           background:${info.color};
                           transition:width 1s ease;">
                </div>
            </div>
        </div>`;
    }).join('');
}

// ── Render Top Category ──────────────────────────
function renderTopCategory(history) {
    if (history.length === 0) return;

    const counts  = buildCategoryCounts(history);
    const top     = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])[0];

    if (!top) return;

    const [category, count] = top;
    const info = CATEGORY_ICONS[category] ||
                 { emoji:'♻️', color:'#10B981' };

    document.getElementById('topCategoryEmoji').textContent =
        info.emoji;
    document.getElementById('topCategoryName').textContent  =
        category;
    document.getElementById('topCategoryCount').textContent =
        `Scanned ${count} time${count > 1 ? 's' : ''}`;

    // Update background color
    document.getElementById('topCategoryDisplay')
        .style.background = `${info.color}15`;
}

// ── Render Accuracy Rate ─────────────────────────
function renderAccuracyRate(history) {
    const rate = calcAccuracyRate(history);
    document.getElementById('accuracyRate').textContent =
        `${rate}%`;

    // Animate bar after short delay
    setTimeout(() => {
        document.getElementById('accuracyBar').style.width =
            `${rate}%`;
    }, 300);
}

// ── Render Recent Activity Timeline ─────────────
function renderRecentActivity(history) {
    const container = document.getElementById('recentActivity');

    if (history.length === 0) {
        container.innerHTML = `
            <p class="text-muted text-center py-4">
                No recent activity yet!
            </p>`;
        return;
    }

    // Show last 5 scans as a timeline
    const recent = history.slice(0, 5);

    container.innerHTML = `
        <div class="d-flex flex-column gap-3">
            ${recent.map((entry, index) => {
                const info = CATEGORY_ICONS[entry.className] ||
                             { emoji:'♻️', color:'#10B981' };
                const conf = parseFloat(entry.confidence);
                const confColor = conf >= 75
                    ? '#10B981' : '#F59E0B';
                const time = timeAgo(entry.timestamp);

                return `
                <div class="d-flex align-items-center gap-3
                    p-3 rounded-3"
                    style="background:#F9FAFB;
                           animation:fadeIn 0.3s ease
                           ${index * 0.1}s both;">

                    <!-- Icon -->
                    <div class="rounded-circle d-flex
                        align-items-center justify-content-center
                        flex-shrink-0"
                        style="width:46px; height:46px;
                               background:${info.color}20;">
                        <span style="font-size:1.3rem;">
                            ${info.emoji}
                        </span>
                    </div>

                    <!-- Info -->
                    <div class="flex-fill">
                        <div class="fw-bold text-dark">
                            ${entry.className}
                        </div>
                        <small class="text-muted">${time}</small>
                    </div>

                    <!-- Confidence -->
                    <div class="text-end">
                        <div class="fw-bold"
                            style="color:${confColor};">
                            ${entry.confidence}%
                        </div>
                        <small class="text-muted">confidence</small>
                    </div>

                    <!-- Points -->
                    <div class="badge rounded-pill px-3 py-2"
                        style="background:linear-gradient(
                               135deg,#10b981,#047857);
                               color:white; white-space:nowrap;">
                        +${entry.points} pts
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}

// ── Time ago helper ──────────────────────────────
function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60)   return 'Just now';
    if (seconds < 3600) {
        const m = Math.floor(seconds / 60);
        return `${m} min${m > 1 ? 's' : ''} ago`;
    }
    if (seconds < 86400) {
        const h = Math.floor(seconds / 3600);
        return `${h} hour${h > 1 ? 's' : ''} ago`;
    }
    const d = Math.floor(seconds / 86400);
    return `${d} day${d > 1 ? 's' : ''} ago`;
}

// ── Reset All Data ───────────────────────────────
document.getElementById('resetAllData')
    .addEventListener('click', () => {
        if (confirm(
            '⚠️ This will delete ALL your scores, scans and history.\n\nAre you sure?'
        )) {
            localStorage.removeItem('ecosort_score');
            localStorage.removeItem('ecosort_scan_count');
            localStorage.removeItem('ecosort_history');
            alert('✅ All data cleared! Starting fresh!');
            location.reload();
        }
    });

// ── Initialize Dashboard ─────────────────────────
window.addEventListener('load', () => {
    const data = loadAllData();

    renderSummaryCards(data);
    renderCategoryBreakdown(data.history);
    renderTopCategory(data.history);
    renderAccuracyRate(data.history);
    renderRecentActivity(data.history);

    console.log('📊 Stats dashboard loaded!');
    console.log('   Total scans   :', data.scans);
    console.log('   EcoScore      :', data.score);
    console.log('   History items :', data.history.length);
});