import { WORDS, SYN_ANT } from './words.js';

function pickLanguageField(language) {
  if (language === 'russian') return 'russian';
  if (language === 'ukrainian') return 'ukrainian';
  return 'english';
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function randomItems(source, count) {
  return shuffle(source).slice(0, count);
}

export class WordGame {
  constructor({ root, onCorrect, onWrong, language = 'english', correctAudio, wrongAudio }) {
    this.root = root;
    this.onCorrect = onCorrect;
    this.onWrong = onWrong;
    this.language = language;
    this.correctAudio = correctAudio;
    this.wrongAudio = wrongAudio;
    this.current = null;
    this.correctStreak = 0;
    this.learned = 0;
  }

  setLanguage(language) {
    this.language = language;
  }

  getTranslation(word) {
    return word[pickLanguageField(this.language)] || word.english;
  }

  createQuestion() {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const correct = this.getTranslation(word);
    const wrongPool = WORDS.filter((w) => w.id !== word.id).map((w) => this.getTranslation(w));
    const options = shuffle([correct, ...randomItems(wrongPool, 3)]);
    return { word, correct, options };
  }

  render() {
    const q = this.createQuestion();
    this.current = q;
    this.root.innerHTML = `
      <div class="game-card">
        <h3>Translate the German word</h3>
        <div class="word-display">${q.word.german}</div>
        <div class="option-grid">
          ${q.options
            .map((opt) => `<button class="option-btn" data-answer="${opt.replace(/"/g, '&quot;')}">${opt}</button>`)
            .join('')}
        </div>
        <p class="muted">Correct answers: +5 XP</p>
      </div>
    `;

    this.root.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.handleAnswer(btn.dataset.answer, btn));
    });
  }

  animateXP() {
    const tag = document.createElement('div');
    tag.className = 'xp-float';
    tag.textContent = '+5 XP';
    this.root.appendChild(tag);
    setTimeout(() => tag.remove(), 900);
  }

  async handleAnswer(answer, button) {
    if (answer === this.current.correct) {
      button.classList.add('correct');
      this.correctAudio?.play().catch(() => {});
      this.animateXP();
      this.correctStreak += 1;
      this.learned += 1;
      await this.onCorrect({ xp: 5, correctStreak: this.correctStreak, learned: this.learned });
      setTimeout(() => this.render(), 500);
    } else {
      button.classList.add('wrong');
      this.wrongAudio?.play().catch(() => {});
      this.correctStreak = 0;
      await this.onWrong({ correctStreak: this.correctStreak });
    }
  }
}

export class SynAntGame {
  constructor({ root, onCorrect, onWrong }) {
    this.root = root;
    this.onCorrect = onCorrect;
    this.onWrong = onWrong;
  }

  render() {
    const item = SYN_ANT[Math.floor(Math.random() * SYN_ANT.length)];
    const mode = Math.random() > 0.5 ? 'synonym' : 'antonym';
    const correct = item[mode];
    const wrongSource = SYN_ANT.flatMap((x) => [x.synonym, x.antonym]).filter((w) => w !== correct);
    const options = shuffle([correct, ...randomItems(wrongSource, 3)]);

    this.root.innerHTML = `
      <div class="game-card">
        <h3>Choose ${mode} for <span class="accent">${item.german}</span></h3>
        <div class="option-grid">
          ${options.map((o) => `<button class="option-btn" data-answer="${o}">${o}</button>`).join('')}
        </div>
      </div>
    `;

    this.root.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (btn.dataset.answer === correct) {
          btn.classList.add('correct');
          await this.onCorrect({ xp: 5 });
          setTimeout(() => this.render(), 450);
        } else {
          btn.classList.add('wrong');
          await this.onWrong();
        }
      });
    });
  }
}
