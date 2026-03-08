import { watchLeaderboard } from './firebase.js';

export class Leaderboard {
  constructor(root) {
    this.root = root;
    this.unsub = null;
  }

  render() {
    this.root.innerHTML = `
      <div class="game-card">
        <h3>Global Top 100</h3>
        <div class="leaderboard-head">
          <span>#</span><span>User</span><span>Rank</span><span>XP</span><span>Country</span>
        </div>
        <div id="leaderboardRows"></div>
      </div>
    `;
    const rows = this.root.querySelector('#leaderboardRows');
    this.unsub?.();
    this.unsub = watchLeaderboard((users) => {
      rows.innerHTML = users
        .map(
          (u, idx) => `<div class="leader-row"><span>${idx + 1}</span><span>${u.username || 'Unknown'}</span><span>${u.rank || '-'}</span><span>${u.xp || 0}</span><span>${u.country || '-'}</span></div>`,
        )
        .join('');
    });
  }

  destroy() {
    this.unsub?.();
  }
}
