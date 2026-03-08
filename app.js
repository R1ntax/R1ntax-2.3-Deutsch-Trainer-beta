import {
  watchAuthState,
  signInGoogle,
  signInFacebook,
  signInEmail,
  registerEmail,
  signOutUser,
  sendPhoneCode,
  verifyPhoneCode,
  ensureUserDoc,
  setUserOffline,
  readUser,
  addXp,
  updateStats,
  setLanguage,
  watchCustomWords,
  addCustomWord,
  track,
} from './firebase.js';
import { WordGame, SynAntGame } from './game.js';
import { DuelSystem } from './duel.js';
import { Leaderboard } from './leaderboard.js';
import { AdminPanel } from './admin.js';

const RANKS = [
  { xp: 0, name: 'Anfänger', icon: 'icons/rank1.png' },
  { xp: 200, name: 'Schüler', icon: 'icons/rank2.png' },
  { xp: 400, name: 'Sprachfreund', icon: 'icons/rank3.png' },
  { xp: 600, name: 'Experte', icon: 'icons/rank4.png' },
  { xp: 800, name: 'Meister', icon: 'icons/rank5.png' },
  { xp: 1000, name: 'Legende', icon: 'icons/rank6.png' },
];

const REGION_LANG = {
  US: 'english',
  GB: 'english',
  UA: 'ukrainian',
  RU: 'russian',
  UZ: 'russian',
};

const state = {
  user: null,
  profile: null,
  language: 'english',
  leaderboard: null,
  duel: null,
  admin: null,
  customWordsUnsub: null,
};

const el = {
  authView: document.getElementById('authView'),
  dashboardView: document.getElementById('dashboardView'),
  welcomeName: document.getElementById('welcomeName'),
  regionLabel: document.getElementById('regionLabel'),
  rankIcon: document.getElementById('rankIcon'),
  rankName: document.getElementById('rankName'),
  xpLabel: document.getElementById('xpLabel'),
  xpBar: document.getElementById('xpBar'),
  dailyStreak: document.getElementById('dailyStreak'),
  correctStreak: document.getElementById('correctStreak'),
  winsLabel: document.getElementById('winsLabel'),
  lossesLabel: document.getElementById('lossesLabel'),
  learnView: document.getElementById('learnView'),
  duelView: document.getElementById('duelView'),
  myWordsView: document.getElementById('myWordsView'),
  synAntView: document.getElementById('synAntView'),
  leaderboardView: document.getElementById('leaderboardView'),
  settingsView: document.getElementById('settingsView'),
  adminView: document.getElementById('adminView'),
  toastContainer: document.getElementById('toastContainer'),
  bgMusic: document.getElementById('bgMusic'),
  correctSfx: document.getElementById('correctSfx'),
  wrongSfx: document.getElementById('wrongSfx'),
};

function toast(message) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = message;
  el.toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 2600);
}

async function detectCountry() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return { code: data.country_code || 'US', name: data.country_name || 'Unknown' };
  } catch {
    return { code: 'US', name: 'Fallback' };
  }
}

function getRankByXp(xp) {
  let current = RANKS[0];
  for (const rank of RANKS) if (xp >= rank.xp) current = rank;
  return current;
}

function updateDashboard() {
  const p = state.profile;
  if (!p) return;
  const rank = getRankByXp(p.xp || 0);
  const next = RANKS.find((r) => r.xp > rank.xp) || { xp: rank.xp + 200 };
  const progress = Math.min(100, (((p.xp || 0) - rank.xp) / Math.max(1, next.xp - rank.xp)) * 100);

  el.welcomeName.textContent = `Welcome, ${p.username}`;
  el.regionLabel.textContent = `Region: ${p.country}`;
  el.rankIcon.src = rank.icon;
  el.rankName.textContent = rank.name;
  el.xpLabel.textContent = `XP: ${p.xp || 0}`;
  el.xpBar.style.width = `${progress}%`;
  el.dailyStreak.textContent = `${p.streak || 0} 🔥`;
  el.correctStreak.textContent = `${p.correctStreak || 0} ⚡`;
  el.winsLabel.textContent = p.wins || 0;
  el.lossesLabel.textContent = p.losses || 0;
}

async function refreshProfile() {
  if (!state.user) return;
  state.profile = await readUser(state.user.uid);
  state.language = state.profile?.language || state.language;
  updateDashboard();
}

async function addXpAndRefresh(amount) {
  await addXp(state.user.uid, amount);
  await refreshProfile();
}

async function setupUser(user) {
  const country = await detectCountry();
  const language = REGION_LANG[country.code] || 'english';
  await ensureUserDoc(user, { country: country.name, language });
  state.user = user;
  await refreshProfile();

  el.authView.classList.add('hidden');
  el.dashboardView.classList.remove('hidden');

  initModules();
  renderSettings();
  renderMyWords();

  const nowDay = new Date().toDateString();
  if (state.profile.lastLoginDate?.slice(0, 15) !== nowDay) {
    await updateStats(state.user.uid, { streak: (state.profile.streak || 0) + 1, lastLoginDate: new Date().toISOString() });
    await refreshProfile();
  }
  track('login_success', { uid: user.uid });
}

function hideAllSubViews() {
  document.querySelectorAll('.sub-view').forEach((v) => v.classList.add('hidden'));
}

function openView(id) {
  hideAllSubViews();
  document.getElementById(id).classList.remove('hidden');
}

function initModules() {
  const wordGame = new WordGame({
    root: el.learnView,
    language: state.language,
    correctAudio: el.correctSfx,
    wrongAudio: el.wrongSfx,
    onCorrect: async ({ xp, correctStreak, learned }) => {
      await addXpAndRefresh(xp);
      await updateStats(state.user.uid, { correctStreak, 'quests.progress': learned });
      toast(`Correct! +${xp} XP`);
      track('correct_answer', { uid: state.user.uid, xp });
    },
    onWrong: async ({ correctStreak }) => {
      await updateStats(state.user.uid, { correctStreak });
      toast('Wrong answer, retry!');
    },
  });
  wordGame.render();

  const synAnt = new SynAntGame({
    root: el.synAntView,
    onCorrect: async ({ xp }) => {
      await addXpAndRefresh(xp);
      toast('Syn/Ant correct +5 XP');
    },
    onWrong: async () => toast('Wrong in synonym mode'),
  });
  synAnt.render();

  state.duel = new DuelSystem({
    root: el.duelView,
    user: { uid: state.user.uid, username: state.profile.username },
    language: state.language,
    toast,
  });
  state.duel.renderLobby();

  state.leaderboard = new Leaderboard(el.leaderboardView);
  state.leaderboard.render();

  state.admin = new AdminPanel(el.adminView);

  openView('learnView');
}

function renderSettings() {
  el.settingsView.innerHTML = `
    <div class="game-card">
      <h3>Settings</h3>
      <label>Language Pair (German → Target):</label>
      <select id="langSelect">
        <option value="english" ${state.language === 'english' ? 'selected' : ''}>English</option>
        <option value="russian" ${state.language === 'russian' ? 'selected' : ''}>Russian</option>
        <option value="ukrainian" ${state.language === 'ukrainian' ? 'selected' : ''}>Ukrainian</option>
      </select>
      <div class="row gap-sm top-sm">
        <button id="saveLangBtn" class="btn">Save language</button>
        <button id="musicToggleBtn" class="btn btn-secondary">Toggle music</button>
        <button id="adminToggleBtn" class="btn btn-secondary">Open admin</button>
      </div>
    </div>
  `;

  el.settingsView.querySelector('#saveLangBtn').addEventListener('click', async () => {
    const language = el.settingsView.querySelector('#langSelect').value;
    await setLanguage(state.user.uid, language);
    state.language = language;
    toast(`Language set: ${language}`);
    track('language_switch', { language });
  });

  el.settingsView.querySelector('#musicToggleBtn').addEventListener('click', async () => {
    if (el.bgMusic.paused) {
      await el.bgMusic.play().catch(() => {});
      toast('Music on');
    } else {
      el.bgMusic.pause();
      toast('Music off');
    }
  });

  el.settingsView.querySelector('#adminToggleBtn').addEventListener('click', () => {
    openView('adminView');
    state.admin.render();
  });
}

function renderMyWords() {
  el.myWordsView.innerHTML = `
    <div class="game-card">
      <h3>My Words (max 50)</h3>
      <form id="customWordForm" class="grid-2">
        <input id="cwGerman" placeholder="German" required />
        <input id="cwTranslation" placeholder="Translation" required />
        <button class="btn" type="submit">Add word</button>
      </form>
      <div id="customWordList" class="list"></div>
    </div>
  `;

  el.myWordsView.querySelector('#customWordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await addCustomWord(state.user.uid, {
        german: el.myWordsView.querySelector('#cwGerman').value.trim(),
        translation: el.myWordsView.querySelector('#cwTranslation').value.trim(),
        createdAt: Date.now(),
      });
      e.target.reset();
      toast('Word added');
    } catch (err) {
      toast(err.message);
    }
  });

  state.customWordsUnsub?.();
  state.customWordsUnsub = watchCustomWords(state.user.uid, (words) => {
    el.myWordsView.querySelector('#customWordList').innerHTML = words
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((w) => `<div class="list-item"><strong>${w.german}</strong> → ${w.translation}</div>`)
      .join('');
  });
}

function setupParticles() {
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: 110 }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  }));

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      glow.addColorStop(0, 'rgba(144,238,255,0.9)');
      glow.addColorStop(1, 'rgba(144,238,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

function bindUI() {
  document.getElementById('googleLoginBtn').addEventListener('click', () => signInGoogle().catch((e) => toast(e.message)));
  document.getElementById('facebookLoginBtn').addEventListener('click', () => signInFacebook().catch((e) => toast(e.message)));
  document.getElementById('phoneLoginBtn').addEventListener('click', () => document.getElementById('phoneAuthContainer').classList.toggle('hidden'));
  document.getElementById('telegramLoginBtn').addEventListener('click', () => toast('Telegram widget integration point.'));

  document.getElementById('sendPhoneCodeBtn').addEventListener('click', async () => {
    await sendPhoneCode(document.getElementById('phoneInput').value.trim()).catch((e) => toast(e.message));
    toast('SMS code sent');
  });

  document.getElementById('verifyPhoneCodeBtn').addEventListener('click', async () => {
    await verifyPhoneCode(document.getElementById('phoneCodeInput').value.trim()).catch((e) => toast(e.message));
  });

  document.getElementById('emailAuthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passwordInput').value.trim();
    await signInEmail(email, pass).catch((err) => toast(err.message));
  });

  document.getElementById('registerBtn').addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passwordInput').value.trim();
    await registerEmail(email, pass).catch((e) => toast(e.message));
  });

  document.querySelectorAll('.menu-btn').forEach((btn) => btn.addEventListener('click', () => openView(btn.dataset.view)));

  document.getElementById('dailyQuestBtn').addEventListener('click', async () => {
    const today = new Date().toDateString();
    if (state.profile.quests?.dailyClaimedDate === today) return toast('Daily quest already claimed');
    await addXp(state.user.uid, 15);
    await updateStats(state.user.uid, { 'quests.dailyClaimedDate': today });
    toast('Daily quest reward +15 XP');
    await refreshProfile();
  });

  document.getElementById('openChestBtn').addEventListener('click', async () => {
    const reward = [10, 20, 30][Math.floor(Math.random() * 3)];
    const box = document.createElement('div');
    box.className = 'chest-pop';
    box.textContent = `Chest opened! +${reward} XP`;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1200);
    await addXpAndRefresh(reward);
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (state.user) await setUserOffline(state.user.uid).catch(() => {});
    await signOutUser();
    location.reload();
  });
}

watchAuthState((user) => {
  if (user) setupUser(user);
});

bindUI();
setupParticles();
