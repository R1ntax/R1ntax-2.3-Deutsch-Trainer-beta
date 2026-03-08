import { WORDS } from './words.js';
import {
  enqueueForDuel,
  findOpponent,
  createDuelRoom,
  watchDuel,
  submitDuelScore,
  addXp,
  incrementWin,
  incrementLoss,
} from './firebase.js';

function sampleWordIds(n = 8) {
  return [...WORDS].sort(() => Math.random() - 0.5).slice(0, n).map((w) => w.id);
}

export class DuelSystem {
  constructor({ root, user, language, toast }) {
    this.root = root;
    this.user = user;
    this.language = language;
    this.toast = toast;
    this.roomId = null;
    this.unsub = null;
    this.state = { score: 0, answered: 0, timer: 60 };
    this.countdown = null;
  }

  renderLobby() {
    this.root.innerHTML = `
      <div class="game-card">
        <h3>Online Duel</h3>
        <p>Queue with players in your language bucket and race to solve words.</p>
        <button id="startQueueBtn" class="btn btn-glow">Join Matchmaking</button>
        <div id="duelStatus" class="muted"></div>
      </div>
    `;
    this.root.querySelector('#startQueueBtn').addEventListener('click', () => this.joinQueue());
  }

  async joinQueue() {
    const status = this.root.querySelector('#duelStatus');
    status.textContent = 'Joining duel queue...';
    await enqueueForDuel(this.user.uid, this.user.username, this.language);
    status.textContent = 'Searching opponent...';

    const rival = await findOpponent(this.user.uid, this.language);
    if (!rival) {
      status.textContent = 'Waiting for rival. Stay on this screen.';
      return;
    }

    const roomId = await createDuelRoom([{ uid: this.user.uid, username: this.user.username }, rival], sampleWordIds());
    this.roomId = roomId;
    this.startDuel(roomId);
  }

  startDuel(roomId) {
    this.state = { score: 0, answered: 0, timer: 60 };
    this.root.innerHTML = `
      <div class="game-card">
        <h3>Duel in progress</h3>
        <p>Timer: <span id="duelTimer">60</span>s</p>
        <p>Score: <span id="duelScore">0</span></p>
        <button id="duelCorrectBtn" class="btn">Simulate Correct (+1)</button>
      </div>
    `;

    this.root.querySelector('#duelCorrectBtn').addEventListener('click', async () => {
      this.state.score += 1;
      this.state.answered += 1;
      this.root.querySelector('#duelScore').textContent = this.state.score;
      await submitDuelScore(roomId, this.user.uid, this.state.score);
    });

    this.countdown = setInterval(() => {
      this.state.timer -= 1;
      this.root.querySelector('#duelTimer').textContent = this.state.timer;
      if (this.state.timer <= 0) {
        clearInterval(this.countdown);
        this.finishDuel();
      }
    }, 1000);

    this.unsub = watchDuel(roomId, (room) => {
      if (!room?.scores) return;
      const entries = Object.entries(room.scores);
      if (entries.length >= 2 && this.state.timer <= 0) this.finishDuel(room.scores);
    });
  }

  async finishDuel(scores = null) {
    if (this.unsub) this.unsub();
    if (this.countdown) clearInterval(this.countdown);
    const allScores = scores || { [this.user.uid]: this.state.score };
    const myScore = allScores[this.user.uid] || 0;
    const rivalScore = Math.max(...Object.entries(allScores).filter(([id]) => id !== this.user.uid).map(([, s]) => s), 0);

    let resultText = 'Draw';
    if (myScore > rivalScore) {
      resultText = 'Victory! +20 XP';
      await addXp(this.user.uid, 20);
      await incrementWin(this.user.uid);
    } else if (myScore < rivalScore) {
      resultText = 'Defeat';
      await incrementLoss(this.user.uid);
    }

    this.root.innerHTML = `
      <div class="game-card">
        <h3>Duel Finished</h3>
        <p>Your score: ${myScore}</p>
        <p>Opponent score: ${rivalScore}</p>
        <p class="accent">${resultText}</p>
        <button id="duelBackBtn" class="btn">Back to lobby</button>
      </div>
    `;
    this.root.querySelector('#duelBackBtn').addEventListener('click', () => this.renderLobby());
    this.toast(resultText);
  }
}
