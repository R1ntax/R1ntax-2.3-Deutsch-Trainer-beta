import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  getDocs,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js';

const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: 'demo-key',
  authDomain: 'demo.firebaseapp.com',
  projectId: 'demo',
  storageBucket: 'demo.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000:web:demo',
  measurementId: 'G-DEMO',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch {
  analytics = null;
}

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
let confirmationResult = null;

export const firebaseServices = {
  auth,
  db,
  analytics,
  providers: { googleProvider, facebookProvider },
};

export function track(name, params = {}) {
  if (analytics) logEvent(analytics, name, params);
}

export function watchAuthState(handler) {
  return onAuthStateChanged(auth, handler);
}

export function signInGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function signInFacebook() {
  return signInWithPopup(auth, facebookProvider);
}

export function signInEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function registerEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function setupPhoneRecaptcha(containerId = 'recaptcha-container') {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  }
  return window.recaptchaVerifier;
}

export async function sendPhoneCode(phoneNumber) {
  const verifier = await setupPhoneRecaptcha();
  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function verifyPhoneCode(code) {
  if (!confirmationResult) throw new Error('No confirmation result active');
  return confirmationResult.confirm(code);
}

export function signOutUser() {
  return signOut(auth);
}

export async function ensureUserDoc(user, profile = {}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const nowIso = new Date().toISOString();
    await setDoc(ref, {
      uid: user.uid,
      username: user.displayName || user.email?.split('@')[0] || 'Player',
      xp: 0,
      rank: 'Anfänger',
      country: profile.country || 'Unknown',
      device: navigator.userAgent,
      registerDate: nowIso,
      streak: 0,
      wins: 0,
      losses: 0,
      language: profile.language || 'english',
      correctStreak: 0,
      lastLoginDate: nowIso,
      quests: { dailyClaimedDate: null, progress: 0 },
      chestCount: 0,
      online: true,
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, { online: true, updatedAt: serverTimestamp() });
  }
}

export async function setUserOffline(uid) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { online: false, updatedAt: serverTimestamp() });
}

export function userRef(uid) {
  return doc(db, 'users', uid);
}

export async function readUser(uid) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? snap.data() : null;
}

export async function addXp(uid, amount) {
  await updateDoc(userRef(uid), { xp: increment(amount), updatedAt: serverTimestamp() });
}

export async function setLanguage(uid, language) {
  await updateDoc(userRef(uid), { language, updatedAt: serverTimestamp() });
}

export async function updateStats(uid, payload) {
  await updateDoc(userRef(uid), { ...payload, updatedAt: serverTimestamp() });
}

export async function addCustomWord(uid, word) {
  const wordsCol = collection(db, 'users', uid, 'words');
  const wordCount = await getDocs(wordsCol);
  if (wordCount.size >= 50) throw new Error('Word limit reached (50).');
  const ref = doc(wordsCol);
  await setDoc(ref, word);
}

export function watchCustomWords(uid, cb) {
  const wordsCol = collection(db, 'users', uid, 'words');
  return onSnapshot(wordsCol, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function watchLeaderboard(cb) {
  const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(100));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data())));
}

export async function enqueueForDuel(uid, username, language) {
  await setDoc(doc(db, 'duelQueue', uid), {
    uid,
    username,
    language,
    joinedAt: Date.now(),
  });
}

export async function findOpponent(uid, language) {
  const q = query(collection(db, 'duelQueue'), where('language', '==', language), limit(10));
  const snap = await getDocs(q);
  const rival = snap.docs.map((d) => d.data()).find((r) => r.uid !== uid);
  return rival || null;
}

export async function createDuelRoom(players, wordIds) {
  const roomId = `${players[0].uid}_${players[1].uid}_${Date.now()}`;
  await setDoc(doc(db, 'duels', roomId), {
    roomId,
    players,
    wordIds,
    status: 'active',
    startedAt: Date.now(),
    scores: {},
    timer: 60,
  });
  return roomId;
}

export function watchDuel(roomId, cb) {
  return onSnapshot(doc(db, 'duels', roomId), (snap) => cb(snap.data()));
}

export async function submitDuelScore(roomId, uid, score) {
  const roomRef = doc(db, 'duels', roomId);
  await updateDoc(roomRef, { [`scores.${uid}`]: score, updatedAt: serverTimestamp() });
}

export async function incrementWin(uid) {
  await updateDoc(userRef(uid), { wins: increment(1), updatedAt: serverTimestamp() });
}

export async function incrementLoss(uid) {
  await updateDoc(userRef(uid), { losses: increment(1), updatedAt: serverTimestamp() });
}
