// ──────────────────────────────────────────────
// EcoSort AI — AI Classifier
// ──────────────────────────────────────────────
const navbar = document.querySelector('.navbar-custom');
const navlinks = document.querySelectorAll('.nav-item');
const nTog = document.querySelector('.navbar .container .navbar-toggler i');
const handleScroll = ()=>{
    if(window.scrollY>8){
        navbar.classList.add('navbar-scrolled');
        nTog.classList.add('new-toggler');
    }else{
        navbar.classList.remove('navbar-scrolled');
    }
};

window.addEventListener('scroll',handleScroll);
handleScroll();

let model       = null;
let classLabels = null;


// Tips modal state
let _currentTips     = null;
let _currentItemName = null;


const MODEL_PATH  = 'model/model.json';
const LABELS_PATH = 'model/class_labels.json';
const IMAGE_SIZE  = 224;

// ── Load Model When Page Opens ─────────────────
window.addEventListener('load', async () => {
    loadEcoScore();
    renderHistory(loadHistory());
    console.log('🌿 EcoSort AI loading...');
    updateStatusBadge('loading');
      loadScanCount(); 

    try {
        // Load class labels
        const res   = await fetch(LABELS_PATH);
        classLabels = await res.json();
        console.log('✅ Labels loaded:', classLabels);

        // Load TensorFlow.js model
        model = await tf.loadGraphModel(MODEL_PATH);
        console.log('✅ Model loaded!');

        // Warm up model with dummy input for faster first prediction
        const dummy = tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]);
        model.predict(dummy).dispose();
        dummy.dispose();

        updateStatusBadge('ready');

    } catch (err) {
        console.error('❌ Failed to load model:', err);
        updateStatusBadge('error');
    }
});

// ── Update the Live/Loading Badge ──────────────
function updateStatusBadge(status) {
    const badge = document.querySelector('.badge.bg-danger, .badge.bg-warning, .badge.bg-success');
    if (!badge) return;

    const states = {
        loading: {
            html : `<span class="spinner-grow spinner-grow-sm me-1"></span> Loading AI...`,
            from : ['bg-danger', 'bg-success'],
            to   : 'bg-warning'
        },
        ready: {
            html : `<span class="spinner-grow spinner-grow-sm me-1"></span> AI Ready`,
            from : ['bg-danger', 'bg-warning'],
            to   : 'bg-success'
        },
        error: {
            html : `⚠️ Model Error`,
            from : ['bg-warning', 'bg-success'],
            to   : 'bg-danger'
        }
    };

    const s = states[status];
    s.from.forEach(c => badge.classList.remove(c));
    badge.classList.add(s.to);
    badge.innerHTML = s.html;
}

// ── Analyse Button Click ───────────────────────
document.getElementById('analyseBtn').addEventListener('click', async () => {
    const img = document.getElementById('previewImage');

    if (!model) {
        alert('⏳ AI model is still loading. Please wait a moment!');
        return;
    }
    if (!img.src || img.classList.contains('d-none')) {
        alert('📸 Please upload an image or take a photo first!');
        return;
    }

    showLoadingState();

    // Small pause so loading spinner renders before heavy computation
    await new Promise(r => setTimeout(r, 100));

    try {
        const result = await classifyImage(img);
        displayResults(result);
    } catch (err) {
        console.error('Classification error:', err);
        alert('Something went wrong. Please try again!');
        resetResults();
    }
});

// ── Classify the Image ─────────────────────────
async function classifyImage(imgElement) {
    return tf.tidy(() => {
        // Convert image element to a tensor
        let tensor = tf.browser.fromPixels(imgElement);

        // Resize to 224x224
        tensor = tf.image.resizeBilinear(tensor, [IMAGE_SIZE, IMAGE_SIZE]);

        // Normalize 0-255 → 0-1
        tensor = tensor.div(255.0);

        // Add batch dimension [224,224,3] → [1,224,224,3]
        tensor = tensor.expandDims(0);

        // Run prediction
        const probs = model.predict(tensor).dataSync();

        // Find highest confidence class
        let maxProb = 0, maxIdx = 0;
        for (let i = 0; i < probs.length; i++) {
            if (probs[i] > maxProb) { maxProb = probs[i]; maxIdx = i; }
        }

        return {
            className  : classLabels[String(maxIdx)],
            confidence : (maxProb * 100).toFixed(1)
        };
    });
}

// ── Show Loading State ─────────────────────────
function showLoadingState() {
    document.getElementById('resultDefault').classList.add('d-none');
    document.getElementById('resultContent').classList.add('d-none');
    document.getElementById('resultLoading').classList.remove('d-none');

    const btn = document.getElementById('analyseBtn');
    btn.disabled  = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Analysing...`;
}

// ── Display Final Results ──────────────────────
function displayResults(result) {
    const confidence = parseFloat(result.confidence);
    const info       = WASTE_DATA[result.className];

    if (!info) { console.error('No data for:', result.className); return; }

    // ── Confidence Threshold Check ───────────────
    if (confidence < 60) {
        // Too uncertain — don't show a result
        showLowConfidenceWarning(result.confidence);
        return;
    }

     applyTheme(result.className);
    // ── Update result card ───────────────────────
    document.getElementById('resultIcon').className       = `bi ${info.icon}`;
    document.getElementById('resultName').textContent     = result.className;
    document.getElementById('resultTagText').textContent  = info.tag;
    document.getElementById('resultTag').style.background = info.tagColor;
    document.getElementById('resultConfidence').textContent = `${result.confidence}%`;

    // ── Confidence color coding ──────────────────
    // const confSpan = document.getElementById('resultConfidence');
    // if (confidence >= 75) {
    //     confSpan.className = 'fw-bold text-success';       // Green — confident
    // } else {
    //     confSpan.className = 'fw-bold text-warning';       // Yellow — caution
    // }
    // ── Confidence color coding + progress bar ───
    const confSpan = document.getElementById('resultConfidence');
    const confBar  = document.getElementById('confidenceBar');
    const confLabel = document.getElementById('confidenceLabel');

    // Set percentage text
    confSpan.textContent = `${result.confidence}%`;

    // Animate bar width after tiny delay so transition is visible
    setTimeout(() => {
        confBar.style.width = `${confidence}%`;
        confBar.setAttribute('aria-valuenow', confidence);
    }, 150);

    // Color and label based on confidence level
    if (confidence >= 75) {
        confSpan.className     = 'fw-bold text-success';
        confBar.style.background = 'linear-gradient(90deg, #10b981, #047857)';
        confLabel.textContent  = '✅ High Confidence';
        confLabel.className    = 'text-success fst-italic small';
    } else {
        confSpan.className     = 'fw-bold text-warning';
        confBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        confLabel.textContent  = '⚠️ Low Confidence — try a clearer image';
        confLabel.className    = 'text-warning fst-italic small';
    }








    // ── Caution banner for 60-74% confidence ────
    const cautionBanner = document.getElementById('cautionBanner');
    if (confidence < 75) {
        cautionBanner.classList.remove('d-none');           // Show warning
    } else {
        cautionBanner.classList.add('d-none');              // Hide warning
    }

    // ── Rebuild disposal tips ────────────────────
    // ── Store tips for modal & update trigger button ─
_currentTips     = info.tips;
_currentItemName = result.className;
const openBtn = document.getElementById('openTipsBtn');
if (openBtn) {
    openBtn.querySelector('.tips-trigger-text').textContent =
        `View Tips for ${result.className}`;
    openBtn.disabled = false;
}



    // ── Populate Environmental Impact ────────────
    document.getElementById('impactCo2').textContent          = info.impact.co2Saved;
    document.getElementById('impactWater').textContent        = info.impact.waterSaved;
    document.getElementById('impactRecyclability').textContent = info.impact.recyclability;
    document.getElementById('impactFact').textContent         = info.impact.fact;
    document.getElementById('impactSection').classList.remove('d-none');


    // ── Award EcoScore Points ────────────────────
    const basePoints = info.ecoPoints;
    let pointsEarned, toastMsg;

    if (confidence >= 75) {
        // Full points for confident scan
        pointsEarned = basePoints;
        toastMsg     = `${result.className} identified! Keep it up!`;
    } else {
        // Half points for low confidence scan
        pointsEarned = Math.round(basePoints / 2);
        toastMsg     = `Partial points — try a clearer image next time!`;
    }

    addEcoPoints(pointsEarned, toastMsg);
    addToHistory(result,pointsEarned);
    incrementScanCount(); 

    // ── Show result panels ───────────────────────
    document.getElementById('resultLoading').classList.add('d-none');
    document.getElementById('resultDefault').classList.add('d-none');
    document.getElementById('resultContent').classList.remove('d-none');

    // ── Re-enable button ─────────────────────────
    const btn = document.getElementById('analyseBtn');
    btn.disabled  = false;
    btn.innerHTML = `<i class="bi bi-magic me-2 fs-5"></i>Analyse Item Now`;
}

// ── Show Low Confidence Warning ──────────────────
function showLowConfidenceWarning(confidence) {
    // Hide loading, show default state with warning message
    document.getElementById('resultLoading').classList.add('d-none');
    document.getElementById('resultContent').classList.add('d-none');

    // Temporarily show a warning in the default panel
    const defaultPanel = document.getElementById('resultDefault');
    defaultPanel.classList.remove('d-none');
    defaultPanel.innerHTML = `
        <div class="display-3 text-warning mb-3 mt-2">
            <i class="bi bi-exclamation-triangle"></i>
        </div>
        <h3 class="fw-bold h4 text-warning mb-3">Image Not Clear Enough</h3>
        <p class="text-muted small mb-3">
            Confidence was only <strong>${confidence}%</strong> — 
            the AI isn't sure enough to give a reliable result.
        </p>
        <div class="px-3 py-2 rounded-3 text-start"
            style="background:rgba(245,158,11,0.1); border-left: 3px solid #f59e0b;">
            <small class="text-warning fw-bold">💡 Try these tips:</small><br>
            <small class="text-muted">
                • Make sure the item fills most of the frame<br>
                • Use good lighting, avoid shadows<br>
                • Try a different angle or closer view
            </small>
        </div>`;

    // Re-enable button
    const btn = document.getElementById('analyseBtn');
    btn.disabled  = false;
    btn.innerHTML = `<i class="bi bi-magic me-2 fs-5"></i>Analyse Item Now`;
}

// ── Reset Results to Default State ────────────
function resetResults() {
    document.getElementById('resultDefault').classList.remove('d-none');
    document.getElementById('resultContent').classList.add('d-none');
    document.getElementById('resultLoading').classList.add('d-none');
    document.getElementById('impactSection').classList.add('d-none');

       resetTheme();  
       
       const confBar   = document.getElementById('confidenceBar');
    const confLabel = document.getElementById('confidenceLabel');
    if (confBar)   confBar.style.width     = '0%';
    if (confLabel) confLabel.textContent   = '--';

    const btn = document.getElementById('analyseBtn');
    btn.disabled  = false;
    btn.innerHTML = `<i class="bi bi-magic me-2 fs-5"></i>Analyse Item Now`;

    // const btn = document.getElementById('analyseBtn');
    // btn.disabled  = false;
    // btn.innerHTML = `<i class="bi bi-magic me-2 fs-5"></i>Analyse Item Now`;
}


// ── Apply Category Color Theme ─────────────────
function applyTheme(className) {
    const info    = WASTE_DATA[className];
    if (!info || !info.theme) return;

    const theme         = info.theme;
    const resultsColumn = document.querySelector('.results-column');
    const resultImage   = document.querySelector('.result-image');

    if (!resultsColumn || !resultImage) return;

    // Update the top border gradient
    resultsColumn.style.setProperty(
        '--theme-gradient', theme.gradient
    );

    // Apply gradient to the ::before pseudo element via inline style
    // We use a data attribute trick since we can't set ::before via JS
    resultsColumn.setAttribute('data-theme-color', theme.border);

    // Update top accent bar color
    const styleId  = 'dynamic-theme-style';
    let styleEl    = document.getElementById(styleId);

    if (!styleEl) {
        styleEl    = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }

    // Inject dynamic CSS for the ::before pseudo element
    styleEl.textContent = `
        .results-column::before {
            background: ${theme.gradient} !important;
        }
        .result-image {
            background-color: ${theme.light} !important;
        }
    `;
}

// ── Reset Theme to Default Green ───────────────
function resetTheme() {
    const styleEl = document.getElementById('dynamic-theme-style');
    if (styleEl) {
        styleEl.textContent = `
            .results-column::before {
                background: linear-gradient(90deg,
                    #10b981, #34d399) !important;
            }
            .result-image {
                background-color: var(--eco-green-light) !important;
            }
        `;
    }
}


// ── EcoScore System ────────────────────────────

// Load saved score from localStorage on startup
// function loadEcoScore() {
//     const saved = localStorage.getItem('ecosort_score');
//     const score = saved ? parseInt(saved) : 0;
//     document.getElementById('ecoScoreValue').textContent = score;
//     return score;
// }

function loadEcoScore() {
    const saved = localStorage.getItem('ecosort_score');
    const score = saved ? parseInt(saved) : 0;
    document.getElementById('ecoScoreValue').textContent = score;
    updateLevelDisplay(score);             // ← Update level on load
    return score;
}

// ── EcoScore Level System ──────────────────────

// Define all levels
const ECO_LEVELS = [
    {
        min   : 0,
        max   : 100,
        emoji : '🌱',
        title : 'Eco Beginner',
        color : 'linear-gradient(135deg, #6EE7B7, #10B981)'
    },
    {
        min   : 101,
        max   : 300,
        emoji : '🌿',
        title : 'Green Learner',
        color : 'linear-gradient(135deg, #10B981, #047857)'
    },
    {
        min   : 301,
        max   : 600,
        emoji : '♻️',
        title : 'Recycling Pro',
        color : 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    },
    {
        min   : 601,
        max   : 1000,
        emoji : '🌍',
        title : 'Eco Champion',
        color : 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
    },
    {
        min   : 1001,
        max   : Infinity,
        emoji : '🏆',
        title : 'EcoSort Legend',
        color : 'linear-gradient(135deg, #FCD34D, #F59E0B)'
    }
];

// Get current level object based on score
function getCurrentLevel(score) {
    return ECO_LEVELS.find(
        level => score >= level.min && score <= level.max
    ) || ECO_LEVELS[0];
}

// Get next level object
function getNextLevel(score) {
    const currentIndex = ECO_LEVELS.findIndex(
        level => score >= level.min && score <= level.max
    );
    return ECO_LEVELS[currentIndex + 1] || null;
}

// Update level badge and progress bar
function updateLevelDisplay(score) {
    const current   = getCurrentLevel(score);
    const next      = getNextLevel(score);
    const badge     = document.getElementById('levelBadge');
    const bar       = document.getElementById('levelProgressBar');
    const nextLabel = document.getElementById('nextLevelLabel');

    // Update badge text and color
    badge.textContent      = `${current.emoji} ${current.title}`;
    badge.style.background = current.color;

    // Calculate progress percentage to next level
    if (next) {
        const range    = next.min - current.min;
        const progress = score - current.min;
        const percent  = Math.min(
            Math.round((progress / range) * 100), 100
        );

        bar.style.width          = `${percent}%`;
        bar.style.background     = current.color;
        nextLabel.textContent    = `${next.emoji} ${next.min - score}pts`;
        nextLabel.style.display  = '';

    } else {
        // Max level reached!
        bar.style.width         = '100%';
        bar.style.background    = current.color;
        nextLabel.textContent   = '👑 MAX';
        nextLabel.style.color   = '#F59E0B';
    }
}

// Check if score crossed a level threshold
function checkLevelUp(oldScore, newScore) {
    const oldLevel = getCurrentLevel(oldScore);
    const newLevel = getCurrentLevel(newScore);

    // If level changed — celebrate!
    if (oldLevel.title !== newLevel.title) {
        showLevelUpCelebration(newLevel);
    }
}

// Show level up celebration toast
function showLevelUpCelebration(level) {
    const toast   = document.getElementById('levelUpToast');
    const emoji   = document.getElementById('levelUpEmoji');
    const title   = document.getElementById('levelUpTitle');
    const message = document.getElementById('levelUpMessage');

    emoji.textContent   = level.emoji;
    title.textContent   = '🎉 Level Up!';
    message.textContent = `You are now a ${level.title}!`;

    // Show with animation
    toast.classList.remove('d-none');
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'all 0.4s ease';

    setTimeout(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateY(0)';
    }, 50);

    // Hide after 3.5 seconds
    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            toast.classList.add('d-none');
            toast.style.cssText = '';
        }, 400);
    }, 3500);
}



// ── Scan Counter System ────────────────────────

// Load saved scan count from localStorage
function loadScanCount() {
    const saved = localStorage.getItem('ecosort_scan_count');
    const count = saved ? parseInt(saved) : 0;
    document.getElementById('scanCountValue').textContent = count;
    return count;
}

// Increment scan count by 1
function incrementScanCount() {
    const current  = parseInt(
        localStorage.getItem('ecosort_scan_count') || '0'
    );
    const newCount = current + 1;

    // Save to localStorage
    localStorage.setItem('ecosort_scan_count', newCount);

    // Animate the number updating
    const el = document.getElementById('scanCountValue');
    el.style.transform  = 'scale(1.4)';
    el.style.transition = 'transform 0.2s ease';
    el.textContent      = newCount;

    // Bounce back to normal size
    setTimeout(() => {
        el.style.transform = 'scale(1)';
    }, 200);
}



// Add points and save to localStorage
// function addEcoPoints(points, message) {
//     // Get current score
//     const current = parseInt(
//         document.getElementById('ecoScoreValue').textContent
//     ) || 0;

//     // Calculate new score
//     const newScore = current + points;

//     // Update display with animation
//     animateScoreCount(current, newScore);

//     // Save to localStorage so it persists after refresh
//     localStorage.setItem('ecosort_score', newScore);

//     // Show the popup toast
//     showEcoToast(points, message);
// }

function addEcoPoints(points, message) {
    const current  = parseInt(
        document.getElementById('ecoScoreValue').textContent
    ) || 0;
    const newScore = current + points;

    animateScoreCount(current, newScore);
    localStorage.setItem('ecosort_score', newScore);
    showEcoToast(points, message);

    // Check if we leveled up and update display
    checkLevelUp(current, newScore);
    updateLevelDisplay(newScore);
}




// Animate the score counting up
function animateScoreCount(from, to) {
    const scoreEl  = document.getElementById('ecoScoreValue');
    const duration = 800;   // ms
    const steps    = 20;
    const increment = (to - from) / steps;
    let current = from;
    let step    = 0;

    const timer = setInterval(() => {
        step++;
        current += increment;
        scoreEl.textContent = Math.round(current);

        if (step >= steps) {
            scoreEl.textContent = to;
            clearInterval(timer);
        }
    }, duration / steps);
}

// Show the popup toast notification
function showEcoToast(points, message) {
    const toast       = document.getElementById('ecoToast');
    const toastPoints = document.getElementById('toastPoints');
    const toastMsg    = document.getElementById('toastMessage');

    toastPoints.textContent = `+${points} pts`;
    toastMsg.textContent    = message;

    // Show toast
    toast.classList.remove('d-none');
    toast.style.opacity   = '1';
    toast.style.transform = 'translateY(0)';

    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            toast.classList.add('d-none');
            toast.style.opacity   = '';
            toast.style.transform = '';
        }, 400);
    }, 3000);
}



// ── Scan History System ────────────────────────

// Load history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('ecosort_history');
    return saved ? JSON.parse(saved) : [];
}

// Save history to localStorage
function saveHistory(history) {
    localStorage.setItem('ecosort_history', JSON.stringify(history));
}

// Add a new scan to history
function addToHistory(result, pointsEarned) {
    const history = loadHistory();

    // Create new history entry
    const entry = {
        className  : result.className,
        confidence : result.confidence,
        points     : pointsEarned,
        timestamp  : Date.now(),          // Save exact time
        icon       : WASTE_DATA[result.className].icon,
        tag        : WASTE_DATA[result.className].tag,
        tagColor   : WASTE_DATA[result.className].tagColor
    };

    // Add to beginning of array (newest first)
    history.unshift(entry);

    // Keep only last 10 scans
    if (history.length > 10) history.pop();

    // Save and render
    saveHistory(history);
    renderHistory(history);
}

// Convert timestamp to "X mins ago" format
function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60)  return 'Just now';
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

// Render history cards to the page
function renderHistory(history) {
    const grid         = document.getElementById('historyGrid');
    const wrapper      = document.getElementById('historyScrollWrapper');
    const empty        = document.getElementById('historyEmpty');
    const clearBtn     = document.getElementById('clearHistoryBtn');

    if (history.length === 0) {
        // Show empty state
        wrapper.classList.add('d-none');
        empty.classList.remove('d-none');
        clearBtn.classList.add('d-none');
        return;
    }

    // Show grid wrapper, hide empty state
    wrapper.classList.remove('d-none');
    empty.classList.add('d-none');
    clearBtn.classList.remove('d-none');

    // Build all history cards
    grid.innerHTML = history.map((entry, index) => `
        <div class="col-12 col-sm-6 col-lg-4">
            <div class="bg-white rounded-4 p-4 shadow-sm h-100
                        border border-1 border-opacity-10"
                 style="border-color: #E5E7EB !important;
                        animation: fadeIn 0.3s ease ${index * 0.05}s both;">

                <!-- Header row -->
                <div class="d-flex justify-content-between
                            align-items-start mb-3">

                    <!-- Category icon + name -->
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle d-flex align-items-center
                                    justify-content-center"
                             style="width:42px; height:42px;
                                    background:${entry.tagColor}22;">
                            <i class="bi ${entry.icon} fs-5"
                               style="color:${entry.tagColor}"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-dark">
                                ${entry.className}
                            </div>
                            <small class="text-muted">
                                ${timeAgo(entry.timestamp)}
                            </small>
                        </div>
                    </div>

                    <!-- Points badge -->
                    <span class="badge rounded-pill px-3 py-2"
                          style="background: linear-gradient(135deg,
                                 #10b981, #047857); color:white;">
                        +${entry.points} pts
                    </span>
                </div>

                <!-- Stats row -->
                <div class="d-flex gap-2 mt-2">

                    <!-- Confidence -->
                    <div class="flex-fill text-center rounded-3 py-2 px-1"
                         style="background:#F9FAFB;">
                        <div class="fw-bold small ${
                            parseFloat(entry.confidence) >= 75
                            ? 'text-success' : 'text-warning'
                        }">
                            ${entry.confidence}%
                        </div>
                        <div style="font-size:0.7rem;"
                             class="text-muted">Confidence</div>
                    </div>

                    <!-- Tag -->
                    <div class="flex-fill text-center rounded-3 py-2 px-1"
                         style="background:#F9FAFB;">
                        <div class="fw-bold small text-dark"
                             style="font-size:0.75rem;">
                            ${entry.tag}
                        </div>
                        <div style="font-size:0.7rem;"
                             class="text-muted">Category</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Clear all history
document.getElementById('clearHistoryBtn')
    .addEventListener('click', () => {
        if (confirm('Clear all scan history? This cannot be undone.')) {
            localStorage.removeItem('ecosort_history');
            renderHistory([]);
        }
    });





    // ── Tips Modal System ──────────────────────────

/**
 * Opens the tips modal and populates it with _currentTips.
 */
function openTipsModal() {
    const overlay  = document.getElementById('tipsModal');
    const list     = document.getElementById('tipsModalList');
    const subtitle = document.getElementById('tipsModalItemName');

    // Update subtitle
    subtitle.textContent = _currentItemName
        ? `Tips for: ${_currentItemName}`
        : 'Scan an item to get personalised tips';

    // Build tip items
    list.innerHTML = '';

    if (!_currentTips || _currentTips.length === 0) {
        list.innerHTML = `
            <div class="tips-modal-empty">
                <div><i class="bi bi-lightbulb"></i></div>
                <p class="mt-3 mb-0">Scan an item first to see disposal tips here.</p>
            </div>`;
    } else {
        _currentTips.forEach(tip => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="tip-icon-wrap ${tip.bg} bg-opacity-10">
                    <i class="bi ${tip.icon} fs-4" style="color:inherit"></i>
                </div>
                <div>
                    <div class="tip-title">${tip.title}</div>
                    <div class="tip-desc">${tip.desc}</div>
                </div>`;
            list.appendChild(li);
        });
    }

    // Show overlay with animation
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the tips modal.
 */
function closeTipsModal() {
    const overlay = document.getElementById('tipsModal');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
}

// Open button
document.getElementById('openTipsBtn')
    .addEventListener('click', openTipsModal);

// Close button (×)
document.getElementById('closeTipsBtn')
    .addEventListener('click', closeTipsModal);

// Click on the darkened overlay backdrop (outside the card)
document.getElementById('tipsModal')
    .addEventListener('click', function (e) {
        if (e.target === this) closeTipsModal();
    });

// Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeTipsModal();
});