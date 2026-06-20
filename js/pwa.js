// ──────────────────────────────────────────────
// EcoSort AI — PWA Install Handler
// Manages the install prompt and UI
// ──────────────────────────────────────────────

let deferredPrompt = null;
const installBtn   = document.getElementById('installBtn');

// ── Catch the install prompt ─────────────────────
// Browser fires this when app is installable
window.addEventListener('beforeinstallprompt', (event) => {
    console.log('📲 Install prompt available!');

    // Prevent browser's default mini-infobar
    event.preventDefault();

    // Save for later use
    deferredPrompt = event;

    // Show our custom install button
    if (installBtn) {
        installBtn.classList.remove('d-none');
        installBtn.classList.add('d-flex');

        // Animate button appearance
        installBtn.style.animation = 'fadeIn 0.5s ease';
    }
});

// ── Handle Install Button Click ──────────────────
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        // Show the browser's install dialog
        deferredPrompt.prompt();

        // Wait for user's choice
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('✅ User installed EcoSort AI!');
            installBtn.innerHTML =
                `<i class="bi bi-check-circle me-2 text-success"></i>
                 App Installed!`;
            installBtn.disabled = true;

        } else {
            console.log('ℹ️ User dismissed install prompt');
        }

        // Clear the prompt — can only use once
        deferredPrompt = null;
    });
}

// ── App Successfully Installed ───────────────────
window.addEventListener('appinstalled', () => {
    console.log('🎉 EcoSort AI was installed!');

    // Hide install button
    if (installBtn) {
        installBtn.classList.add('d-none');
    }
});

// ── Check if Already Running as PWA ─────────────
function isRunningAsPWA() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

// If already installed as PWA — hide install button
if (isRunningAsPWA()) {
    console.log('📱 Running as installed PWA!');
    if (installBtn) installBtn.classList.add('d-none');
}