import { VOCAB } from './data.js';

const STORAGE_KEY = 'yomunavi-mvp-state';
const DAY = 24 * 60 * 60 * 1000;
const BOX_INTERVALS = [0, 1 * DAY, 2 * DAY, 4 * DAY, 7 * DAY, 14 * DAY];

const tabs = document.querySelectorAll('.tab');
const homePage = document.getElementById('home-page');
const studyApp = document.getElementById('study-app');
const enterAppBtn = document.getElementById('enter-app-btn');
const enterAppBtnMain = document.getElementById('enter-app-btn-main');
const backHomeBtn = document.getElementById('back-home-btn');
const contentArea = document.getElementById('content-area');
const template = document.getElementById('word-template');
const resetBtn = document.getElementById('reset-btn');
const showKana = document.getElementById('show-kana');
const showRomaji = document.getElementById('show-romaji');
const autoSpeak = document.getElementById('auto-speak');
const voiceStatus = document.getElementById('voice-status');
const todayCountEl = document.getElementById('today-count');
const streakCountEl = document.getElementById('streak-count');
const dueCountEl = document.getElementById('due-count');

const state = createState();
const tts = createTTS();
let sfxContext = null;

init();

function init() {
  bindEvents();
  showHome();
  refreshStats();
  renderTab(state.activeTab);
}

function bindEvents() {
  if (enterAppBtn instanceof HTMLElement) {
    enterAppBtn.addEventListener('click', showStudyApp);
  }
  if (enterAppBtnMain instanceof HTMLElement) {
    enterAppBtnMain.addEventListener('click', showStudyApp);
  }
  if (backHomeBtn instanceof HTMLElement) {
    backHomeBtn.addEventListener('click', showHome);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeTab = tab.dataset.tab || 'learn';
      tabs.forEach((btn) => btn.classList.toggle('is-active', btn === tab));
      renderTab(state.activeTab);
      persist();
    });
  });

  showKana.addEventListener('change', () => renderTab(state.activeTab));
  showRomaji.addEventListener('change', () => renderTab(state.activeTab));
  autoSpeak.checked = Boolean(state.autoSpeak);
  autoSpeak.addEventListener('change', () => {
    state.autoSpeak = autoSpeak.checked;
    persist();
  });

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });
}

function showHome() {
  homePage?.classList.remove('is-hidden');
  studyApp?.classList.add('is-hidden');
}

function showStudyApp() {
  homePage?.classList.add('is-hidden');
  studyApp?.classList.remove('is-hidden');
}

function createState() {
  const raw = safeParse(localStorage.getItem(STORAGE_KEY));
  const cardMap = new Map((raw?.cards || []).map((card) => [card.id, card]));

  const cards = VOCAB.map((word) => {
    return (
      cardMap.get(word.id) || {
        id: word.id,
        box: 0,
        dueAt: 0,
        totalSeen: 0,
        totalCorrect: 0,
        lastStudiedAt: null
      }
    );
  });

  return {
    activeTab: raw?.activeTab || 'learn',
    activeWordId: raw?.activeWordId || VOCAB[0].id,
    cards,
    activity: raw?.activity || {},
    autoSpeak: Boolean(raw?.autoSpeak),
    wrongQueue: Array.isArray(raw?.wrongQueue) ? raw.wrongQueue.filter((id) => typeof id === 'string') : [],
    quiz: {
      currentWordId: raw?.quiz?.currentWordId || null,
      lastChoice: null,
      isAnswered: false,
      choices: []
    }
  };
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activeTab: state.activeTab,
      activeWordId: state.activeWordId,
      cards: state.cards,
      activity: state.activity,
      autoSpeak: state.autoSpeak,
      wrongQueue: state.wrongQueue,
      quiz: {
        currentWordId: state.quiz.currentWordId
      }
    })
  );
}

function refreshStats() {
  const today = localDateKey(Date.now());
  const studiedToday = state.activity[today] || 0;
  const dueCount = getDueWords().length;

  todayCountEl.textContent = String(studiedToday);
  dueCountEl.textContent = String(dueCount);
  streakCountEl.textContent = `${calcStreak()} 天`;
}

function renderTab(tab) {
  if (tab === 'learn') {
    renderLearn();
  } else if (tab === 'quiz') {
    renderQuiz();
  } else {
    renderReview();
  }

  refreshStats();
}

function renderLearn() {
  const word = getWordById(state.activeWordId) || VOCAB[0];
  if (!word) {
    contentArea.innerHTML = '<p class="empty">词库为空。</p>';
    return;
  }

  const node = renderWordPanel(word);
  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = [
    '<button class="primary" data-result="good" type="button">认识这个词</button>',
    '<button class="warn" data-result="again" type="button">不熟，再来一次</button>',
    '<button class="secondary" data-result="next" type="button">跳过下一个</button>'
  ].join('');

  actions.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const result = target.dataset.result;
    if (result === 'good') {
      applyReview(word.id, true);
      state.activeWordId = nextWordId(word.id);
    } else if (result === 'again') {
      applyReview(word.id, false);
    } else {
      state.activeWordId = nextWordId(word.id);
    }

    persist();
    renderLearn();
  });

  contentArea.replaceChildren(node, actions);
  maybeAutoSpeak(word.ja);
}

function renderQuiz() {
  if (!state.quiz.currentWordId || !Array.isArray(state.quiz.choices) || state.quiz.choices.length < 2) {
    setNextQuizQuestion();
  }

  const word = getWordById(state.quiz.currentWordId);
  if (!word) {
    contentArea.innerHTML = '<p class="empty">暂时没有可测验词条。</p>';
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'quiz';

  const title = document.createElement('h2');
  title.textContent = `「${word.ja}」的中文意思是？`;
  wrapper.appendChild(title);

  if (showKana.checked) {
    const kana = document.createElement('p');
    kana.className = 'reading';
    kana.textContent = word.kana;
    wrapper.appendChild(kana);
  }

  const options = document.createElement('div');
  options.className = 'quiz-options';

  state.quiz.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = choice;

    if (state.quiz.isAnswered) {
      if (choice === word.zh) {
        btn.classList.add('correct');
      } else if (choice === state.quiz.lastChoice) {
        btn.classList.add('wrong');
      }
      btn.disabled = true;
    }

    btn.addEventListener('click', () => {
      if (state.quiz.isAnswered) {
        return;
      }
      const correct = choice === word.zh;
      state.quiz.lastChoice = choice;
      state.quiz.isAnswered = true;
      applyReview(word.id, correct);
      if (correct) {
        playCorrectSfx();
      } else {
        enqueueWrongWord(word.id);
        playWrongSfx();
        setTimeout(() => {
          setNextQuizQuestion();
          persist();
          renderQuiz();
        }, 280);
        persist();
        renderQuiz();
        return;
      }
      persist();
      renderQuiz();
    });

    options.appendChild(btn);
  });

  wrapper.appendChild(options);
  const speakQuestionBtn = document.createElement('button');
  speakQuestionBtn.type = 'button';
  speakQuestionBtn.className = 'secondary';
  speakQuestionBtn.textContent = '发音：题目单词';
  speakQuestionBtn.style.marginTop = '0.75rem';
  speakQuestionBtn.addEventListener('click', () => speak(word.ja));
  wrapper.appendChild(speakQuestionBtn);

  if (state.quiz.isAnswered) {
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'primary';
    nextBtn.textContent = '下一题';
    nextBtn.style.marginTop = '0.75rem';
    nextBtn.addEventListener('click', () => {
      setNextQuizQuestion();
      persist();
      renderQuiz();
    });
    wrapper.appendChild(nextBtn);
  }

  contentArea.replaceChildren(wrapper);
  maybeAutoSpeak(word.ja);
}

function renderReview() {
  const dueWords = getDueWords();
  if (dueWords.length === 0) {
    contentArea.innerHTML = '<p class="empty">当前没有到期复习词条，明天再来。</p>';
    return;
  }

  const word = dueWords[0];
  const node = renderWordPanel(word);

  const tip = document.createElement('p');
  tip.className = 'secondary';
  tip.textContent = `还有 ${dueWords.length - 1} 个词待复习`;

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = [
    '<button class="primary" data-review="good" type="button">记住了</button>',
    '<button class="warn" data-review="again" type="button">没记住</button>'
  ].join('');

  actions.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const review = target.dataset.review;
    applyReview(word.id, review === 'good');
    persist();
    renderReview();
  });

  contentArea.replaceChildren(node, tip, actions);
  maybeAutoSpeak(word.ja);
}

function renderWordPanel(word) {
  const fragment = template.content.cloneNode(true);
  const panel = fragment.querySelector('.word-panel');
  if (!panel) {
    return document.createElement('div');
  }

  const set = (role, value) => {
    const el = panel.querySelector(`[data-role="${role}"]`);
    if (el) {
      el.textContent = value || '';
    }
  };

  set('jlpt', `${word.jlpt} / ${word.part}`);
  set('ja', word.ja);
  set('kana', showKana.checked ? word.kana : '');
  set('romaji', showRomaji.checked ? word.romaji : '');
  set('zh', word.zh);
  set('part', `词性：${word.part}`);
  set('sentence-ja', word.sentenceJa);
  set('sentence-zh', word.sentenceZh);

  const speakWordBtn = panel.querySelector('[data-action="speak-word"]');
  const speakSentenceBtn = panel.querySelector('[data-action="speak-sentence"]');
  if (speakWordBtn instanceof HTMLElement) {
    speakWordBtn.addEventListener('click', () => speak(word.ja));
  }
  if (speakSentenceBtn instanceof HTMLElement) {
    speakSentenceBtn.addEventListener('click', () => speak(word.sentenceJa));
  }

  return panel;
}

function applyReview(wordId, isCorrect) {
  const card = getCard(wordId);
  const now = Date.now();

  card.totalSeen += 1;
  if (isCorrect) {
    card.totalCorrect += 1;
    card.box = Math.min(card.box + 1, BOX_INTERVALS.length - 1);
  } else {
    card.box = 0;
  }

  const waitTime = isCorrect ? BOX_INTERVALS[card.box] : 10 * 60 * 1000;
  card.dueAt = now + waitTime;
  card.lastStudiedAt = now;

  const dayKey = localDateKey(now);
  state.activity[dayKey] = (state.activity[dayKey] || 0) + 1;
}

function setNextQuizQuestion() {
  const wrongId = shiftNextWrongWord();
  const fallback = shuffle([...VOCAB])[0] || VOCAB[0];
  const target = getWordById(wrongId) || fallback;
  state.quiz.currentWordId = target.id;
  state.quiz.lastChoice = null;
  state.quiz.isAnswered = false;

  const choices = new Set([target.zh]);
  for (const word of shuffle([...VOCAB])) {
    if (choices.size >= 4) {
      break;
    }
    choices.add(word.zh);
  }

  state.quiz.choices = shuffle([...choices]);
}

function enqueueWrongWord(wordId) {
  if (!state.wrongQueue.includes(wordId)) {
    state.wrongQueue.push(wordId);
  }
}

function shiftNextWrongWord() {
  while (state.wrongQueue.length > 0) {
    const id = state.wrongQueue.shift();
    if (id && getWordById(id)) {
      return id;
    }
  }
  return null;
}

function getDueWords() {
  const now = Date.now();
  const dueIds = state.cards.filter((card) => card.dueAt <= now).map((card) => card.id);
  return dueIds.map(getWordById).filter(Boolean);
}

function getCard(wordId) {
  const card = state.cards.find((item) => item.id === wordId);
  if (!card) {
    throw new Error(`card not found: ${wordId}`);
  }
  return card;
}

function getWordById(id) {
  return VOCAB.find((word) => word.id === id);
}

function nextWordId(currentId) {
  const currentIndex = VOCAB.findIndex((word) => word.id === currentId);
  if (currentIndex < 0) {
    return VOCAB[0].id;
  }
  return VOCAB[(currentIndex + 1) % VOCAB.length].id;
}

function calcStreak() {
  const days = Object.keys(state.activity)
    .filter((key) => state.activity[key] > 0)
    .sort();

  if (days.length === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date();

  while (true) {
    const key = localDateKey(cursor.getTime());
    if (!state.activity[key]) {
      break;
    }
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY);
  }

  return streak;
}

function localDateKey(ts) {
  const date = new Date(ts);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function createTTS() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  const data = {
    supported,
    voice: null
  };

  if (!supported) {
    voiceStatus.textContent = '语音：当前浏览器不支持';
    return data;
  }

  const resolveVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    data.voice = choosePreferredVoice(voices);
    voiceStatus.textContent = data.voice ? `语音：${data.voice.name}` : '语音：系统默认';
  };

  resolveVoice();
  window.speechSynthesis.onvoiceschanged = resolveVoice;
  return data;
}

function choosePreferredVoice(voices) {
  const jaVoices = voices.filter((voice) => voice.lang.startsWith('ja'));
  if (jaVoices.length === 0) {
    return null;
  }
  const femaleHints = ['kyoko', 'female', 'siri', 'nanami', 'haruka', 'sayaka'];
  const female = jaVoices.find((voice) => femaleHints.some((hint) => voice.name.toLowerCase().includes(hint)));
  return female || jaVoices[0];
}

function speak(text) {
  if (!tts.supported || !text) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.95;
  utterance.pitch = 1;
  if (tts.voice) {
    utterance.voice = tts.voice;
  }
  window.speechSynthesis.speak(utterance);
}

function maybeAutoSpeak(text) {
  if (state.autoSpeak) {
    speak(text);
  }
}

function playCorrectSfx() {
  const ctx = getSfxContext();
  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, index) => {
    const start = now + index * 0.075;
    const end = start + 0.12;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end);
  });

  const sparkleStart = now + 0.31;
  const sparkleEnd = sparkleStart + 0.09;
  const sparkleGain = ctx.createGain();
  const sparkle = ctx.createOscillator();
  sparkle.type = 'triangle';
  sparkle.frequency.setValueAtTime(1568, sparkleStart);
  sparkleGain.gain.setValueAtTime(0.0001, sparkleStart);
  sparkleGain.gain.exponentialRampToValueAtTime(0.09, sparkleStart + 0.012);
  sparkleGain.gain.exponentialRampToValueAtTime(0.0001, sparkleEnd);
  sparkle.connect(sparkleGain);
  sparkleGain.connect(ctx.destination);
  sparkle.start(sparkleStart);
  sparkle.stop(sparkleEnd);
}

function playWrongSfx() {
  const ctx = getSfxContext();
  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;
  const tones = [220, 185];
  tones.forEach((freq, index) => {
    const start = now + index * 0.12;
    const end = start + 0.22;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.14, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end);
  });
}

function getSfxContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  if (!sfxContext) {
    sfxContext = new AudioContextClass();
  }
  if (sfxContext.state === 'suspended') {
    void sfxContext.resume();
  }
  return sfxContext;
}
