// ──────────────────────────────────────────────
// EcoSort AI — Recycling Center Map
// Uses local JSON dataset + Leaflet.js
// ──────────────────────────────────────────────

let map           = null;
let userMarker    = null;
let radiusCircle  = null;
let centerMarkers = [];
let userLocation  = null;
let allCenters    = [];
let centersData   = null;

// ── Waste type colors ──────────────────────────
const TYPE_COLORS = {
    Plastic   : '#8B5CF6',
    Paper     : '#3B82F6',
    Metal     : '#F59E0B',
    Glass     : '#06B6D4',
    Organic   : '#10B981',
    General   : '#6B7280'
};

// ── Load local centers data ────────────────────
async function loadCentersData() {
    try {
        const response = await fetch('data/centers.json');
        centersData    = await response.json();
        console.log(`✅ Loaded ${centersData.centers.length}
            centers for ${centersData.city}`);
    } catch (err) {
        console.error('Failed to load centers data:', err);
    }
}

// ── Calculate distance between two coords ──────
function getDistance(lat1, lng1, lat2, lng2) {
    const R    = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a    =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) *
        Math.cos(lat2 * Math.PI/180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    return (6371 * 2 *
        Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    ).toFixed(1);
}

// ── Initialize map ─────────────────────────────
function initMap(lat, lng) {
    document.getElementById('mapLoading')
        .classList.add('d-none');
    document.getElementById('map')
        .classList.remove('d-none');

    if (!map) {
        map = L.map('map', {
            zoomControl    : true,
            scrollWheelZoom: true
        }).setView([lat, lng], 13);

        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '© OpenStreetMap contributors',
                maxZoom    : 19
            }
        ).addTo(map);

    } else {
        map.setView([lat, lng], 13);
    }
}

// ── Add user location marker ───────────────────
function addUserMarker(lat, lng) {
    if (userMarker)   map.removeLayer(userMarker);
    if (radiusCircle) map.removeLayer(radiusCircle);

    const userIcon = L.divIcon({
        html      : `<div class="user-marker"></div>`,
        className : '',
        iconSize  : [18, 18],
        iconAnchor: [9, 9]
    });

    userMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>📍 You are here</b>')
        .openPopup();

    const radius = parseInt(
        document.getElementById('radiusFilter').value
    ) * 1000;

    radiusCircle = L.circle([lat, lng], {
        radius   : radius,
        className: 'radius-circle'
    }).addTo(map);
}

// ── Filter and display centers ─────────────────
function searchCenters(lat, lng) {
    if (!centersData) {
        alert('Center data not loaded yet. Please wait!');
        return;
    }

    const wasteFilter = document.getElementById(
        'wasteFilter'
    ).value;
    const radiusKm    = parseInt(
        document.getElementById('radiusFilter').value
    );

    // Show loading
    document.getElementById('resultsEmpty')
        .classList.add('d-none');
    document.getElementById('resultsLoading')
        .classList.remove('d-none');
    document.getElementById('centersList')
        .classList.add('d-none');

    // Filter by distance and waste type
    allCenters = centersData.centers
        .map(center => ({
            ...center,
            distance: getDistance(
                lat, lng, center.lat, center.lng
            )
        }))
        .filter(center => {
            // Distance filter
            if (parseFloat(center.distance) > radiusKm)
                return false;

            // Waste type filter
            if (wasteFilter === 'all') return true;

            const filterName =
                wasteFilter.charAt(0).toUpperCase() +
                wasteFilter.slice(1);

            return center.accepts.some(a =>
                a.toLowerCase() ===
                wasteFilter.toLowerCase() ||
                a === 'General'
            );
        })
        .sort((a, b) =>
            parseFloat(a.distance) - parseFloat(b.distance)
        );

    // Small delay so loading UI shows
    setTimeout(() => displayCenters(allCenters), 300);
}

// ── Display centers on map + list ─────────────
function displayCenters(centers) {
    // Clear old markers
    centerMarkers.forEach(m => map.removeLayer(m));
    centerMarkers = [];

    document.getElementById('resultsLoading')
        .classList.add('d-none');

    // Update count
    document.getElementById('centerCount')
        .textContent = centers.length;

    if (centers.length === 0) {
        document.getElementById('resultsEmpty')
            .classList.remove('d-none');
        document.getElementById('resultsEmpty').innerHTML = `
            <div class="display-4 mb-3">🔍</div>
            <p class="text-muted small fw-bold">
                No centers found in this radius
            </p>
            <p class="text-muted small">
                Try increasing the search radius!
            </p>`;
        return;
    }

    // Build list HTML
    const listEl = document.getElementById('centersList');
    listEl.classList.remove('d-none');
    listEl.innerHTML = centers.map((center, index) => `
        <div class="center-card"
            onclick="focusCenter(${index})"
            id="card-${index}">

            <div class="d-flex justify-content-between
                align-items-start mb-1">
                <h6 class="mb-0 me-2">${center.name}</h6>
                <span class="distance-badge flex-shrink-0">
                    📍 ${center.distance} km
                </span>
            </div>

            <div class="text-muted small mb-2">
                <i class="bi bi-geo-alt me-1"></i>
                ${center.address}
            </div>

            <div class="mb-2">
                ${center.accepts.map(t => `
                    <span class="type-chip me-1"
                        style="background:${
                            TYPE_COLORS[t] || '#10B981'
                        }20; color:${
                            TYPE_COLORS[t] || '#10B981'
                        }">
                        ${t}
                    </span>`
                ).join('')}
            </div>

            ${center.hours ? `
                <div class="text-muted small mb-2">
                    <i class="bi bi-clock me-1"></i>
                    ${center.hours}
                </div>` : ''}

            ${center.phone ? `
                <div class="text-muted small mb-2">
                    <i class="bi bi-telephone me-1"></i>
                    ${center.phone}
                </div>` : ''}

            <a href="https://www.google.com/maps/dir/?api=1
                &destination=${center.lat},${center.lng}"
                target="_blank"
                class="btn btn-sm btn-outline-success
                rounded-pill px-3 mt-1"
                onclick="event.stopPropagation()">
                <i class="bi bi-navigation me-1"></i>
                Get Directions
            </a>
        </div>
    `).join('');

    // Add markers to map
    centers.forEach((center, index) => {
        const color = TYPE_COLORS[center.accepts[0]] ||
                      '#10B981';

        const icon = L.divIcon({
            html: `
                <div style="width:34px;height:34px;
                    background:${color};
                    border-radius:50% 50% 50% 0;
                    transform:rotate(-45deg);
                    border:2px solid white;
                    box-shadow:0 3px 8px rgba(0,0,0,0.25);
                    display:flex;align-items:center;
                    justify-content:center;">
                    <span style="transform:rotate(45deg);
                        font-size:13px;">♻️</span>
                </div>`,
            className : '',
            iconSize  : [34, 34],
            iconAnchor: [17, 34],
            popupAnchor:[0, -34]
        });

        const marker = L.marker(
            [center.lat, center.lng], { icon })
            .addTo(map)
            .bindPopup(`
                <div class="map-popup">
                    <h6>${center.name}</h6>
                    <div class="mb-1">
                        <small class="text-muted">
                            ${center.address}
                        </small>
                    </div>
                    <div class="mb-2">
                        <strong class="text-success">
                            📍 ${center.distance} km away
                        </strong>
                    </div>
                    <div class="mb-2">
                        ${center.accepts.map(t =>
                            `<span class="badge-type">${t}</span>`
                        ).join('')}
                    </div>
                    ${center.hours ? `
                        <div class="small text-muted mb-2">
                            🕐 ${center.hours}
                        </div>` : ''}
                    <a href="https://www.google.com/maps/dir/
                        ?api=1&destination=${center.lat},
                        ${center.lng}"
                        target="_blank"
                        class="directions-btn">
                        🧭 Get Directions
                    </a>
                </div>
            `);

        marker.on('click', () => {
            document.querySelectorAll('.center-card')
                .forEach(c => c.classList.remove('active'));
            document.getElementById(`card-${index}`)
                ?.classList.add('active');
        });

        centerMarkers.push(marker);
    });

    // Fit map to show markers + user
    const group = L.featureGroup([
        ...centerMarkers, userMarker
    ].filter(Boolean));
    if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds().pad(0.15));
    }
}

// ── Focus on specific center ───────────────────
function focusCenter(index) {
    const center = allCenters[index];
    if (!center || !map) return;
    map.setView([center.lat, center.lng], 16);
    centerMarkers[index]?.openPopup();
    document.querySelectorAll('.center-card')
        .forEach(c => c.classList.remove('active'));
    document.getElementById(`card-${index}`)
        ?.classList.add('active');
}

// ── Get user location ──────────────────────────
function getUserLocation() {
    const btn    = document.getElementById('locateBtn');
    const btnMap = document.getElementById('locateBtnMap');
    const loader = `<span class="spinner-border
        spinner-border-sm me-2"></span>Finding...`;

    if (btn)    btn.innerHTML    = loader;
    if (btnMap) btnMap.innerHTML = loader;

    if (!navigator.geolocation) {
        alert('Geolocation not supported!');
        resetButtons(); return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            initMap(userLocation.lat, userLocation.lng);
            addUserMarker(userLocation.lat, userLocation.lng);
            searchCenters(userLocation.lat, userLocation.lng);
            resetButtons();
        },
        (error) => {
            alert(error.code === 1
                ? '❌ Location permission denied.\nPlease allow location in browser settings.'
                : '❌ Could not get your location. Try again!'
            );
            resetButtons();
        },
        { timeout: 10000 }
    );
}

// ── Reset buttons ──────────────────────────────
function resetButtons() {
    const btn    = document.getElementById('locateBtn');
    const btnMap = document.getElementById('locateBtnMap');
    const html   = `<i class="bi bi-crosshair2"></i>
                    Use My Location`;
    if (btn)    btn.innerHTML    = html;
    if (btnMap) btnMap.innerHTML = `
        <i class="bi bi-crosshair2"></i>
        Find Centers Near Me`;
}

// ── Event Listeners ────────────────────────────
document.getElementById('locateBtn')
    .addEventListener('click', getUserLocation);
document.getElementById('locateBtnMap')
    .addEventListener('click', getUserLocation);

// Radius slider
document.getElementById('radiusFilter')
    .addEventListener('input', function() {
        document.getElementById('radiusLabel')
            .textContent = `${this.value} km`;
        if (radiusCircle && userLocation) {
            map.removeLayer(radiusCircle);
            radiusCircle = L.circle(
                [userLocation.lat, userLocation.lng],
                { radius: this.value*1000,
                  className: 'radius-circle' }
            ).addTo(map);
        }
    });

document.getElementById('radiusFilter')
    .addEventListener('change', () => {
        if (userLocation) {
            searchCenters(
                userLocation.lat, userLocation.lng
            );
        }
    });

document.getElementById('wasteFilter')
    .addEventListener('change', () => {
        if (userLocation) {
            searchCenters(
                userLocation.lat, userLocation.lng
            );
        }
    });

// Load data when page opens
loadCentersData();
console.log('🗺️ EcoSort AI Map ready!');