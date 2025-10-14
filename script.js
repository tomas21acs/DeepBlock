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
const progressFill = document.getElementById('progress-fill');
const cyclist = document.getElementById('cyclist');
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

const TOTAL_KM_GOAL = 27;
let activeUser = null;
let totalKm = 0;
let timerInterval = null;
let timerEnd = null;
let activeDeepBlock = null;
let audioContext = null;

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
  if (!activeUser) return;
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
    console.error('Failed to load progress', error);
    totalProgressText.textContent = 'Unable to load progress right now.';
  }
}

async function loadHistory() {
  if (!activeUser) return;
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
    console.error('Failed to load history', error);
    historyList.innerHTML =
      '<li class="history-item"><p>Unable to load history right now.</p></li>';
  }
}

refreshHistoryBtn.addEventListener('click', loadHistory);

function updateProgressUI() {
  totalKm = Number(totalKm) || 0;
  const clamped = Math.min(totalKm, TOTAL_KM_GOAL);
  const percent = TOTAL_KM_GOAL === 0 ? 0 : clamped / TOTAL_KM_GOAL;
  totalProgressText.textContent = `You've completed ${totalKm.toFixed(
    2
  )} km out of ${TOTAL_KM_GOAL} km`;
  progressFill.style.width = `${percent * 90}%`;
  cyclist.style.left = `calc(${5 + percent * 90}% - 20px)`;
}

startDeepBlockBtn.addEventListener('click', () => {
  deepBlockForm.classList.remove('hidden');
  deepBlockFeedback.textContent = '';
  deepBlockForm.scrollIntoView({ behavior: 'smooth' });
});

deepBlockForm.addEventListener('submit', (event) => {
  event.preventDefault();
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
  if (!activeDeepBlock || !activeUser) return;

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
    postBlockFeedback.textContent = error.message;
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
