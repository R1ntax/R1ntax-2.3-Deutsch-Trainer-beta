import { firebaseServices } from './firebase.js';
import { collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

export class AdminPanel {
  constructor(root) {
    this.root = root;
    this.unsubs = [];
  }

  render() {
    this.root.innerHTML = `
      <div class="game-card">
        <h3>Admin Dashboard</h3>
        <div class="stats-grid">
          <div class="card"><h4>Active Users</h4><p id="adminActive">0</p></div>
          <div class="card"><h4>Online Players</h4><p id="adminOnline">0</p></div>
          <div class="card"><h4>Countries</h4><p id="adminCountries">-</p></div>
          <div class="card"><h4>Devices</h4><p id="adminDevices">-</p></div>
        </div>
      </div>
    `;

    const usersCol = collection(firebaseServices.db, 'users');
    this.unsubs.push(
      onSnapshot(usersCol, (snap) => {
        const users = snap.docs.map((d) => d.data());
        this.root.querySelector('#adminActive').textContent = users.length;
        this.root.querySelector('#adminCountries').textContent = [...new Set(users.map((u) => u.country || 'Unknown'))].join(', ');
        this.root.querySelector('#adminDevices').textContent = `${new Set(users.map((u) => (u.device || '').split(' ')[0])).size} unique`; 
      }),
    );

    this.unsubs.push(
      onSnapshot(query(usersCol, where('online', '==', true)), (snap) => {
        this.root.querySelector('#adminOnline').textContent = snap.size;
      }),
    );
  }

  destroy() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }
}
