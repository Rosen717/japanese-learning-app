import { VOCAB, GRAMMAR } from './data.js';

const STORAGE_KEY = 'yomunavi-mvp-state';
const DAY = 24 * 60 * 60 * 1000;
const BOX_INTERVALS = [0, 1 * DAY, 2 * DAY, 4 * DAY, 7 * DAY, 14 * DAY];
const DAILY_TARGET = 30;

const tabs = document.querySelectorAll('.tab');
const homePage = document.getElementById('home-page');
const studyApp = document.getElementById('study-app');
const enterAppBtn = document.getElementById('enter-app-btn');
const enterAppBtnMain = document.getElementById('enter-app-btn-main');
const enterDictBtn = document.getElementById('enter-dict-btn');
const enterDictBtnMain = document.getElementById('enter-dict-btn-main');
const homeSearchBtn = document.getElementById('home-search-btn');
const appSearchBtn = document.getElementById('app-search-btn');
const homeFeatureLinks = document.querySelectorAll('.feature-link');
const backHomeBtn = document.getElementById('back-home-btn');
const globalSearchModal = document.getElementById('global-search-modal');
const closeSearchBtn = document.getElementById('close-search-btn');
const globalSearchInput = document.getElementById('global-search-input');
const globalSearchTotal = document.getElementById('global-search-total');
const globalSearchList = document.getElementById('global-search-list');
const contentArea = document.getElementById('content-area');
const template = document.getElementById('word-template');
const resetBtn = document.getElementById('reset-btn');
const showKana = document.getElementById('show-kana');
const showRomaji = document.getElementById('show-romaji');
const autoSpeak = document.getElementById('auto-speak');
const quizWrongOnly = document.getElementById('quiz-wrong-only');
const voiceStatus = document.getElementById('voice-status');
const contentToolbar = document.querySelector('.toolbar');
const statsGrid = document.querySelector('.stats-grid');
const tabsNav = document.querySelector('.tabs');
const todayCountEl = document.getElementById('today-count');
const streakCountEl = document.getElementById('streak-count');
const dueCountEl = document.getElementById('due-count');
const goalCountEl = document.getElementById('goal-count');
const accuracyCountEl = document.getElementById('accuracy-count');
const wrongCountEl = document.getElementById('wrong-count');

const state = createState();
const tts = createTTS();
let sfxContext = null;
let dictionaryEntries = [...VOCAB];
let dictionaryLoaded = false;
let dictionaryLoading = false;
let wordIndex = buildWordIndex(dictionaryEntries);

init();

function init() {
  bindEvents();
  showStudyApp(state.activeTab || 'book');
  void ensureDictionaryData();
  refreshStats();
}

function bindEvents() {
  if (enterAppBtn instanceof HTMLElement) {
    enterAppBtn.addEventListener('click', () => showStudyApp('book'));
  }
  if (enterAppBtnMain instanceof HTMLElement) {
    enterAppBtnMain.addEventListener('click', () => showStudyApp('book'));
  }
  if (enterDictBtn instanceof HTMLElement) {
    enterDictBtn.addEventListener('click', () => showStudyApp('dictionary'));
  }
  if (enterDictBtnMain instanceof HTMLElement) {
    enterDictBtnMain.addEventListener('click', () => showStudyApp('dictionary'));
  }
  if (homeSearchBtn instanceof HTMLElement) {
    homeSearchBtn.addEventListener('click', () => openQuickSearch());
  }
  if (appSearchBtn instanceof HTMLElement) {
    appSearchBtn.addEventListener('click', () => openQuickSearch());
  }
  if (closeSearchBtn instanceof HTMLElement) {
    closeSearchBtn.addEventListener('click', closeQuickSearch);
  }
  if (globalSearchModal instanceof HTMLElement) {
    globalSearchModal.addEventListener('click', (event) => {
      if (event.target === globalSearchModal) {
        closeQuickSearch();
      }
    });
  }
  if (globalSearchInput instanceof HTMLInputElement) {
    let isComposing = false;
    globalSearchInput.addEventListener('compositionstart', () => {
      isComposing = true;
    });
    globalSearchInput.addEventListener('compositionend', () => {
      isComposing = false;
      state.search.keyword = globalSearchInput.value.trim();
      persist();
      updateSearchResults(globalSearchList, globalSearchTotal);
    });
    globalSearchInput.addEventListener('input', () => {
      if (isComposing) {
        return;
      }
      state.search.keyword = globalSearchInput.value.trim();
      persist();
      updateSearchResults(globalSearchList, globalSearchTotal);
    });
  }
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && globalSearchModal && !globalSearchModal.classList.contains('is-hidden')) {
      closeQuickSearch();
    }
  });
  homeFeatureLinks.forEach((card) => {
    const targetTab = card.getAttribute('data-home-tab');
    if (!targetTab) {
      return;
    }
    card.addEventListener('click', () => showStudyApp(targetTab));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showStudyApp(targetTab);
      }
    });
  });
  if (backHomeBtn instanceof HTMLElement) {
    backHomeBtn.addEventListener('click', showHome);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeTab = tab.dataset.tab || 'book';
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
  quizWrongOnly.checked = Boolean(state.quizWrongOnly);
  quizWrongOnly.addEventListener('change', () => {
    state.quizWrongOnly = quizWrongOnly.checked;
    state.quiz.currentWordId = null;
    state.quiz.choices = [];
    persist();
    renderTab(state.activeTab);
  });

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });
}

function showHome() {
  // Return to the outermost "book shelf" screen instead of marketing landing.
  showStudyApp('book');
}

function showStudyApp(targetTab = null) {
  homePage?.classList.add('is-hidden');
  studyApp?.classList.remove('is-hidden');
  if (targetTab === 'dictionary' || targetTab === 'grammar') {
    void ensureDictionaryData();
  }
  if (targetTab) {
    const nextTab = normalizeTab(targetTab);
    state.activeTab = nextTab;
    tabs.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === nextTab));
    renderTab(nextTab);
    persist();
  }
}

function normalizeTab(tab) {
  const t = String(tab || '');
  if (t === 'learn') return 'card';
  if (t === 'quiz') return 'card';
  if (t === 'review') return 'list';
  if (t === 'handwrite') return 'dictation';
  if (t === 'search') return 'dictionary';
  if (['book', 'list', 'card', 'dictation', 'grammar', 'dictionary'].includes(t)) return t;
  return 'book';
}

function openQuickSearch() {
  if (!globalSearchModal || !globalSearchInput || !globalSearchList || !globalSearchTotal) {
    return;
  }
  if (!dictionaryLoaded) {
    void ensureDictionaryData();
  }
  globalSearchModal.classList.remove('is-hidden');
  globalSearchModal.setAttribute('aria-hidden', 'false');
  globalSearchInput.value = state.search.keyword || '';
  updateSearchResults(globalSearchList, globalSearchTotal);
  globalSearchInput.focus();
}

function closeQuickSearch() {
  if (!globalSearchModal) {
    return;
  }
  globalSearchModal.classList.add('is-hidden');
  globalSearchModal.setAttribute('aria-hidden', 'true');
}

function createState() {
  const raw = safeParse(localStorage.getItem(STORAGE_KEY));
  const rawTab = raw?.activeTab || 'book';
  const activeTab = normalizeTab(rawTab);
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
    activeTab,
    activeWordId: raw?.activeWordId || VOCAB[0].id,
    cards,
    activity: raw?.activity || {},
    autoSpeak: Boolean(raw?.autoSpeak),
    quizWrongOnly: Boolean(raw?.quizWrongOnly),
    wrongQueue: Array.isArray(raw?.wrongQueue) ? raw.wrongQueue.filter((id) => typeof id === 'string') : [],
    quiz: {
      currentWordId: raw?.quiz?.currentWordId || null,
      lastChoice: null,
      isAnswered: false,
      choices: []
    },
    handwrite: {
      currentWordId: raw?.handwrite?.currentWordId || null
    },
    session: {
      ids: Array.isArray(raw?.session?.ids) ? raw.session.ids.filter((x) => typeof x === 'string') : [],
      index: Number.isInteger(raw?.session?.index) ? raw.session.index : 0
    },
    grammar: {
      level: raw?.grammar?.level || 'ALL',
      keyword: raw?.grammar?.keyword || ''
    },
    dictionary: {
      level: raw?.dictionary?.level || 'ALL',
      keyword: raw?.dictionary?.keyword || ''
    },
    book: {
      level: raw?.book?.level || 'ALL'
    },
    list: {
      chunkIndex: Number.isInteger(raw?.list?.chunkIndex) ? raw.list.chunkIndex : 0,
      checkins: raw?.list?.checkins && typeof raw.list.checkins === 'object' ? raw.list.checkins : {},
      startDates: raw?.list?.startDates && typeof raw.list.startDates === 'object' ? raw.list.startDates : {},
      orderIds: Array.isArray(raw?.list?.orderIds) ? raw.list.orderIds.filter((x) => typeof x === 'string') : []
    },
    marks: raw?.marks && typeof raw.marks === 'object' ? raw.marks : {},
    search: {
      keyword: raw?.search?.keyword || ''
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
      quizWrongOnly: state.quizWrongOnly,
      wrongQueue: state.wrongQueue,
      quiz: {
        currentWordId: state.quiz.currentWordId
      },
      handwrite: {
        currentWordId: state.handwrite.currentWordId
      },
      session: {
        ids: state.session.ids,
        index: state.session.index
      },
      grammar: {
        level: state.grammar.level,
        keyword: state.grammar.keyword
      },
      dictionary: {
        level: state.dictionary.level,
        keyword: state.dictionary.keyword
      },
      book: {
        level: state.book.level
      },
      list: {
        chunkIndex: state.list.chunkIndex,
        checkins: state.list.checkins,
        startDates: state.list.startDates,
        orderIds: state.list.orderIds
      },
      marks: state.marks,
      search: {
        keyword: state.search.keyword
      }
    })
  );
}

function refreshStats() {
  const today = localDateKey(Date.now());
  const studiedToday = state.activity[today] || 0;
  const dueCount = getDueWords().length;
  const accuracy = calcAccuracy();
  const goalPercent = Math.min(100, Math.round((studiedToday / DAILY_TARGET) * 100));

  todayCountEl.textContent = String(studiedToday);
  dueCountEl.textContent = String(dueCount);
  streakCountEl.textContent = `${calcStreak()} 天`;
  goalCountEl.textContent = `${studiedToday}/${DAILY_TARGET} (${goalPercent}%)`;
  accuracyCountEl.textContent = `${accuracy}%`;
  wrongCountEl.textContent = String(state.wrongQueue.length);
}

function renderTab(tab) {
  const normalizedTab = normalizeTab(tab);
  state.activeTab = normalizedTab;
  tabs.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === normalizedTab));
  if (statsGrid instanceof HTMLElement) {
    statsGrid.style.display = normalizedTab === 'dictionary' || normalizedTab === 'book' ? 'none' : 'grid';
  }
  if (tabsNav instanceof HTMLElement) {
    tabsNav.style.display = normalizedTab === 'book' ? 'none' : 'grid';
  }
  if (contentToolbar) {
    contentToolbar.style.display = normalizedTab === 'card' ? 'flex' : 'none';
  }
  if (normalizedTab === 'book') {
    renderBook();
  } else if (normalizedTab === 'list') {
    renderListStage();
  } else if (normalizedTab === 'card') {
    renderLearn();
  } else if (normalizedTab === 'dictation') {
    renderHandwrite();
  } else if (normalizedTab === 'grammar') {
    renderGrammar();
  } else if (normalizedTab === 'dictionary') {
    renderDictionary();
  } else {
    renderBook();
  }

  refreshStats();
}

function renderBook() {
  if (state.book.level !== 'ALL') {
    state.book.level = 'ALL';
    persist();
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'book-home';

  const header = document.createElement('div');
  header.className = 'grammar-header';
  header.innerHTML = '<h2>我的词书</h2><p class="secondary">先列表速背，再卡片精学，最后默写巩固</p>';

  const words = getBookWords();
  const known = words.filter((w) => getWordMark(w.id) === 'known').length;
  const fuzzy = words.filter((w) => getWordMark(w.id) === 'fuzzy').length;
  const fresh = words.length - known - fuzzy;

  const deck = document.createElement('section');
  deck.className = 'book-deck';
  deck.innerHTML = [
    '<div class="book-side book-left"><span>Vocabulary</span></div>',
    '<button class="book-main" type="button" aria-label="进入词书学习">',
    '  <h3>Vocabulary</h3>',
    '  <p>Learning Planner</p>',
    '  <i class="book-ribbon" aria-hidden="true"></i>',
    '</button>',
    '<div class="book-side book-right"><span>Word Book</span></div>'
  ].join('');
  deck.querySelector('.book-main')?.addEventListener('click', () => showStudyApp('list'));

  const progress = document.createElement('div');
  progress.className = 'book-progress';
  progress.innerHTML = [
    `<p class="book-progress-main">${known}<span> / ${words.length}</span></p>`,
    '<p class="secondary">已记得 / 总词数</p>',
    `<div class="book-metrics"><p><strong>${fuzzy}</strong><span>模糊</span></p><p><strong>${fresh}</strong><span>未学</span></p></div>`
  ].join('');

  const actions = document.createElement('div');
  actions.className = 'actions';
  const toList = document.createElement('button');
  toList.type = 'button';
  toList.className = 'secondary';
  toList.textContent = '1) 列表速背';
  toList.addEventListener('click', () => showStudyApp('list'));
  const toCard = document.createElement('button');
  toCard.type = 'button';
  toCard.className = 'primary';
  toCard.textContent = '2) 卡片精学';
  toCard.addEventListener('click', () => showStudyApp('card'));
  const toDict = document.createElement('button');
  toDict.type = 'button';
  toDict.className = 'warn';
  toDict.textContent = '3) 默写巩固';
  toDict.addEventListener('click', () => showStudyApp('dictation'));
  actions.append(toList, toCard, toDict);

  wrapper.append(header, deck, progress, actions);
  contentArea.replaceChildren(wrapper);
}

function renderListStage() {
  const words = getMixedAllWords();
  const chunks = splitIntoChunks(words, 20);
  if (chunks.length === 0) {
    contentArea.innerHTML = '<p class="empty">当前等级没有单词。</p>';
    return;
  }
  if (state.list.chunkIndex < 0 || state.list.chunkIndex >= chunks.length) {
    state.list.chunkIndex = 0;
    persist();
  }
  const currentChunk = chunks[state.list.chunkIndex];
  const chunkWords = currentChunk.items;
  const chunkKey = getChunkKey(state.book.level, state.list.chunkIndex);
  const startDate = getChunkStartDate(chunkKey);

  const wrapper = document.createElement('div');
  wrapper.className = 'grammar-page list-stage';

  const header = document.createElement('div');
  header.className = 'grammar-header';
  header.innerHTML = `<h2>单词列表速背</h2><p class="secondary">全部词库 · 每组 20 词</p>`;
  const reshuffleBtn = document.createElement('button');
  reshuffleBtn.type = 'button';
  reshuffleBtn.className = 'ghost-btn small';
  reshuffleBtn.textContent = '重新打乱';
  reshuffleBtn.addEventListener('click', () => {
    state.list.orderIds = buildMixedOrder(getAllWords());
    state.list.chunkIndex = 0;
    persist();
    renderListStage();
  });

  const layout = document.createElement('div');
  layout.className = 'list-layout';

  const rail = document.createElement('aside');
  rail.className = 'list-rail';
  chunks.forEach((chunk, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `level-btn${idx === state.list.chunkIndex ? ' is-active' : ''}`;
    const from = String(chunk.start + 1).padStart(2, '0');
    const to = String(chunk.end).padStart(2, '0');
    btn.textContent = `${from}~${to}`;
    btn.addEventListener('click', () => {
      state.list.chunkIndex = idx;
      persist();
      renderListStage();
    });
    rail.appendChild(btn);
  });

  const board = document.createElement('section');
  board.className = 'list-board';

  const tableWrap = document.createElement('div');
  tableWrap.className = 'checkin-table-wrap';
  const table = document.createElement('table');
  table.className = 'checkin-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>No.</th><th>Date</th><th>First</th><th>Day1</th><th>Day2</th><th>Day4</th><th>Day7</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  const rounds = ['first', 'day1', 'day2', 'day4', 'day7'];
  chunkWords.forEach((word, idx) => {
    const tr = document.createElement('tr');
    const no = idx + 1;
    tr.innerHTML = `<td>${no}</td><td>${formatDateOffset(startDate, idx)}</td>`;
    rounds.forEach((round) => {
      const td = document.createElement('td');
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `check-chip${getCheckin(chunkKey, no, round) ? ' is-on' : ''}`;
      chip.textContent = getCheckin(chunkKey, no, round) ? '✓' : '';
      chip.addEventListener('click', () => {
        toggleCheckin(chunkKey, no, round);
        renderListStage();
      });
      td.appendChild(chip);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  const quickWords = document.createElement('div');
  quickWords.id = 'today-word-list';
  quickWords.className = 'grammar-list';
  chunkWords.forEach((word, idx) => {
    const row = document.createElement('article');
    row.className = 'grammar-card list-row';
    const mark = getWordMark(word.id);
    row.innerHTML = [
      `<p class="badge">${idx + 1}</p>`,
      `<h3>${word.ja} <span class="secondary">${word.kana || ''}</span></h3>`,
      `<p class="meaning">${word.zh}</p>`,
      `<p class="secondary">当前标记：${mark === 'known' ? '已记得' : mark === 'fuzzy' ? '模糊' : '未学'}</p>`
    ].join('');
    row.style.cursor = 'pointer';
    row.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('.speak-row')) {
        return;
      }
      startCardSessionFromChunk(chunkWords, idx);
    });
    const actions = document.createElement('div');
    actions.className = 'speak-row';
    const knownBtn = document.createElement('button');
    knownBtn.className = 'small-btn';
    knownBtn.type = 'button';
    knownBtn.textContent = '已记得';
    knownBtn.addEventListener('click', () => {
      setWordMark(word.id, 'known');
      renderListStage();
    });
    const fuzzyBtn = document.createElement('button');
    fuzzyBtn.className = 'small-btn';
    fuzzyBtn.type = 'button';
    fuzzyBtn.textContent = '模糊';
    fuzzyBtn.addEventListener('click', () => {
      setWordMark(word.id, 'fuzzy');
      renderListStage();
    });
    const freshBtn = document.createElement('button');
    freshBtn.className = 'small-btn';
    freshBtn.type = 'button';
    freshBtn.textContent = '未学';
    freshBtn.addEventListener('click', () => {
      setWordMark(word.id, 'new');
      renderListStage();
    });
    actions.append(knownBtn, fuzzyBtn, freshBtn);
    row.appendChild(actions);
    quickWords.appendChild(row);
  });

  board.append(tableWrap, quickWords);
  layout.append(rail, board);

  const flowActions = document.createElement('div');
  flowActions.className = 'actions';
  flowActions.innerHTML = '<button class="primary" type="button" id="go-card-stage">进入卡片精学</button><button class="secondary" type="button" id="go-dict-stage">进入默写</button>';
  flowActions.querySelector('#go-card-stage')?.addEventListener('click', () => showStudyApp('card'));
  flowActions.querySelector('#go-dict-stage')?.addEventListener('click', () => showStudyApp('dictation'));

  wrapper.append(header, reshuffleBtn, layout, flowActions);
  contentArea.replaceChildren(wrapper);
}

function renderLearn() {
  const word = getWordById(state.activeWordId) || getStudyPool()[0];
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
  quizWrongOnly.checked = Boolean(state.quizWrongOnly);
  if (!state.quiz.currentWordId || !Array.isArray(state.quiz.choices) || state.quiz.choices.length < 2) {
    setNextQuizQuestion();
  }

  const word = getWordById(state.quiz.currentWordId);
  if (!word) {
    if (state.quizWrongOnly) {
      contentArea.innerHTML = '<p class="empty">错题池为空。先做几道普通测验再回来练错题。</p>';
    } else {
      contentArea.innerHTML = '<p class="empty">暂时没有可测验词条。</p>';
    }
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
  const queueTip = document.createElement('p');
  queueTip.className = 'secondary';
  queueTip.textContent = state.quizWrongOnly
    ? `只练错题模式 · 当前错题池 ${state.wrongQueue.length}`
    : `普通测验模式 · 错题池 ${state.wrongQueue.length}`;
  queueTip.style.marginTop = '0.55rem';
  wrapper.appendChild(queueTip);
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

function renderHandwrite() {
  let word = getWordById(state.handwrite.currentWordId);
  if (!word) {
    word = getRandomWord();
    state.handwrite.currentWordId = word?.id || null;
    persist();
  }
  if (!word) {
    contentArea.innerHTML = '<p class="empty">词库为空，无法进行手写练习。</p>';
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'handwrite';

  const title = document.createElement('h2');
  title.textContent = `请手写：${word.zh}`;
  wrapper.appendChild(title);

  const hint = document.createElement('p');
  hint.className = 'secondary';
  hint.textContent = showKana.checked ? `提示假名：${word.kana || '（无）'}` : '可先在脑中想好写法，再下笔。';
  wrapper.appendChild(hint);

  const canvas = document.createElement('canvas');
  canvas.className = 'handwrite-canvas';
  wrapper.appendChild(canvas);

  const answer = document.createElement('p');
  answer.className = 'handwrite-answer secondary';
  answer.textContent = '';
  wrapper.appendChild(answer);
  const evalResult = document.createElement('p');
  evalResult.className = 'handwrite-answer secondary';
  evalResult.textContent = '';
  wrapper.appendChild(evalResult);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'secondary';
  clearBtn.textContent = '清空重写';

  const showBtn = document.createElement('button');
  showBtn.type = 'button';
  showBtn.className = 'secondary';
  showBtn.textContent = '显示答案';

  const evalBtn = document.createElement('button');
  evalBtn.type = 'button';
  evalBtn.className = 'secondary';
  evalBtn.textContent = 'AI判题';

  const goodBtn = document.createElement('button');
  goodBtn.type = 'button';
  goodBtn.className = 'primary';
  goodBtn.textContent = '写对了';

  const againBtn = document.createElement('button');
  againBtn.type = 'button';
  againBtn.className = 'warn';
  againBtn.textContent = '没写好';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'secondary';
  nextBtn.textContent = '下一题';

  actions.append(clearBtn, showBtn, evalBtn, goodBtn, againBtn, nextBtn);
  wrapper.appendChild(actions);
  contentArea.replaceChildren(wrapper);

  const pad = initHandwritePad(canvas);
  clearBtn.addEventListener('click', () => pad.clear());
  showBtn.addEventListener('click', () => {
    answer.textContent = `答案：${word.ja}${word.kana ? `（${word.kana}）` : ''}`;
  });
  evalBtn.addEventListener('click', async () => {
    evalBtn.disabled = true;
    evalBtn.textContent = '判题中...';
    evalResult.textContent = '';
    const result = await evaluateHandwrite(canvas, word.ja);
    if (!result) {
      evalResult.textContent = 'AI判题失败，请确认你是用 run_server.py 启动，并且 OPENAI_API_KEY 正确。';
    } else {
      const prefix = result.isCorrect ? '判定：写对了' : '判定：还不够准确';
      const rec = result.recognized ? `；识别：${result.recognized}` : '';
      evalResult.textContent = `${prefix}（${result.score}分）${rec}。${result.feedback}`;
    }
    evalBtn.disabled = false;
    evalBtn.textContent = 'AI判题';
  });
  goodBtn.addEventListener('click', () => {
    applyReview(word.id, true);
    playCorrectSfx();
    state.handwrite.currentWordId = getRandomWordId(word.id);
    persist();
    renderHandwrite();
  });
  againBtn.addEventListener('click', () => {
    applyReview(word.id, false);
    enqueueWrongWord(word.id);
    playWrongSfx();
    state.handwrite.currentWordId = getRandomWordId(word.id);
    persist();
    renderHandwrite();
  });
  nextBtn.addEventListener('click', () => {
    state.handwrite.currentWordId = getRandomWordId(word.id);
    persist();
    renderHandwrite();
  });
}

function renderGrammar() {
  const wrapper = document.createElement('div');
  wrapper.className = 'grammar-page';

  const header = document.createElement('div');
  header.className = 'grammar-header';
  header.innerHTML = '<h2>语法总览</h2><p class=\"secondary\">N5 到 N1 按等级筛选与搜索</p>';

  const controls = document.createElement('div');
  controls.className = 'grammar-controls';
  const levels = ['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'];
  const levelButtons = document.createElement('div');
  levelButtons.className = 'level-buttons';
  levels.forEach((lvl) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `level-btn${state.grammar.level === lvl ? ' is-active' : ''}`;
    btn.textContent = lvl === 'ALL' ? '全部' : lvl;
    btn.addEventListener('click', () => {
      state.grammar.level = lvl;
      persist();
      levelButtons.querySelectorAll('.level-btn').forEach((node) => {
        node.classList.toggle('is-active', node === btn);
      });
      updateGrammarResults(list, total);
    });
    levelButtons.appendChild(btn);
  });

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'grammar-search';
  search.placeholder = '搜索语法：例如 〜ように / 〜ざるを得ない';
  search.value = state.grammar.keyword;
  let isComposing = false;
  search.addEventListener('compositionstart', () => {
    isComposing = true;
  });
  search.addEventListener('compositionend', () => {
    isComposing = false;
    state.grammar.keyword = search.value.trim();
    persist();
    updateGrammarResults(list, total);
  });
  search.addEventListener('input', () => {
    if (isComposing) {
      return;
    }
    state.grammar.keyword = search.value.trim();
    persist();
    updateGrammarResults(list, total);
  });

  controls.append(levelButtons, search);

  const list = document.createElement('div');
  list.className = 'grammar-list';
  const total = document.createElement('p');
  total.className = 'secondary';
  updateGrammarResults(list, total);
  wrapper.append(header, controls, total, list);
  contentArea.replaceChildren(wrapper);
}

function updateGrammarResults(list, total) {
  const items = getFilteredGrammar();
  list.replaceChildren();
  if (items.length === 0) {
    list.innerHTML = '<p class="empty">没有匹配到语法。</p>';
  } else {
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'grammar-card';
      card.innerHTML = [
        `<p class="badge">${item.level}</p>`,
        `<h3>${item.pattern}</h3>`,
        `<p class="meaning">${item.meaning}</p>`,
        `<p>${item.exampleJa}</p>`,
        `<p class="secondary">${item.exampleZh}</p>`,
        `<p class="secondary">备注：${item.note}</p>`
      ].join('');
      list.appendChild(card);
    });
  }
  total.textContent = `共 ${items.length} 条语法`;
}

function getFilteredGrammar() {
  const level = state.grammar.level;
  const keyword = state.grammar.keyword.toLowerCase();
  return GRAMMAR.filter((item) => {
    if (level !== 'ALL' && item.level !== level) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return [item.pattern, item.meaning, item.exampleJa, item.exampleZh, item.note].join(' ').toLowerCase().includes(keyword);
  });
}

function renderDictionary() {
  if (!dictionaryLoaded) {
    void ensureDictionaryData();
    contentArea.innerHTML = '<p class="empty">词典加载中…</p>';
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'grammar-page';

  const header = document.createElement('div');
  header.className = 'grammar-header';
  header.innerHTML = '<h2>单词词典</h2><p class="secondary">可按 JLPT 等级和关键词检索词条</p>';

  const controls = document.createElement('div');
  controls.className = 'grammar-controls';
  const levels = ['ALL', 'N5', 'N4', 'N3', 'N2', 'N1', 'UNK'];
  const levelButtons = document.createElement('div');
  levelButtons.className = 'level-buttons';
  levels.forEach((lvl) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `level-btn${state.dictionary.level === lvl ? ' is-active' : ''}`;
    btn.textContent = lvl === 'ALL' ? '全部' : lvl === 'UNK' ? '未分级' : lvl;
    btn.addEventListener('click', () => {
      state.dictionary.level = lvl;
      persist();
      levelButtons.querySelectorAll('.level-btn').forEach((node) => {
        node.classList.toggle('is-active', node === btn);
      });
      updateDictionaryResults(list, total);
    });
    levelButtons.appendChild(btn);
  });

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'grammar-search';
  search.placeholder = '搜索单词：例如 食べる / 朋友 / がくせい';
  search.value = state.dictionary.keyword;
  let isComposing = false;
  search.addEventListener('compositionstart', () => {
    isComposing = true;
  });
  search.addEventListener('compositionend', () => {
    isComposing = false;
    state.dictionary.keyword = search.value.trim();
    persist();
    updateDictionaryResults(list, total);
  });
  search.addEventListener('input', () => {
    if (isComposing) {
      return;
    }
    state.dictionary.keyword = search.value.trim();
    persist();
    updateDictionaryResults(list, total);
  });
  controls.append(levelButtons, search);

  const list = document.createElement('div');
  list.className = 'grammar-list';
  const total = document.createElement('p');
  total.className = 'secondary';
  updateDictionaryResults(list, total);
  wrapper.append(header, controls, total, list);
  contentArea.replaceChildren(wrapper);
}

function updateSearchResults(list, total) {
  const keyword = state.search.keyword.trim().toLowerCase();
  list.replaceChildren();

  if (!keyword) {
    total.textContent = '输入关键词后可直接跳转到词典或语法页';
    list.innerHTML = '<p class="empty">请输入关键词。</p>';
    return;
  }

  const vocabResults = dictionaryEntries.filter((item) =>
    [item.ja, item.kana, item.romaji, item.zh, item.part, item.sentenceJa, item.sentenceZh].join(' ').toLowerCase().includes(keyword)
  );
  const grammarResults = GRAMMAR.filter((item) =>
    [item.pattern, item.meaning, item.exampleJa, item.exampleZh, item.note].join(' ').toLowerCase().includes(keyword)
  );

  total.textContent = `找到 ${vocabResults.length} 条单词，${grammarResults.length} 条语法`;

  if (vocabResults.length === 0 && grammarResults.length === 0) {
    list.innerHTML = '<p class="empty">没有匹配结果。</p>';
    return;
  }

  if (vocabResults.length > 0) {
    const goDict = document.createElement('button');
    goDict.type = 'button';
    goDict.className = 'primary';
    goDict.textContent = `查看词典结果（${vocabResults.length}）`;
    goDict.addEventListener('click', () => {
      state.dictionary.keyword = state.search.keyword.trim();
      state.dictionary.level = 'ALL';
      state.activeTab = 'dictionary';
      persist();
      closeQuickSearch();
      showStudyApp('dictionary');
    });
    list.appendChild(goDict);
  }

  if (grammarResults.length > 0) {
    const goGrammar = document.createElement('button');
    goGrammar.type = 'button';
    goGrammar.className = 'secondary';
    goGrammar.style.marginLeft = '0.6rem';
    goGrammar.textContent = `查看语法结果（${grammarResults.length}）`;
    goGrammar.addEventListener('click', () => {
      state.grammar.keyword = state.search.keyword.trim();
      state.grammar.level = 'ALL';
      state.activeTab = 'grammar';
      persist();
      closeQuickSearch();
      showStudyApp('grammar');
    });
    list.appendChild(goGrammar);
  }
}

function updateDictionaryResults(list, total) {
  const items = getFilteredVocab();
  list.replaceChildren();
  if (items.length === 0) {
    list.innerHTML = '<p class="empty">没有匹配到单词。</p>';
  } else {
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'grammar-card';
      card.innerHTML = [
        `<p class="badge">${item.jlpt}</p>`,
        `<h3>${item.ja}</h3>`,
        `<p class="secondary">${item.kana || ''}${item.romaji ? ` · ${item.romaji}` : ''}</p>`,
        `<p class="meaning">${item.zh}</p>`,
        `<p>${item.sentenceJa || ''}</p>`,
        `<p class="secondary">${item.sentenceZh || ''}</p>`
      ].join('');
      list.appendChild(card);
    });
  }
  total.textContent = `共 ${items.length} 条单词`;
}

function getFilteredVocab() {
  const level = state.dictionary.level;
  const keyword = state.dictionary.keyword.toLowerCase();
  return dictionaryEntries.filter((item) => {
    const jlpt = normalizeJlpt(item.jlpt);
    if (level !== 'ALL' && jlpt !== level) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return [item.ja, item.kana, item.romaji, item.zh, item.part, item.sentenceJa, item.sentenceZh]
      .join(' ')
      .toLowerCase()
      .includes(keyword);
  });
}

async function ensureDictionaryData() {
  if (dictionaryLoaded || dictionaryLoading) {
    return;
  }
  dictionaryLoading = true;
  try {
    let response = await fetch('./jlpt_vocab.json', { cache: 'no-store' });
    if (!response.ok) {
      response = await fetch('./imported_vocab.json', { cache: 'no-store' });
    }
    if (!response.ok) {
      dictionaryLoaded = true;
      return;
    }
    const imported = await response.json();
    if (!Array.isArray(imported)) {
      dictionaryLoaded = true;
      return;
    }
    dictionaryEntries = mergeVocab(VOCAB, imported);
    wordIndex = buildWordIndex(dictionaryEntries);
    syncStateWithPool();
    persist();
  } catch {
    // Keep fallback base vocab on any error.
  } finally {
    dictionaryLoaded = true;
    dictionaryLoading = false;
    renderTab(state.activeTab);
  }
}

function buildWordIndex(list) {
  const index = new Map();
  for (const word of list) {
    if (!word || typeof word !== 'object') {
      continue;
    }
    if (!word.id) {
      continue;
    }
    index.set(word.id, word);
  }
  return index;
}

function getStudyPool() {
  const base = state.activeTab === 'card' ? getAllWords() : getBookWords();
  if (state.activeTab === 'card' || state.activeTab === 'dictation') {
    const filtered = base.filter((word) => {
      const mark = getWordMark(word.id);
      return mark === 'new' || mark === 'fuzzy';
    });
    if (filtered.length > 0) {
      return filtered;
    }
  }
  return base.length > 0 ? base : dictionaryEntries.length > 0 ? dictionaryEntries : VOCAB;
}

function getBookWords() {
  const all = dictionaryEntries.length > 0 ? dictionaryEntries : VOCAB;
  if (state.book.level === 'ALL') {
    return all;
  }
  return all.filter((word) => normalizeJlpt(word.jlpt) === state.book.level);
}

function getAllWords() {
  return dictionaryEntries.length > 0 ? dictionaryEntries : VOCAB;
}

function getMixedAllWords() {
  const words = getAllWords();
  ensureListOrder(words);
  const idToWord = new Map(words.map((w) => [w.id, w]));
  const ordered = [];
  for (const id of state.list.orderIds) {
    const word = idToWord.get(id);
    if (word) {
      ordered.push(word);
    }
  }
  // Fallback append if any new ids were not in cached order.
  for (const word of words) {
    if (!state.list.orderIds.includes(word.id)) {
      ordered.push(word);
    }
  }
  return ordered;
}

function ensureListOrder(words) {
  const ids = words.map((w) => w.id);
  const idSet = new Set(ids);
  const cached = state.list.orderIds || [];
  const validCached = cached.filter((id) => idSet.has(id));
  if (validCached.length === ids.length) {
    state.list.orderIds = validCached;
    return;
  }
  state.list.orderIds = buildMixedOrder(words);
  persist();
}

function buildMixedOrder(words) {
  const levelOrder = ['N5', 'N4', 'N3', 'N2', 'N1', 'UNK'];
  const buckets = new Map(levelOrder.map((lv) => [lv, []]));
  for (const word of words) {
    const lv = normalizeJlpt(word.jlpt);
    const bucket = buckets.get(lv) || buckets.get('UNK');
    bucket.push(word.id);
  }
  // Shuffle inside each level first.
  for (const lv of levelOrder) {
    shuffleInPlace(buckets.get(lv));
  }
  // Round-robin merge levels to keep each 20-word group mixed.
  const result = [];
  let added = true;
  while (added) {
    added = false;
    for (const lv of levelOrder) {
      const bucket = buckets.get(lv);
      if (bucket.length > 0) {
        result.push(bucket.pop());
        added = true;
      }
    }
  }
  return result;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function splitIntoChunks(words, size) {
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push({
      start: i,
      end: Math.min(i + size, words.length),
      items: words.slice(i, i + size)
    });
  }
  return chunks;
}

function getChunkKey(level, chunkIndex) {
  return `${level}:${chunkIndex}`;
}

function getChunkStartDate(chunkKey) {
  const stored = state.list.startDates[chunkKey];
  if (stored) {
    return stored;
  }
  const today = localDateKey(Date.now());
  state.list.startDates[chunkKey] = today;
  persist();
  return today;
}

function formatDateOffset(baseDateKey, offset) {
  const [y, m, d] = baseDateKey.split('-').map((x) => Number(x));
  const base = new Date(y, (m || 1) - 1, d || 1);
  const next = new Date(base.getTime() + offset * DAY);
  const yy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const dd = String(next.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

function getCheckin(chunkKey, rowNo, round) {
  const key = `${rowNo}:${round}`;
  return Boolean(state.list.checkins[chunkKey]?.[key]);
}

function toggleCheckin(chunkKey, rowNo, round) {
  const key = `${rowNo}:${round}`;
  if (!state.list.checkins[chunkKey] || typeof state.list.checkins[chunkKey] !== 'object') {
    state.list.checkins[chunkKey] = {};
  }
  state.list.checkins[chunkKey][key] = !state.list.checkins[chunkKey][key];
  persist();
  if (round === 'first' && state.list.checkins[chunkKey][key]) {
    requestAnimationFrame(() => {
      document.getElementById('today-word-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function startCardSessionFromChunk(chunkWords, startIndex) {
  const ids = chunkWords.map((word) => word.id);
  state.session.ids = ids;
  state.session.index = Math.max(0, Math.min(startIndex, ids.length - 1));
  state.activeWordId = ids[state.session.index] || null;
  persist();
  showStudyApp('card');
}

function getWordMark(wordId) {
  const mark = state.marks[wordId];
  if (mark === 'known' || mark === 'fuzzy' || mark === 'new') {
    return mark;
  }
  return 'new';
}

function setWordMark(wordId, mark) {
  state.marks[wordId] = mark;
  persist();
}

function createBlankCard(id) {
  return {
    id,
    box: 0,
    dueAt: 0,
    totalSeen: 0,
    totalCorrect: 0,
    lastStudiedAt: null
  };
}

function syncStateWithPool() {
  const pool = getStudyPool();
  const validIds = new Set(pool.map((word) => word.id));
  const cardMap = new Map(state.cards.map((card) => [card.id, card]));
  state.cards = pool.map((word) => cardMap.get(word.id) || createBlankCard(word.id));
  if (!validIds.has(state.activeWordId)) {
    state.activeWordId = pool[0]?.id || null;
  }
  state.wrongQueue = state.wrongQueue.filter((id) => validIds.has(id));
  if (!validIds.has(state.quiz.currentWordId)) {
    state.quiz.currentWordId = null;
    state.quiz.lastChoice = null;
    state.quiz.isAnswered = false;
    state.quiz.choices = [];
  }
}

function mergeVocab(base, extra) {
  const merged = [];
  const seen = new Set();
  for (const row of [...base, ...extra]) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const ja = String(row.ja || '').trim();
    if (!ja) {
      continue;
    }
    if (!isLikelyWordEntry(ja)) {
      continue;
    }
    const kana = String(row.kana || '').trim();
    const zh = String(row.zh || '').trim();
    const key = `${ja}|${kana}|${zh}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push({
      id: String(row.id || `v-${merged.length + 1}`),
      ja,
      kana,
      romaji: String(row.romaji || ''),
      zh: zh || '（释义待补充）',
      part: String(row.part || '未知'),
      jlpt: normalizeJlpt(row.jlpt),
      sentenceJa: String(row.sentenceJa || `${ja}を勉強します。`),
      sentenceZh: String(row.sentenceZh || '（例句翻译待补充）')
    });
  }
  return merged;
}

function isLikelyWordEntry(ja) {
  const text = String(ja).trim();
  if (!text) {
    return false;
  }
  const grammarMarkers = ['〜', '～', '【', '】', '「', '」', '（', '）', '[', ']', '→', '=>', '／', '/'];
  if (grammarMarkers.some((marker) => text.includes(marker))) {
    return false;
  }
  if (text.length > 20) {
    return false;
  }
  if (/\s/.test(text)) {
    return false;
  }
  return true;
}

function normalizeJlpt(value) {
  const raw = String(value || '').toUpperCase();
  const matched = raw.match(/N[1-5]/);
  return matched ? matched[0] : 'UNK';
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
  setWordMark(wordId, isCorrect ? 'known' : 'fuzzy');
}

function setNextQuizQuestion() {
  const pool = getStudyPool();
  const wrongId = shiftNextWrongWord();
  let target = null;
  if (state.quizWrongOnly) {
    target = getWordById(wrongId);
  } else {
    const fallback = pool[Math.floor(Math.random() * pool.length)] || pool[0];
    target = getWordById(wrongId) || fallback;
  }
  if (!target) {
    state.quiz.currentWordId = null;
    state.quiz.lastChoice = null;
    state.quiz.isAnswered = false;
    state.quiz.choices = [];
    return;
  }
  state.quiz.currentWordId = target.id;
  state.quiz.lastChoice = null;
  state.quiz.isAnswered = false;

  const choices = new Set([target.zh]);
  let guard = 0;
  while (choices.size < 4 && guard < 1500) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick?.zh) {
      choices.add(pick.zh);
    }
    guard += 1;
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

function calcAccuracy() {
  const totalSeen = state.cards.reduce((sum, card) => sum + card.totalSeen, 0);
  if (totalSeen === 0) {
    return 0;
  }
  const totalCorrect = state.cards.reduce((sum, card) => sum + card.totalCorrect, 0);
  return Math.round((totalCorrect / totalSeen) * 100);
}

function getDueWords() {
  const now = Date.now();
  const dueIds = state.cards.filter((card) => card.totalSeen > 0 && card.dueAt <= now).map((card) => card.id);
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
  return wordIndex.get(id) || null;
}

function nextWordId(currentId) {
  const sessionNext = nextWordIdInSession(currentId);
  if (sessionNext !== null) {
    return sessionNext;
  }
  const pool = getStudyPool();
  const currentIndex = pool.findIndex((word) => word.id === currentId);
  if (currentIndex < 0) {
    return pool[0]?.id || null;
  }
  return pool[(currentIndex + 1) % pool.length].id;
}

function nextWordIdInSession(currentId) {
  const ids = state.session.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return null;
  }
  let idx = state.session.index;
  if (!Number.isInteger(idx) || idx < 0 || idx >= ids.length) {
    idx = ids.indexOf(currentId);
  }
  if (idx < 0) {
    return null;
  }
  const next = idx + 1;
  if (next >= ids.length) {
    state.session.ids = [];
    state.session.index = 0;
    persist();
    return null;
  }
  state.session.index = next;
  return ids[next];
}

function getRandomWord() {
  const pool = getStudyPool();
  if (pool.length === 0) {
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function getRandomWordId(excludeId = '') {
  const pool = getStudyPool();
  if (pool.length === 0) {
    return null;
  }
  if (pool.length === 1) {
    return pool[0].id;
  }
  let next = pool[Math.floor(Math.random() * pool.length)].id;
  let guard = 0;
  while (next === excludeId && guard < 20) {
    next = pool[Math.floor(Math.random() * pool.length)].id;
    guard += 1;
  }
  return next;
}

function initHandwritePad(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { clear() {} };
  }

  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(280, Math.min(680, contentArea?.clientWidth ? contentArea.clientWidth - 16 : 520));
  const height = 240;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(ratio, ratio);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#2d3855';

  const drawGrid = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(160,170,196,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#2d3855';
    ctx.lineWidth = 5;
  };
  drawGrid();

  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  const getPos = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event) => {
    event.preventDefault();
    const pos = getPos(event);
    drawing = true;
    lastX = pos.x;
    lastY = pos.y;
  };
  const move = (event) => {
    if (!drawing) {
      return;
    }
    event.preventDefault();
    const pos = getPos(event);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  };
  const end = (event) => {
    event.preventDefault();
    drawing = false;
  };

  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId);
    start(event);
  });
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  return {
    clear() {
      drawGrid();
    }
  };
}

async function evaluateHandwrite(canvas, expected) {
  try {
    const image = canvas.toDataURL('image/png');
    const resp = await fetch('/api/handwrite_eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, expected })
    });
    if (!resp.ok) {
      return null;
    }
    return await resp.json();
  } catch {
    return null;
  }
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
