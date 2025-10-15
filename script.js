import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  increment,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// 1. Insert your Firebase configuration below. Replace the placeholder values with your project's keys.
const firebaseConfig = {
=======
  apiKey: "AIzaSyBOrvsVrviKeq5iUebAqiUWdNX4IYSJmF4",
  authDomain: "deepride-d18ae.firebaseapp.com",
  projectId: "deepride-d18ae",
  storageBucket: "deepride-d18ae.firebasestorage.app",
  messagingSenderId: "606511315827",
  appId: "1:606511315827:web:94544fde3f839f9151a306",
  measurementId: "G-YSCPQ7X5SC"
};

// 2. Initialize Firebase using your configuration above.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI elements
const authScreen = document.getElementById('auth-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginFeedback = document.getElementById('login-feedback');
const registerFeedback = document.getElementById('register-feedback');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');
const dashboard = document.getElementById('dashboard');
const welcomeText = document.getElementById('welcome');
const totalProgressText = document.getElementById('total-progress-text');
const angliruVisuals = document.querySelector('.angliru-visuals');
const angliruMapContainer = document.getElementById('angliru-map');
const angliruProfileSvg = document.getElementById('angliru-profile-svg');
const angliruProfileShadow = document.getElementById('angliru-profile-shadow');
const angliruProfilePath = document.getElementById('angliru-profile-path');
const angliruProfileProgress = document.getElementById('angliru-profile-progress');
const angliruProfileGlow = document.getElementById('angliru-profile-glow');
const angliruProfileBaseline = document.getElementById('angliru-profile-baseline');
const angliruProfileTicksGroup = document.getElementById('angliru-profile-ticks');
const angliruProfileCyclist = document.getElementById('angliru-profile-cyclist');
const angliruProfileLineGradient = document.getElementById(
  'angliru-profile-line-gradient'
);
const angliruProfileProgressGradient = document.getElementById(
  'angliru-profile-progress-gradient'
);
const startDeepBlockBtn = document.getElementById('start-deep-block');
const deepBlockForm = document.getElementById('deep-block-form');
const deepBlockFeedback = document.getElementById('deep-block-feedback');
const countdownContainer = document.getElementById('countdown');
const timerDisplay = document.getElementById('timer-display');
const timerProgress = document.getElementById('timer-progress');
const cancelTimerBtn = document.getElementById('cancel-timer');
const postBlockContainer = document.getElementById('post-block');
const focusRatingInput = document.getElementById('focus-rating');
const completionRatingInput = document.getElementById('completion-rating');
const postBlockForm = document.getElementById('post-block-form');
const postBlockFeedback = document.getElementById('post-block-feedback');
const historyList = document.getElementById('history-list');
const refreshHistoryBtn = document.getElementById('refresh-history');
const logoutBtn = document.getElementById('logout');
const confettiContainer = document.getElementById('confetti-container');
const configWarning = document.getElementById('config-warning');
const configWarningMessage = document.getElementById('config-warning-message');

const TOTAL_KM_GOAL = 12.5;
const ANGLIRU_GPX_URL = 'angliru.gpx';
const angliruRouteFallback = createFallbackRoute();
let angliruRoute = [...angliruRouteFallback];
let angliruRouteTotalDistance =
  angliruRoute[angliruRoute.length - 1]?.distance || TOTAL_KM_GOAL;
let activeUser = null;
let totalKm = 0;
let angliruMap;
let angliruMapBaseRoute;
let angliruMapGlowRoute;
let angliruMapProgressRoute;
let angliruMapCyclistMarker;
let angliruMapFocus;
let angliruLastLatLng = null;
let angliruProfileLength = 0;
let timerInterval = null;
let timerEnd = null;
let activeDeepBlock = null;
let audioContext = null;
let firebaseReady = true;

const CONFIG_INSTRUCTION =
  'Paste the Firebase config object from Project settings → General → Your apps into firebaseConfig inside script.js, then redeploy or reload the site.';

const firebaseValues = Object.values(firebaseConfig || {});
const isConfigPlaceholder = firebaseValues.some((value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed === '' || trimmed.includes('YOUR_') || trimmed.includes('...');
});

if (isConfigPlaceholder) {
  firebaseReady = false;
  showConfigWarning(
    'The current Firebase configuration is a placeholder. ' + CONFIG_INSTRUCTION
  );
}

setupAngliruVisuals();

// Auth tab toggle
showLoginBtn.addEventListener('click', () => {
  showLoginBtn.classList.add('active');
  showRegisterBtn.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  loginFeedback.textContent = '';
  registerFeedback.textContent = '';
});

showRegisterBtn.addEventListener('click', () => {
  showRegisterBtn.classList.add('active');
  showLoginBtn.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  loginFeedback.textContent = '';
  registerFeedback.textContent = '';
});

// Authentication handlers
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginFeedback.textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!firebaseReady) {
    loginFeedback.textContent = CONFIG_INSTRUCTION;
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    loginFeedback.textContent = handleFirebaseError(
      error,
      'Unable to log in right now.'
    );
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    loginFeedback.textContent = error.message;
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  registerFeedback.textContent = '';
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();

  if (!firebaseReady) {
    registerFeedback.textContent = CONFIG_INSTRUCTION;
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    registerFeedback.textContent = handleFirebaseError(
      error,
      'Unable to create an account right now.'
    );
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    registerFeedback.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    activeUser = user;
    welcomeText.textContent = `Welcome back, ${user.email}!`;
    authScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    await loadProgress();
    await loadHistory();
  } else {
    activeUser = null;
    totalKm = 0;
    resetDeepBlockUI();
    dashboard.classList.add('hidden');
    authScreen.classList.remove('hidden');
    loginForm.reset();
    registerForm.reset();
    historyList.innerHTML = '';
  }
});

async function loadProgress() {
  if (!activeUser || !firebaseReady) return;
  try {
    const userDocRef = doc(db, 'users', activeUser.uid);
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      totalKm = userSnapshot.data().totalKm || 0;
    } else {
      totalKm = 0;
      await setDoc(userDocRef, {
        totalKm: 0,
        createdAt: serverTimestamp(),
      });
    }
    updateProgressUI();
  } catch (error) {
    totalProgressText.textContent = handleFirebaseError(
      error,
      'Unable to load progress right now.'
    );
  }
}

async function loadHistory() {
  if (!activeUser || !firebaseReady) return;
  historyList.innerHTML = '<li class="history-item">Loading...</li>';
  try {
    const userDocRef = doc(db, 'users', activeUser.uid);
    const historyQuery = query(
      collection(userDocRef, 'deepBlocks'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(historyQuery);
    if (snapshot.empty) {
      historyList.innerHTML =
        '<li class="history-item"><p>No Deep Blocks yet. Start one to begin your climb!</p></li>';
      return;
    }

    const items = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate()
        ? data.createdAt.toDate().toLocaleString()
        : 'Pending...';
      const kmEarned = data.kmEarned?.toFixed(2) ?? '0.00';
      return `
        <li class="history-item">
          <h4>${data.goal || 'Deep Block'}</h4>
          <div class="history-meta">
            <span>${date}</span>
            <span>${data.duration} min</span>
            <span>Focus: ${data.focus}</span>
            <span>Completion: ${data.completion}</span>
            <span>${kmEarned} km</span>
          </div>
        </li>
      `;
    });

    historyList.innerHTML = items.join('');
  } catch (error) {
    const message = handleFirebaseError(
      error,
      'Unable to load history right now.'
    );
    historyList.innerHTML = `<li class="history-item"><p>${message}</p></li>`;
  }
}

refreshHistoryBtn.addEventListener('click', loadHistory);

async function setupAngliruVisuals() {
  if (angliruVisuals) {
    angliruVisuals.style.setProperty('--progress', '0');
  }
  try {
    const liveRoute = await fetchAngliruRouteData();
    if (Array.isArray(liveRoute) && liveRoute.length > 1) {
      angliruRoute = liveRoute;
    }
  } catch (error) {
    console.warn('Unable to load Angliru GPX, using fallback route', error);
  }

  angliruRouteTotalDistance =
    angliruRoute[angliruRoute.length - 1]?.distance || TOTAL_KM_GOAL;

  initializeAngliruMap();
  initializeAngliruProfile();
  updateAngliruProgress(0);
}

function updateProgressUI() {
  totalKm = Number(totalKm) || 0;
  const clamped = Math.min(totalKm, TOTAL_KM_GOAL);
  const percent = TOTAL_KM_GOAL === 0 ? 0 : clamped / TOTAL_KM_GOAL;
  totalProgressText.textContent = `You've climbed ${totalKm.toFixed(
    2
  )} km of the ${TOTAL_KM_GOAL} km Angliru ascent`;
  updateAngliruProgress(percent);
}

function updateAngliruProgress(percent) {
  const clamped = Math.min(1, Math.max(0, percent));
  updateMapProgress(clamped);
  updateProfileProgress(clamped);
  updateAngliruAtmosphere(clamped);
}

function updateMapProgress(percent) {
  if (!angliruMap || !angliruMapProgressRoute || !angliruRoute.length) return;
  const routeDistance = angliruRouteTotalDistance || TOTAL_KM_GOAL;
  const targetDistance = routeDistance * percent;
  const section = getRouteSection(targetDistance);
  if (section.length === 0) {
    const origin = angliruRoute[0];
    const startLatLng = [origin.lat, origin.lng];
    angliruMapProgressRoute.setLatLngs([startLatLng]);
    angliruMapCyclistMarker?.setLatLng(startLatLng);
    angliruMapFocus?.setLatLng(startLatLng);
    return;
  }

  angliruMapProgressRoute.setLatLngs(section);
  const last = section[section.length - 1];
  if (angliruMapCyclistMarker) {
    angliruMapCyclistMarker.setLatLng(last);
  }
  if (angliruMapFocus) {
    angliruMapFocus.setLatLng(last);
    angliruMapFocus.setRadius(28 + percent * 28);
    const fill = `rgba(56, 189, 248, ${0.18 + percent * 0.28})`;
    angliruMapFocus.setStyle({
      fillColor: fill,
      fillOpacity: 0.18 + percent * 0.32,
    });
  }

  if (angliruMap && last) {
    const latLng = L.latLng(last[0], last[1]);
    if (
      !angliruLastLatLng ||
      angliruMap.distance(angliruLastLatLng, latLng) > 80
    ) {
      const targetZoom = Math.min(16.2, 13 + percent * 2.4);
      angliruMap.flyTo(latLng, targetZoom, {
        duration: 0.9,
        easeLinearity: 0.25,
        noMoveStart: true,
      });
      angliruLastLatLng = latLng;
    }
  }
}

function updateProfileProgress(percent) {
  if (!angliruProfileProgress || !angliruProfileLength) return;
  const offset = angliruProfileLength * (1 - percent);
  angliruProfileProgress.style.strokeDashoffset = offset;
  angliruProfileProgress.style.opacity = (0.28 + percent * 0.6).toFixed(3);
  positionCyclistOnProfile(percent);
}

function positionCyclistOnProfile(percent) {
  if (!angliruProfileProgress || !angliruProfileCyclist || !angliruProfileLength)
    return;
  const safePercent = Math.min(1, Math.max(0, percent));
  const travel = angliruProfileLength * safePercent;
  const delta = Math.max(6, angliruProfileLength * 0.012);
  try {
    const point = angliruProfileProgress.getPointAtLength(travel);
    const start = Math.max(0, travel - delta);
    const end = Math.min(angliruProfileLength, travel + delta);
    const startPoint = angliruProfileProgress.getPointAtLength(start);
    const endPoint = angliruProfileProgress.getPointAtLength(end);
    const angle =
      Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) *
      (180 / Math.PI);
    angliruProfileCyclist.setAttribute(
      'transform',
      `translate(${point.x} ${point.y}) rotate(${angle})`
    );
    angliruProfileCyclist.style.filter = `drop-shadow(0 0 ${10 + safePercent * 18}px rgba(56, 189, 248, ${
      0.35 + safePercent * 0.45
    }))`;
  } catch (error) {
    console.warn('Unable to position Angliru profile cyclist', error);
  }
}

function updateAngliruAtmosphere(percent) {
  const progressValue = Math.min(1, Math.max(0, percent));
  if (angliruVisuals) {
    angliruVisuals.style.setProperty('--progress', progressValue.toFixed(3));
  }
  if (angliruMapProgressRoute) {
    angliruMapProgressRoute.setStyle({
      opacity: 0.35 + progressValue * 0.55,
      weight: 5.5 + progressValue * 2.2,
    });
  }
  if (angliruMapGlowRoute) {
    angliruMapGlowRoute.setStyle({
      opacity: 0.16 + progressValue * 0.26,
      weight: 12 + progressValue * 6,
    });
  }
  if (angliruProfileGlow) {
    angliruProfileGlow.style.opacity = (0.25 + progressValue * 0.6).toFixed(3);
  }
}

function initializeAngliruMap() {
  if (!angliruMapContainer || typeof L === 'undefined' || !angliruRoute.length) {
    return;
  }

  if (angliruMap) {
    angliruMap.remove();
  }

  angliruMap = L.map(angliruMapContainer, {
    zoomControl: false,
    attributionControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: false,
    dragging: true,
    maxZoom: 18,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(angliruMap);

  const coords = angliruRoute.map((point) => [point.lat, point.lng]);
  if (coords.length === 0) return;

  angliruMapGlowRoute = L.polyline(coords, {
    color: '#38bdf8',
    weight: 14,
    opacity: 0.18,
    lineCap: 'round',
  }).addTo(angliruMap);

  angliruMapBaseRoute = L.polyline(coords, {
    color: 'rgba(15, 23, 42, 0.65)',
    weight: 9,
    opacity: 0.4,
    lineCap: 'round',
  }).addTo(angliruMap);

  angliruMapProgressRoute = L.polyline([coords[0]], {
    color: '#38bdf8',
    weight: 5.5,
    opacity: 0.4,
    lineCap: 'round',
  }).addTo(angliruMap);

  const iconUrl = createCyclistIconDataUrl();
  const cyclistIcon = L.icon({
    iconUrl,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    className: 'angliru-map-cyclist',
  });

  angliruMapCyclistMarker = L.marker(coords[0], {
    icon: cyclistIcon,
    interactive: false,
    keyboard: false,
  }).addTo(angliruMap);

  angliruMapFocus = L.circleMarker(coords[0], {
    radius: 28,
    color: 'transparent',
    fillColor: 'rgba(56, 189, 248, 0.22)',
    fillOpacity: 0.22,
    weight: 0,
    interactive: false,
  }).addTo(angliruMap);

  const bounds = L.latLngBounds(coords);
  angliruMap.fitBounds(bounds, { padding: [24, 24] });
  angliruLastLatLng = L.latLng(coords[0][0], coords[0][1]);

  addAngliruWaypoints();
}

function addAngliruWaypoints() {
  if (!angliruMap) return;
  const markers = [
    { label: "La Vega · 0 km", distance: 0 },
    { label: 'Viapara · 6 km', distance: 6 },
    { label: "Cueña les Cabres · 10.5 km", distance: 10.5 },
    { label: `Summit · ${TOTAL_KM_GOAL} km`, distance: TOTAL_KM_GOAL },
  ];

  markers.forEach((info) => {
    const point = getRoutePointByDistance(info.distance);
    if (!point) return;
    const marker = L.circleMarker([point.lat, point.lng], {
      radius: 5,
      color: 'rgba(56, 189, 248, 0.85)',
      weight: 2,
      fillColor: 'rgba(15, 23, 42, 0.95)',
      fillOpacity: 0.95,
    }).addTo(angliruMap);
    marker.bindTooltip(info.label, {
      direction: 'top',
      className: 'angliru-tooltip',
      offset: [0, -12],
      opacity: 0.9,
    });
  });
}

function initializeAngliruProfile() {
  if (!angliruProfileSvg || !angliruProfilePath || !angliruProfileProgress) {
    return;
  }

  const profileData = buildProfilePath(angliruRoute);
  if (!profileData) return;

  const { linePath, areaPath, gradientStops, baselinePath, ticks } = profileData;

  if (angliruProfileShadow) {
    angliruProfileShadow.setAttribute('d', areaPath);
  }
  if (angliruProfileGlow) {
    angliruProfileGlow.setAttribute('d', linePath);
  }

  if (angliruProfileBaseline && baselinePath) {
    angliruProfileBaseline.setAttribute('d', baselinePath);
  }

  angliruProfilePath.setAttribute('d', linePath);
  angliruProfileProgress.setAttribute('d', linePath);

  angliruProfileLength = angliruProfileProgress.getTotalLength();
  angliruProfileProgress.style.strokeDasharray = angliruProfileLength;
  angliruProfileProgress.style.strokeDashoffset = angliruProfileLength;
  angliruProfileProgress.style.opacity = 0.28;

  updateProfileGradients(gradientStops);
  renderProfileTicks(ticks);
  positionCyclistOnProfile(0);
}

function buildProfilePath(route) {
  if (!route.length) return null;
  const width = 600;
  const height = 320;
  const padding = { top: 40, right: 36, bottom: 60, left: 44 };
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const elevations = route.map((point) => point.elevation ?? 0);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationRange = Math.max(1, maxElevation - minElevation);
  const totalDistance = angliruRouteTotalDistance || TOTAL_KM_GOAL;

  const scaleX = (distance) =>
    padding.left + (distance / totalDistance) * usableWidth;
  const scaleY = (elevation) =>
    height -
    padding.bottom -
    ((elevation - minElevation) / elevationRange) * usableHeight;

  let linePath = '';
  route.forEach((point, index) => {
    const x = scaleX(point.distance);
    const y = scaleY(point.elevation ?? minElevation);
    linePath += index === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  const baseStartX = scaleX(route[0].distance);
  const baseEndX = scaleX(route[route.length - 1].distance);
  const baseY = height - padding.bottom;
  const areaPath = `${linePath} L ${baseEndX.toFixed(2)} ${baseY} L ${baseStartX.toFixed(2)} ${baseY} Z`;
  const baselinePath = `M ${padding.left.toFixed(2)} ${baseY.toFixed(2)} L ${(width - padding.right).toFixed(2)} ${baseY.toFixed(2)}`;

  const gradientStops = computeGradientStops(route, totalDistance);
  const ticks = createDistanceTicks(totalDistance, scaleX, baseY);

  return { linePath, areaPath, gradientStops, baselinePath, ticks };
}

function renderProfileTicks(ticks) {
  if (!angliruProfileTicksGroup) return;
  const markup = (ticks || [])
    .map(
      (tick) => `
        <line class="profile-tick-line" x1="${tick.x.toFixed(2)}" y1="${tick.lineY1.toFixed(2)}" x2="${tick.x.toFixed(2)}" y2="${tick.lineY2.toFixed(2)}"></line>
        <text class="profile-tick-label" text-anchor="middle" x="${tick.x.toFixed(2)}" y="${tick.labelY.toFixed(2)}">${tick.label}</text>
      `
    )
    .join('');
  angliruProfileTicksGroup.innerHTML = markup;
}

function createDistanceTicks(totalDistance, scaleX, baselineY) {
  const ticks = [];
  const interval = 2.5;
  const maxDistance = Math.max(totalDistance, TOTAL_KM_GOAL);

  for (let distance = 0; distance <= maxDistance + 0.001; distance += interval) {
    const clamped = Math.min(distance, totalDistance);
    ticks.push({
      x: scaleX(clamped),
      lineY1: baselineY,
      lineY2: baselineY - 10,
      labelY: baselineY + 18,
      label: `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} km`,
    });
  }

  const lastTick = ticks[ticks.length - 1];
  const targetX = scaleX(totalDistance);
  if (!lastTick || Math.abs(lastTick.x - targetX) > 1) {
    ticks.push({
      x: targetX,
      lineY1: baselineY,
      lineY2: baselineY - 10,
      labelY: baselineY + 18,
      label: `${totalDistance.toFixed(1)} km`,
    });
  }

  return ticks;
}

function updateProfileGradients(stops) {
  if (!angliruProfileLineGradient || !angliruProfileProgressGradient) return;
  const markup = stops
    .map((stop) => {
      const offset = Math.min(1, Math.max(0, stop.offset));
      return `<stop offset="${(offset * 100).toFixed(2)}%" stop-color="${stop.color}" />`;
    })
    .join('');
  const fallbackMarkup =
    '<stop offset="0%" stop-color="#38bdf8" /><stop offset="100%" stop-color="#a855f7" />';
  angliruProfileLineGradient.innerHTML = markup || fallbackMarkup;
  angliruProfileProgressGradient.innerHTML = markup || fallbackMarkup;
}

function computeGradientStops(route, totalDistance) {
  const stops = [];
  for (let i = 0; i < route.length; i += 1) {
    const current = route[i];
    let grade = 0;
    if (i < route.length - 1) {
      const next = route[i + 1];
      const deltaDistance = Math.max(0.0001, next.distance - current.distance);
      grade = ((next.elevation - current.elevation) / (deltaDistance * 1000)) * 100;
    } else if (i > 0) {
      const prev = route[i - 1];
      const deltaDistance = Math.max(0.0001, current.distance - prev.distance);
      grade = ((current.elevation - prev.elevation) / (deltaDistance * 1000)) * 100;
    }
    stops.push({
      offset: totalDistance === 0 ? 0 : current.distance / totalDistance,
      color: gradeToColor(grade),
    });
  }
  return stops;
}

function gradeToColor(grade) {
  const intensity = Math.abs(grade);
  if (intensity <= 6) return '#38bdf8';
  if (intensity <= 9) return '#22d3ee';
  if (intensity <= 12) return '#34d399';
  if (intensity <= 15) return '#facc15';
  if (intensity <= 18) return '#fb923c';
  return '#f87171';
}

function getRouteSection(distanceKm) {
  if (!angliruRoute.length) return [];
  const section = [];
  const clampedDistance = Math.max(0, Math.min(distanceKm, angliruRouteTotalDistance));

  for (let i = 0; i < angliruRoute.length; i += 1) {
    const current = angliruRoute[i];
    section.push([current.lat, current.lng]);

    if (current.distance >= clampedDistance) {
      if (current.distance > clampedDistance && i > 0) {
        const prev = angliruRoute[i - 1];
        const ratio =
          (clampedDistance - prev.distance) /
          Math.max(0.0001, current.distance - prev.distance);
        const lat = prev.lat + (current.lat - prev.lat) * ratio;
        const lng = prev.lng + (current.lng - prev.lng) * ratio;
        section[section.length - 1] = [lat, lng];
      }
      break;
    }
  }

  return section;
}

function getRoutePointByDistance(distanceKm) {
  const section = getRouteSection(distanceKm);
  if (!section.length) return null;
  const last = section[section.length - 1];
  return { lat: last[0], lng: last[1] };
}

async function fetchAngliruRouteData() {
  const response = await fetch(ANGLIRU_GPX_URL, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error('Unable to load Angliru GPX');
  }
  const gpxText = await response.text();
  return parseAngliruGpx(gpxText);
}

function parseAngliruGpx(gpxText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(gpxText, 'application/xml');
  const errorNode = xml.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Invalid GPX data');
  }

  const trkpts = Array.from(xml.getElementsByTagName('trkpt'));
  if (!trkpts.length) {
    throw new Error('GPX missing track points');
  }

  let cumulative = 0;
  let previous = null;
  const parsed = [];

  trkpts.forEach((trkpt) => {
    const lat = parseFloat(trkpt.getAttribute('lat'));
    const lng = parseFloat(trkpt.getAttribute('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }
    const elevationNode = trkpt.getElementsByTagName('ele')[0];
    const elevationValue = elevationNode ? parseFloat(elevationNode.textContent) : 0;
    if (previous) {
      cumulative += haversineDistance(previous, { lat, lng });
    }
    parsed.push({
      lat,
      lng,
      elevation: Number.isFinite(elevationValue) ? elevationValue : 0,
      distance: cumulative,
    });
    previous = { lat, lng };
  });

  if (!parsed.length) {
    throw new Error('GPX points could not be parsed');
  }

  const totalDistance = parsed[parsed.length - 1].distance || TOTAL_KM_GOAL;
  const scale = totalDistance > 0 ? TOTAL_KM_GOAL / totalDistance : 1;

  return parsed.map((point) => ({
    lat: point.lat,
    lng: point.lng,
    distance: point.distance * scale,
    elevation: Math.round(point.elevation),
  }));
}

function haversineDistance(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return R * c;
}

function createFallbackRoute() {
  const start = { lat: 43.2296, lng: -5.9217 };
  const summit = { lat: 43.1873, lng: -5.9249 };
  const points = [];
  const segments = 260;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const baseLat = start.lat + (summit.lat - start.lat) * t;
    const baseLng = start.lng + (summit.lng - start.lng) * t;
    const amplitude = 0.012 * (1 - Math.min(1, Math.abs(0.5 - t) * 1.3));
    const wiggle =
      Math.sin(t * Math.PI * 8.5) * amplitude + Math.sin(t * Math.PI * 2.4) * (amplitude * 0.45);
    const lat = baseLat;
    const lng = baseLng + wiggle;
    const elevation = 320 + (1573 - 320) * Math.pow(t, 1.35);
    points.push({ lat, lng, elevation });
  }

  let cumulative = 0;
  const enriched = points.map((point, index) => {
    if (index > 0) {
      cumulative += haversineDistance(points[index - 1], point);
    }
    return {
      lat: point.lat,
      lng: point.lng,
      elevation: Math.round(point.elevation),
      distance: cumulative,
    };
  });

  const totalDistance = enriched[enriched.length - 1]?.distance || TOTAL_KM_GOAL;
  const scale = totalDistance > 0 ? TOTAL_KM_GOAL / totalDistance : 1;

  return enriched.map((point) => ({
    lat: point.lat,
    lng: point.lng,
    elevation: point.elevation,
    distance: point.distance * scale,
  }));
}

function createCyclistIconDataUrl() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="-24 -24 48 48">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="-10" cy="8" r="7" fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.9)" stroke-width="2"/>
      <circle cx="10" cy="8" r="7" fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.9)" stroke-width="2"/>
      <path d="M-10 8 L-2 -4 L14 10 L-4 10 Z" stroke="rgba(56,189,248,0.95)" stroke-width="3"/>
      <path d="M-2 -4 Q2 -16 12 -12 L6 2" stroke="rgba(96,165,250,0.95)" stroke-width="3"/>
      <circle cx="12" cy="-18" r="4" fill="rgba(226,232,240,0.95)" stroke="rgba(56,189,248,0.95)" stroke-width="1.5"/>
    </g>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

startDeepBlockBtn.addEventListener('click', () => {
  if (!firebaseReady) {
    deepBlockFeedback.textContent = CONFIG_INSTRUCTION;
    return;
  }
  deepBlockForm.classList.remove('hidden');
  deepBlockFeedback.textContent = '';
  deepBlockForm.scrollIntoView({ behavior: 'smooth' });
});

deepBlockForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!firebaseReady) {
    deepBlockFeedback.textContent = CONFIG_INSTRUCTION;
    return;
  }
  const duration = Number(document.getElementById('duration').value);
  const goal = document.getElementById('goal').value.trim();

  if (!duration || duration <= 0) {
    deepBlockFeedback.textContent = 'Please enter a valid duration.';
    return;
  }

  if (!goal) {
    deepBlockFeedback.textContent = 'Please enter a goal for this Deep Block.';
    return;
  }

  activeDeepBlock = { duration, goal };
  startCountdown(duration * 60);
  deepBlockForm.classList.add('hidden');
  countdownContainer.classList.remove('hidden');
  startDeepBlockBtn.disabled = true;
  startDeepBlockBtn.textContent = 'Deep Block in progress...';
  deepBlockFeedback.textContent = '';
});

cancelTimerBtn.addEventListener('click', () => {
  stopCountdown(true);
  deepBlockForm.classList.remove('hidden');
  startDeepBlockBtn.disabled = false;
  startDeepBlockBtn.textContent = 'Start New Deep Block';
});

function startCountdown(durationSeconds) {
  const startTime = Date.now();
  timerEnd = startTime + durationSeconds * 1000;
  updateTimerDisplay(durationSeconds);
  updateTimerProgress(1);

  timerInterval = setInterval(() => {
    const remaining = Math.max(0, timerEnd - Date.now());
    const secondsLeft = Math.ceil(remaining / 1000);
    updateTimerDisplay(secondsLeft);
    const progress = remaining / (durationSeconds * 1000);
    updateTimerProgress(progress);

    if (remaining <= 0) {
      stopCountdown(false);
      showPostBlockForm();
      triggerCelebration();
    }
  }, 250);
}

function stopCountdown(cancelled) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = null;
  timerEnd = null;
  countdownContainer.classList.add('hidden');
  updateTimerProgress(1);
  timerDisplay.textContent = '00:00';
  if (cancelled) {
    activeDeepBlock = null;
  }
}

function updateTimerDisplay(secondsLeft) {
  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(secondsLeft % 60)
    .toString()
    .padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function updateTimerProgress(progress) {
  const dasharray = 339.292;
  const offset = dasharray * progress;
  timerProgress.style.strokeDashoffset = offset;
}

function showPostBlockForm() {
  postBlockContainer.classList.remove('hidden');
  focusRatingInput.value = '';
  completionRatingInput.value = '';
  postBlockFeedback.textContent = '';
}

postBlockForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeDeepBlock || !activeUser || !firebaseReady) {
    postBlockFeedback.textContent = CONFIG_INSTRUCTION;
    return;
  }

  const focus = Number(focusRatingInput.value);
  const completion = Number(completionRatingInput.value);

  if (!isValidRating(focus) || !isValidRating(completion)) {
    postBlockFeedback.textContent = 'Ratings must be between 1 and 10.';
    return;
  }

  const { duration, goal } = activeDeepBlock;
  const averageRating = (focus + completion) / 2;
  const points = duration * (averageRating / 10);
  const kmEarned = points / 60;

  try {
    const userDocRef = doc(db, 'users', activeUser.uid);
    await addDoc(collection(userDocRef, 'deepBlocks'), {
      goal,
      duration,
      focus,
      completion,
      points,
      kmEarned,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      userDocRef,
      {
        totalKm: increment(kmEarned),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    totalKm += kmEarned;
    updateProgressUI();
    await loadHistory();

    postBlockFeedback.style.color = '#4ade80';
    postBlockFeedback.textContent = `Saved! You just earned ${kmEarned.toFixed(
      2
    )} km.`;
  } catch (error) {
    postBlockFeedback.style.color = 'var(--danger)';
    postBlockFeedback.textContent = handleFirebaseError(
      error,
      'Unable to save this Deep Block. Please try again.'
    );
    return;
  }

  setTimeout(() => {
    postBlockFeedback.textContent = '';
    postBlockFeedback.style.color = 'var(--danger)';
  }, 2500);

  resetDeepBlockUI();
  startDeepBlockBtn.disabled = false;
  startDeepBlockBtn.textContent = 'Start New Deep Block';
});

function isValidRating(value) {
  return Number.isFinite(value) && value >= 1 && value <= 10;
}

function resetDeepBlockUI() {
  deepBlockForm.reset();
  deepBlockForm.classList.add('hidden');
  postBlockContainer.classList.add('hidden');
  deepBlockFeedback.textContent = '';
  postBlockFeedback.textContent = '';
  postBlockFeedback.style.color = 'var(--danger)';
  startDeepBlockBtn.disabled = false;
  startDeepBlockBtn.textContent = 'Start New Deep Block';
  stopCountdown(true);
}

function triggerCelebration() {
  playSuccessSound();
  launchConfetti();
}

function isInvalidApiKeyError(error) {
  const message = (error?.message || '').toLowerCase();
  const code = (error?.code || '').toLowerCase();
  return code.includes('invalid-api-key') || message.includes('api-key');
}

function handleConfigIssue(message) {
  firebaseReady = false;
  showConfigWarning(message);
}

function showConfigWarning(message) {
  if (!configWarning || !configWarningMessage) return;
  configWarning.classList.remove('hidden');
  configWarningMessage.textContent = message;
}

function handleFirebaseError(error, fallbackMessage) {
  console.error(error);
  if (isInvalidApiKeyError(error)) {
    handleConfigIssue(
      'Firebase rejected the API key that is currently configured. ' +
        CONFIG_INSTRUCTION
    );
    return 'Your Firebase configuration is invalid. Please update firebaseConfig in script.js.';
  }
  return error?.message || fallbackMessage;
}

function playSuccessSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const duration = 0.4;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn('Audio playback not supported', error);
  }
}

function launchConfetti() {
  const colors = ['#38bdf8', '#f472b6', '#facc15', '#34d399'];
  const pieces = 120;
  const containerWidth = confettiContainer.clientWidth;
  const containerHeight = confettiContainer.clientHeight;

  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement('div');
    piece.classList.add('confetti-piece');
    piece.style.left = `${Math.random() * containerWidth}px`;
    piece.style.top = `${-Math.random() * containerHeight * 0.4}px`;
    piece.style.backgroundColor = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiContainer.appendChild(piece);

    piece.addEventListener('animationend', () => {
      piece.remove();
    });
  }
}
