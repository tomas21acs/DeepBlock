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
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
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
const angliruMapPath = document.getElementById('angliru-map-path');
const angliruMapProgress = document.getElementById('angliru-map-progress');
const angliruMapCyclist = document.getElementById('angliru-map-cyclist');
const angliruProfilePath = document.getElementById('angliru-profile-path');
const angliruProfileProgress = document.getElementById('angliru-profile-progress');
const angliruProfileCyclist = document.getElementById('angliru-profile-cyclist');
const angliruProfileGlow = document.getElementById('angliru-profile-glow');
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
let activeUser = null;
let totalKm = 0;
let angliruMapLength = 0;
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

function setupAngliruVisuals() {
  try {
    if (angliruMapPath && angliruMapProgress) {
      angliruMapLength = angliruMapPath.getTotalLength();
      angliruMapProgress.style.strokeDasharray = angliruMapLength;
      angliruMapProgress.style.strokeDashoffset = angliruMapLength;
      angliruMapProgress.style.opacity = 0.18;
    }
    if (angliruProfilePath && angliruProfileProgress) {
      angliruProfileLength = angliruProfilePath.getTotalLength();
      angliruProfileProgress.style.strokeDasharray = angliruProfileLength;
      angliruProfileProgress.style.strokeDashoffset = angliruProfileLength;
      angliruProfileProgress.style.opacity = 0.22;
    }
    updateAngliruAtmosphere(0);
    positionCyclistOnPath(angliruMapPath, angliruMapCyclist, angliruMapLength, 0);
    positionCyclistOnPath(
      angliruProfilePath,
      angliruProfileCyclist,
      angliruProfileLength,
      0
    );
  } catch (error) {
    console.warn('Unable to prepare Angliru visuals', error);
  }
  if (angliruVisuals) {
    angliruVisuals.style.setProperty('--progress', '0');
  }
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
  setPathProgress(angliruMapProgress, angliruMapLength, percent);
  setPathProgress(angliruProfileProgress, angliruProfileLength, percent);
  positionCyclistOnPath(angliruMapPath, angliruMapCyclist, angliruMapLength, percent);
  positionCyclistOnPath(
    angliruProfilePath,
    angliruProfileCyclist,
    angliruProfileLength,
    percent
  );
  updateAngliruAtmosphere(percent);
}

function setPathProgress(progressElement, totalLength, percent) {
  if (!progressElement || !totalLength) return;
  const clamped = Math.min(1, Math.max(0, percent));
  const offset = totalLength * (1 - clamped);
  progressElement.style.strokeDashoffset = offset;
  const glow = 0.2 + clamped * 0.65;
  progressElement.style.opacity = glow.toFixed(3);
}

function positionCyclistOnPath(pathElement, cyclistElement, totalLength, percent) {
  if (!pathElement || !cyclistElement || !totalLength) return;
  const safePercent = Math.min(1, Math.max(0, percent));
  const travel = totalLength * safePercent;
  const delta = Math.max(6, totalLength * 0.012);
  try {
    const point = pathElement.getPointAtLength(travel);
    const start = Math.max(0, travel - delta);
    const end = Math.min(totalLength, travel + delta);
    const startPoint = pathElement.getPointAtLength(start);
    const endPoint = pathElement.getPointAtLength(end);
    const angle =
      Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) *
      (180 / Math.PI);
    cyclistElement.setAttribute(
      'transform',
      `translate(${point.x} ${point.y}) rotate(${angle})`
    );
    cyclistElement.style.filter = `drop-shadow(0 0 ${10 + safePercent * 18}px rgba(56, 189, 248, ${
      0.35 + safePercent * 0.55
    }))`;
  } catch (error) {
    console.warn('Unable to position Angliru cyclist', error);
  }
}

function updateAngliruAtmosphere(percent) {
  const progressValue = Math.min(1, Math.max(0, percent));
  if (angliruVisuals) {
    angliruVisuals.style.setProperty('--progress', progressValue.toFixed(3));
  }
  if (angliruMapProgress) {
    const glow = 0.25 + progressValue * 0.6;
    angliruMapProgress.style.filter = `drop-shadow(0 0 ${14 + progressValue * 18}px rgba(59, 130, 246, ${
      0.35 + progressValue * 0.4
    }))`;
  }
  if (angliruProfileGlow) {
    const intensity = 0.25 + progressValue * 0.55;
    angliruProfileGlow.style.opacity = intensity.toFixed(3);
  }
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
