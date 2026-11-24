/* 우리 아기 육아일기 — 동화책
   · Supabase public.stories 에서 동화 목록을 받아 옵니다 (없으면 내장 4편으로 자동 전환)
   · 받아 온 목록은 localStorage 에 저장해 인터넷이 없어도 그대로 읽을 수 있습니다
   · 한글/영어 읽어주기 · 영어 단어 터치 뜻·발음 카드 · 단어장 · 퀴즈
*/
(function () {
  'use strict';

  var VOCAB_KEY = 'babyDiary.vocab.v1';
  var CACHE_KEY = 'babyDiary.storiesCache.v1';
  var LAST_KEY = 'babyDiary.storyLast.v1';
  var CACHE_LIMIT = 60;          /* 저장해 둘 동화 수 (50권 + 여유) */
  var FETCH_TTL = 10 * 60 * 1000; /* 10분 안에 받아 온 목록은 다시 부르지 않음 */

  var VOCAB = (window.STORY_VOCAB && typeof window.STORY_VOCAB === 'object') ? window.STORY_VOCAB : {};
  var CFG = (window.BABY_DIARY_SUPABASE && typeof window.BABY_DIARY_SUPABASE === 'object') ? window.BABY_DIARY_SUPABASE : {};
  var CAT_ORDER = ['전체', '동물', '생활습관', '잠자리', '자연·계절', '숫자·색깔·탈것'];

  /* ---------------- 내장 동화 4편 (Supabase가 비어 있거나 인터넷이 없을 때) ---------------- */
  var BG = {
    dawn: 'linear-gradient(158deg,#fff4e2 0%,#ffe2c6 55%,#ffd2b8 100%)',
    day: 'linear-gradient(158deg,#eef8ff 0%,#dcefff 55%,#cbe5ff 100%)',
    grass: 'linear-gradient(158deg,#f1fbe6 0%,#ddf3cb 55%,#caecb4 100%)',
    sunset: 'linear-gradient(158deg,#fff1e0 0%,#ffdccb 50%,#f9c6d2 100%)',
    night: 'linear-gradient(158deg,#eaeefb 0%,#d9dff7 55%,#c9d1f1 100%)',
    indoor: 'linear-gradient(158deg,#fff8f2 0%,#ffecdf 55%,#ffe2d2 100%)'
  };

  function builtinStories() {
    return [
      {
        id: 'bunny', sort: 1, cat: '동물', age: '0~2세',
        titleKo: '아기 토끼의 하루', titleEn: "Little Bunny's Day", emoji: '🐰',
        scenes: [
          { art: ['🐰', '🌅', '🌿'], bg: BG.dawn, ko: '아침 해가 떴어요. 아기 토끼가 기지개를 켜요.', en: 'The sun is up. Little Bunny stretches.' },
          { art: ['🥕', '🐰', '🍽️'], bg: BG.indoor, ko: '아기 토끼가 당근을 아침으로 먹어요.', en: 'Little Bunny eats a carrot for breakfast.' },
          { art: ['🐰', '🐿️', '🌼'], bg: BG.grass, ko: '토끼는 풀밭에서 친구와 뛰어놀아요.', en: 'Bunny hops in the grass with a friend.' },
          { art: ['🌇', '🌙', '🐰'], bg: BG.sunset, ko: '해가 지고 달이 떠요. 토끼는 집으로 돌아가요.', en: 'The sun goes down and the moon rises. Bunny goes home.' },
          { art: ['🌙', '🐰', '💤'], bg: BG.night, ko: '잘 자요, 아기 토끼. 내일 또 만나요.', en: 'Good night, Little Bunny. See you tomorrow.' }
        ]
      },
      {
        id: 'bear', sort: 2, cat: '동물', age: '3~5세',
        titleKo: '곰돌이의 빨간 사과', titleEn: "Little Bear's Red Apple", emoji: '🐻',
        scenes: [
          { art: ['🐻', '🍎', '🌳'], bg: BG.grass, ko: '곰돌이가 숲에서 빨간 사과를 찾았어요.', en: 'Little Bear finds a red apple in the forest.' },
          { art: ['🐻', '🍎', '⬆️'], bg: BG.day, ko: '사과가 너무 높아서 손이 닿지 않아요.', en: 'The apple is too high to reach.' },
          { art: ['🐻', '🌿', '🍎'], bg: BG.grass, ko: '곰돌이가 나뭇가지를 흔들었어요. 사과가 똑 떨어졌어요.', en: 'Little Bear shakes the branch. The apple falls down.' },
          { art: ['🐻', '🐿️', '🍎'], bg: BG.grass, ko: '곰돌이는 친구 다람쥐와 사과를 나눠 먹었어요.', en: 'Little Bear shares the apple with Squirrel.' },
          { art: ['🍎', '🐻', '🐿️'], bg: BG.sunset, ko: '함께 먹으니 사과가 더 달았어요.', en: 'The apple tastes sweeter together.' }
        ]
      },
      {
        id: 'moon', sort: 3, cat: '잠자리', age: '0~2세',
        titleKo: '달님 잘 자요', titleEn: 'Goodnight Little Moon', emoji: '🌙',
        scenes: [
          { art: ['🌙', '🌌', '⭐'], bg: BG.night, ko: '밤이 왔어요. 하늘에 작은 달이 떠요.', en: 'Night comes. A little moon rises in the sky.' },
          { art: ['⭐', '✨', '🌙'], bg: BG.night, ko: '별들이 하나둘 반짝여요.', en: 'Stars twinkle one by one.' },
          { art: ['👶', '🪟', '🌙'], bg: BG.night, ko: '아기가 창문을 열고 달님에게 인사해요.', en: 'Baby opens the window and says hello to the moon.' },
          { art: ['🌙', '🛏️', '✨'], bg: BG.indoor, ko: '달님이 아기 방에 은빛을 비춰 줘요.', en: "The moon shines silver light into baby's room." },
          { art: ['🌙', '👶', '💤'], bg: BG.night, ko: '달님 잘 자요. 아기도 잘 자요.', en: 'Goodnight, Little Moon. Sleep well, baby.' }
        ]
      },
      {
        id: 'mongi', sort: 4, cat: '동물', age: '3~5세',
        titleKo: '강아지 몽이의 산책', titleEn: "Puppy Mongi's Walk", emoji: '🐶',
        scenes: [
          { art: ['🐶', '🌅', '🌳'], bg: BG.dawn, ko: '아침에 몽이가 산책을 나갔어요.', en: 'Mongi goes for a walk in the morning.' },
          { art: ['🐶', '🌼', '🐾'], bg: BG.grass, ko: '몽이는 노란 꽃을 보고 꼬리를 흔들어요.', en: 'Mongi sees a yellow flower and wags his tail.' },
          { art: ['🐶', '⚽', '🌳'], bg: BG.day, ko: '몽이가 공원에서 공을 쫓아가요.', en: 'Mongi chases a ball in the park.' },
          { art: ['🌧️', '🐶', '☔'], bg: BG.day, ko: '비가 내려서 몽이는 집으로 돌아왔어요.', en: 'It starts to rain, so Mongi comes home.' },
          { art: ['🐶', '🧺', '💛'], bg: BG.indoor, ko: '엄마가 몽이를 따뜻하게 닦아 줘요.', en: 'Mom dries Mongi with a warm towel.' }
        ]
      }
    ];
  }

  /* 내장 4편에만 있는 낱말 보충 (50편 사전에는 없는 단어) */
  var EXTRA_VOCAB = {
    apple: { ipa: '/ˈæpəl/', ko: '사과', pos: '명사' },
    branch: { ipa: '/bræntʃ/', ko: '나뭇가지', pos: '명사' },
    dries: { ipa: '/draɪz/', ko: '닦아 말리다', pos: '동사' },
    high: { ipa: '/haɪ/', ko: '높은', pos: '형용사' },
    park: { ipa: '/pɑrk/', ko: '공원', pos: '명사' },
    shakes: { ipa: '/ʃeɪks/', ko: '흔들다', pos: '동사' },
    shares: { ipa: '/ʃɛrz/', ko: '나눠 가지다, 함께 나누다', pos: '동사' },
    starts: { ipa: '/stɑrts/', ko: '시작하다', pos: '동사' },
    wags: { ipa: '/wægz/', ko: '꼬리를 흔들다', pos: '동사' },
    chases: { ipa: '/ˈtʃeɪsɪz/', ko: '쫓아가다', pos: '동사' },
    mongi: { ipa: '/ˈmɔŋi/', ko: '몽이 (강아지 이름)', pos: '명사' },
    breakfast: { ipa: '/ˈbrɛkfəst/', ko: '아침 식사', pos: '명사' },
    sweeter: { ipa: '/ˈswitər/', ko: '더 달콤한', pos: '형용사' }
  };

  function vocabOf(key) {
    if (!key) return null;
    if (VOCAB[key]) return VOCAB[key];
    if (EXTRA_VOCAB[key]) return EXTRA_VOCAB[key];
    return null;
  }

  /* ---------------- 상태 ---------------- */
  var state = {
    list: [],
    source: 'builtin',   /* supabase | cache | builtin */
    idx: 0,
    page: 0,
    lang: 'both',
    word: null,
    filter: '전체',
    query: '',
    loading: false,
    loadedAt: 0,
    status: { kind: '', text: '', retry: false },
    shelfOpen: false
  };
  var booted = false;
  var lookupToken = 0;
  var phonCache = {};   /* word -> { phon, audio, tried } */
  var tTimer = null;

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  /* ---------------- 단어 키 · 사전 ---------------- */
  function keyCandidates(raw) {
    var w = String(raw || '').toLowerCase().replace(/\u2019/g, "'");
    var out = [w];
    if (/'s$/.test(w)) out.push(w.slice(0, -2));
    if (w.indexOf("'") >= 0) out.push(w.replace(/'/g, ''));
    return out;
  }
  function resolveKey(raw) {
    var keys = keyCandidates(raw);
    for (var i = 0; i < keys.length; i++) {
      if (vocabOf(keys[i])) return keys[i];
    }
    return keys[0];
  }

  /* ---------------- 저장소 ---------------- */
  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function safeBg(bg) {
    if (typeof bg !== 'string') return '';
    var v = bg.trim();
    if (!v || v.length > 160) return '';
    if (!/^(linear|radial)-gradient\([0-9a-zA-Z(),.%#\- ]+\)$/.test(v)) return '';
    return v;
  }

  function normScene(s) {
    if (!s || typeof s !== 'object') return null;
    var ko = typeof s.ko === 'string' ? s.ko : '';
    var en = typeof s.en === 'string' ? s.en : '';
    if (!ko && !en) return null;
    var art = [];
    if (Array.isArray(s.art)) art = s.art.slice(0, 3).map(function (x) { return String(x || ''); });
    else if (typeof s.art === 'string') art = s.art.split('|').slice(0, 3);
    return { ko: ko, en: en, art: art, bg: safeBg(s.bg) };
  }

  /* Supabase row -> 앱 내부 모양 */
  function normRow(r) {
    if (!r || typeof r.id !== 'string' || !r.id) return null;
    var scenes = [];
    if (Array.isArray(r.scenes)) {
      r.scenes.forEach(function (s) { var x = normScene(s); if (x) scenes.push(x); });
    }
    if (!scenes.length) return null;
    return {
      id: r.id,
      sort: Number(r.sort_order) || 0,
      cat: typeof r.category === 'string' && r.category ? r.category : '기타',
      age: typeof r.age_group === 'string' ? r.age_group : '',
      titleKo: typeof r.title_ko === 'string' && r.title_ko ? r.title_ko : r.id,
      titleEn: typeof r.title_en === 'string' ? r.title_en : '',
      emoji: typeof r.cover_emoji === 'string' && r.cover_emoji ? r.cover_emoji : '📖',
      scenes: scenes
    };
  }

  function loadCache() {
    var raw = lsGet(CACHE_KEY);
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      var rows = data && Array.isArray(data.stories) ? data.stories : null;
      if (!rows || !rows.length) return null;
      var list = [];
      rows.forEach(function (r) { var x = normRow(r); if (x) list.push(x); });
      return list.length ? list : null;
    } catch (e) { return null; }
  }
  function saveCache(list) {
    var slim = list.slice(0, CACHE_LIMIT).map(function (s) {
      return {
        id: s.id, sort_order: s.sort, category: s.cat, age_group: s.age,
        title_ko: s.titleKo, title_en: s.titleEn, cover_emoji: s.emoji, scenes: s.scenes
      };
    });
    lsSet(CACHE_KEY, JSON.stringify({ v: 1, at: new Date().toISOString(), stories: slim }));
  }
  function loadLast() {
    try {
      var d = JSON.parse(lsGet(LAST_KEY) || 'null');
      return (d && typeof d.id === 'string') ? d : null;
    } catch (e) { return null; }
  }
  function saveLast() {
    var s = curStory();
    if (!s) return;
    lsSet(LAST_KEY, JSON.stringify({ id: s.id, page: state.page }));
  }

  /* ---------------- 단어장 ---------------- */
  function loadVocab() {
    try {
      var a = JSON.parse(lsGet(VOCAB_KEY) || '[]');
      if (!Array.isArray(a)) return [];
      return a.filter(function (it) { return it && typeof it.w === 'string' && it.w; });
    } catch (e) { return []; }
  }
  function storeVocab(list) {
    lsSet(VOCAB_KEY, JSON.stringify(list.slice(0, 300)));
  }
  function isSaved(word) {
    return loadVocab().some(function (it) { return it.w === word; });
  }

  /* ---------------- 읽어주기 ---------------- */
  function ttsOK() {
    return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance === 'function';
  }
  function pickVoice(lang) {
    if (!ttsOK()) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    var pre = lang.slice(0, 2).toLowerCase();
    var hit = voices.filter(function (v) { return (v.lang || '').toLowerCase().indexOf(pre) === 0; });
    if (!hit.length) return null;
    var local = hit.filter(function (v) { return v.localService; });
    return (local[0] || hit[0]);
  }
  function clearSpeakingUI() {
    $$('.sbtn.is-on').forEach(function (b) { b.classList.remove('is-on'); });
    $$('.sbtn[aria-pressed="true"]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  }
  function stopSpeak() {
    if (ttsOK()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    clearSpeakingUI();
  }
  function speakText(text, lang, rate, onDone) {
    if (!ttsOK()) { toast('이 브라우저는 읽어주기를 지원하지 않아요. 화면의 글을 직접 읽어 주세요.'); return; }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate || 1;
    u.pitch = 1;
    var v = pickVoice(lang);
    if (v) u.voice = v;
    u.onend = function () { if (onDone) onDone(); };
    u.onerror = function (ev) {
      if (ev && ev.error === 'interrupted') return;
      if (onDone) onDone();
    };
    try { window.speechSynthesis.speak(u); } catch (e) { toast('음성을 재생하지 못했어요.'); if (onDone) onDone(); }
  }
  function speakQueue(items, rate, btn) {
    if (!ttsOK()) { toast('이 브라우저는 읽어주기를 지원하지 않아요. 화면의 글을 직접 읽어 주세요.'); return; }
    stopSpeak();
    if (btn) { btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true'); }
    var i = 0;
    (function next() {
      if (i >= items.length) { clearSpeakingUI(); return; }
      if (btn && !btn.classList.contains('is-on')) return;
      var it = items[i++];
      speakText(it.text, it.lang, rate, next);
    })();
  }

  /* ---------------- 이야기 고르기 ---------------- */
  function curStory() { return state.list[state.idx] || null; }
  function curPage() {
    var s = curStory();
    return s ? s.scenes[state.page] : null;
  }

  function categoryCounts() {
    var map = {};
    state.list.forEach(function (s) { map[s.cat] = (map[s.cat] || 0) + 1; });
    return map;
  }

  function filteredList() {
    var q = state.query.trim().toLowerCase();
    return state.list.filter(function (s) {
      if (state.filter !== '전체' && s.cat !== state.filter) return false;
      if (!q) return true;
      return (s.titleKo + ' ' + s.titleEn + ' ' + s.cat + ' ' + s.age).toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderCats() {
    var box = $('#storyCats');
    if (!box) return;
    var counts = categoryCounts();
    var cats = ['전체'].concat(CAT_ORDER.slice(1).filter(function (c) { return counts[c]; }));
    Object.keys(counts).forEach(function (c) {
      if (cats.indexOf(c) < 0) cats.push(c);
    });
    box.textContent = '';
    cats.forEach(function (c) {
      var n = c === '전체' ? state.list.length : (counts[c] || 0);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'shelf-cat' + (state.filter === c ? ' is-on' : '');
      b.dataset.cat = c;
      b.setAttribute('aria-pressed', state.filter === c ? 'true' : 'false');
      b.textContent = c + ' ' + n;
      b.addEventListener('click', function () {
        state.filter = c;
        renderCats();
        renderShelfGrid();
      });
      box.appendChild(b);
    });
  }

  function renderShelfGrid() {
    var grid = $('#storyShelfGrid');
    if (!grid) return;
    var rows = filteredList();
    var total = rows.length;
    grid.textContent = '';
    var empty = $('#storyShelfEmpty');
    if (empty) empty.hidden = rows.length > 0;
    rows.forEach(function (s) {
      var on = curStory() && curStory().id === s.id;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'story-book' + (on ? ' is-on' : '');
      b.dataset.id = s.id;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');

      var cover = document.createElement('span');
      cover.className = 'sb-cover';
      cover.setAttribute('aria-hidden', 'true');
      cover.textContent = s.emoji;

      var t = document.createElement('span');
      t.className = 'sb-title';
      t.textContent = s.titleKo;

      var m = document.createElement('span');
      m.className = 'sb-meta';
      m.textContent = s.age || s.cat;

      b.appendChild(cover);
      b.appendChild(t);
      b.appendChild(m);
      b.addEventListener('click', function () { selectStory(s.id, true); });
      grid.appendChild(b);
    });
    var count = $('#storyShelfCount');
    if (count) {
      var label = state.filter === '전체' ? '전체' : state.filter;
      count.textContent = total === state.list.length
        ? label + ' ' + total + '권'
        : label + ' ' + total + '권 / 전체 ' + state.list.length + '권';
    }
  }

  function renderStatus() {
    var box = $('#storyStatus');
    var text = $('#storyStatusText');
    var retry = $('#storyRetry');
    if (!box || !text) return;
    var st = state.status;
    if (!st || !st.text) { box.hidden = true; return; }
    box.hidden = false;
    box.className = 'story-status is-' + (st.kind || 'note');
    text.textContent = st.text;
    if (retry) retry.hidden = !st.retry;
  }

  function renderBookBar() {
    var s = curStory();
    if (!s) return;
    var em = $('#storyNowEmoji');
    var title = $('#storyNowTitle');
    var meta = $('#storyNowMeta');
    var count = $('#storyNowCount');
    if (em) em.textContent = s.emoji;
    if (title) title.textContent = s.titleKo;
    if (meta) meta.textContent = [s.cat, s.age].filter(Boolean).join(' · ') + ' · ' + (state.page + 1) + '/' + s.scenes.length;
    if (count) count.textContent = state.list.length + '권';
  }

  function renderArt(art) {
    var box = $('#storyArt');
    if (!box) return;
    box.textContent = '';
    var main = document.createElement('span');
    main.className = 'art-main';
    main.textContent = (art && art[0]) || '📖';
    box.appendChild(main);
    ['art-side art-side-a', 'art-side art-side-b'].forEach(function (cls, i) {
      if (!art || !art[i + 1]) return;
      var s = document.createElement('span');
      s.className = cls;
      s.textContent = art[i + 1];
      box.appendChild(s);
    });
    box.classList.remove('is-new');
    void box.offsetWidth;
    box.classList.add('is-new');
  }

  function renderEnglish(sentence) {
    var box = $('#storyEn');
    if (!box) return;
    box.textContent = '';
    var re = /[A-Za-z][A-Za-z'’]*/g;
    var last = 0, m;
    while ((m = re.exec(sentence))) {
      if (m.index > last) box.appendChild(document.createTextNode(sentence.slice(last, m.index)));
      var raw = m[0];
      var key = resolveKey(raw);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'story-word';
      b.dataset.w = key;
      b.textContent = raw;
      b.setAttribute('aria-label', raw + ' — 뜻 보기');
      b.addEventListener('click', function (ev) {
        var el = ev.currentTarget || this;
        if (el && el.dataset) openWord(el.dataset.w);
      });
      box.appendChild(b);
      last = re.lastIndex;
    }
    if (last < sentence.length) box.appendChild(document.createTextNode(sentence.slice(last)));
  }

  function renderReader() {
    var s = curStory();
    var p = curPage();
    if (!s || !p) return;
    if (state.page >= s.scenes.length) state.page = 0;
    renderBookBar();
    renderArt(p.art);
    var stage = $('.story-stage');
    if (stage) stage.style.backgroundImage = p.bg || '';
    var ko = $('#storyKo');
    var en = $('#storyEn');
    var showKo = state.lang !== 'en';
    var showEn = state.lang !== 'ko';
    if (ko) { ko.textContent = p.ko; ko.hidden = !showKo; }
    if (en) {
      if (showEn) { en.hidden = false; renderEnglish(p.en); }
      else { en.textContent = ''; en.hidden = true; }
    }
    var count = $('#storyCount');
    if (count) count.textContent = (state.page + 1) + ' / ' + s.scenes.length;
    var dots = $('#storyDots');
    if (dots) {
      dots.textContent = '';
      s.scenes.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'story-dot' + (i === state.page ? ' is-on' : '');
        d.setAttribute('aria-label', (i + 1) + '쪽 보기');
        d.addEventListener('click', function () {
          stopSpeak();
          state.page = i;
          renderReader();
          saveLast();
        });
        dots.appendChild(d);
      });
    }
    var prev = $('#storyPrev');
    var next = $('#storyNext');
    if (prev) prev.disabled = state.page === 0;
    if (next) next.disabled = state.page === s.scenes.length - 1;
  }

  function renderAll() {
    renderCats();
    renderShelfGrid();
    renderReader();
    renderStatus();
  }

  function selectStory(id, closeSheet) {
    var i = -1;
    for (var k = 0; k < state.list.length; k++) { if (state.list[k].id === id) { i = k; break; } }
    if (i < 0) return;
    stopSpeak();
    if (state.word) closeWord();
    state.idx = i;
    state.page = 0;
    var last = loadLast();
    if (last && last.id === id && typeof last.page === 'number' && last.page < state.list[i].scenes.length) {
      state.page = Math.max(0, last.page | 0);
    }
    saveLast();
    renderReader();
    renderShelfGrid();
    if (closeSheet) closeShelf();
    var card = $('.story-card');
    if (card && closeSheet && card.scrollIntoView) {
      try { card.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { card.scrollIntoView(); }
    }
  }

  /* ---------------- 책 고르기 시트 ---------------- */
  function openShelf() {
    var sheet = $('#storyShelf');
    if (!sheet) return;
    state.shelfOpen = true;
    renderCats();
    renderShelfGrid();
    sheet.hidden = false;
    document.body.classList.add('sheet-open');
  }
  function closeShelf() {
    var sheet = $('#storyShelf');
    if (sheet) sheet.hidden = true;
    state.shelfOpen = false;
    document.body.classList.remove('sheet-open');
  }

  /* ---------------- Supabase에서 목록 받기 ---------------- */
  function cfgOK() {
    return !!(CFG.url && CFG.anonKey && /^https?:\/\//.test(CFG.url));
  }

  function adopt(list, source) {
    var keep = curStory() ? curStory().id : '';
    state.list = list.slice().sort(function (a, b) { return (a.sort - b.sort) || a.titleKo.localeCompare(b.titleKo); });
    state.source = source;
    var idx = 0;
    if (keep) {
      for (var i = 0; i < state.list.length; i++) { if (state.list[i].id === keep) { idx = i; break; } }
    } else {
      var last = loadLast();
      if (last) {
        for (var j = 0; j < state.list.length; j++) { if (state.list[j].id === last.id) { idx = j; break; } }
      }
    }
    state.idx = idx;
    var s = curStory();
    if (s && state.page >= s.scenes.length) state.page = 0;
    renderAll();
  }

  var statusTimer = null;
  function setStatus(kind, text, retry) {
    state.status = { kind: kind, text: text, retry: !!retry };
    renderStatus();
    clearTimeout(statusTimer);
    /* 잘 불러왔다는 안내는 잠깐만 보여 주고 접습니다 */
    if (kind === 'ok') {
      statusTimer = setTimeout(function () {
        if (state.status.kind === 'ok') {
          state.status = { kind: '', text: '', retry: false };
          renderStatus();
        }
      }, 6000);
    }
  }

  function refresh(force) {
    if (!cfgOK()) {
      setStatus('warn', '동화 목록을 불러올 주소가 아직 설정되지 않아 기본 동화 4권을 보여 줘요.', false);
      return;
    }
    if (state.loading) return;
    if (!force && state.loadedAt && (Date.now() - state.loadedAt) < FETCH_TTL) return;

    state.loading = true;
    if (state.source === 'builtin') setStatus('load', '동화 목록을 불러오는 중이에요…', false);

    var base = CFG.url.replace(/\/+$/, '');
    var url = base + '/rest/v1/stories?select=*&order=sort_order.asc';
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);

    fetch(url, {
      method: 'GET',
      headers: {
        apikey: CFG.anonKey,
        Authorization: 'Bearer ' + CFG.anonKey,
        Accept: 'application/json'
      },
      signal: ctrl ? ctrl.signal : undefined,
      cache: 'no-store'
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (body) {
            var code = '';
            try { var j = JSON.parse(body); code = (j && (j.code || j.message)) || ''; } catch (e) {}
            var err = new Error('HTTP ' + res.status + ' ' + code);
            err.status = res.status;
            err.code = code;
            throw err;
          });
        }
        return res.json();
      })
      .then(function (rows) {
        clearTimeout(timer);
        state.loading = false;
        state.loadedAt = Date.now();
        if (!Array.isArray(rows)) throw new Error('bad payload');
        var list = [];
        rows.forEach(function (r) { var x = normRow(r); if (x) list.push(x); });
        if (!list.length) {
          if (state.source === 'cache') {
            setStatus('note', '동화 목록이 아직 비어 있어 저장해 둔 ' + state.list.length + '권을 보여 줘요.', true);
          } else {
            setStatus('warn', '동화 목록이 아직 비어 있어 기본 동화 4권을 보여 줘요. Supabase에 동화 50편을 올리면 바로 나타나요.', true);
          }
          renderStatus();
          return;
        }
        adopt(list, 'supabase');
        saveCache(state.list);
        setStatus('ok', '동화 ' + state.list.length + '권을 불러왔어요. 인터넷이 없어도 읽을 수 있게 저장해 두었어요.', false);
        renderShelfGrid();
      })
      .catch(function (err) {
        clearTimeout(timer);
        state.loading = false;
        var why;
        var code = (err && err.code) || '';
        var status = (err && err.status) || 0;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          why = '인터넷에 연결되어 있지 않아요.';
        } else if (status === 404 || /PGRST20[0-9]/.test(code) || /does not exist/i.test(code)) {
          why = 'Supabase에 동화 목록 표(stories)가 아직 없어요.';
        } else {
          why = '동화 목록을 불러오지 못했어요.';
        }
        if (state.source === 'cache') {
          setStatus('note', why + ' 저장해 둔 ' + state.list.length + '권을 보여 줘요.', true);
        } else {
          setStatus('warn', why + ' 기본 동화 4권을 보여 줘요.', true);
        }
        renderShelfGrid();
      });
  }

  function boot() {
    var cached = loadCache();
    if (cached) {
      adopt(cached, 'cache');
      setStatus('note', '저장해 둔 동화 ' + state.list.length + '권을 보여 줘요. 새 목록을 확인하는 중이에요.', false);
    } else {
      adopt(builtinStories(), 'builtin');
    }
    var last = loadLast();
    if (last && typeof last.page === 'number') {
      var s = curStory();
      if (s && last.id === s.id && last.page < s.scenes.length) {
        state.page = Math.max(0, last.page | 0);
        renderReader();
      }
    }
    refresh(false);
  }

  /* ---------------- 단어 카드 ---------------- */
  function openWord(word) {
    var key = resolveKey(word);
    var entry = vocabOf(key);
    var sheet = $('#wordSheet');
    if (!sheet) return;
    state.word = key;
    $$('.story-word.is-sel').forEach(function (b) { b.classList.remove('is-sel'); });
    $$('.story-word').forEach(function (b) { if (b.dataset.w === key) b.classList.add('is-sel'); });

    $('#wordSheetWord').textContent = key;
    $('#wordSheetKo').textContent = entry ? entry.ko : '뜻을 찾지 못했어요';
    $('#wordSheetPos').textContent = entry && entry.pos ? entry.pos : '';
    $('#wordSheetPos').hidden = !(entry && entry.pos);
    var phonEl = $('#wordSheetPhon');
    phonEl.hidden = !(entry && entry.ipa);
    phonEl.textContent = (entry && entry.ipa) || '';
    var note = $('#wordSheetNote');
    note.hidden = true;
    note.textContent = '';
    syncSaveBtn(key);
    sheet.hidden = false;
    document.body.classList.add('sheet-open');

    if (entry && entry.ipa) return;
    var cached = phonCache[key];
    if (cached && cached.phon) { phonEl.textContent = cached.phon; phonEl.hidden = false; return; }
    if (typeof fetch !== 'function') return;
    lookupPhon(key);
  }

  /* 사전에 없는 낱말만 발음 기호를 온라인에서 확인합니다(원어민 음성도 함께). */
  function lookupPhon(word) {
    var rec = phonCache[word];
    if (rec && rec.tried) return;
    var token = ++lookupToken;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);
    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word), ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(function (data) {
        clearTimeout(timer);
        var e = data && data[0];
        if (!e) throw new Error('empty');
        var phon = e.phonetic || '';
        var audio = '';
        (e.phonetics || []).forEach(function (x) {
          if (!phon && x.text) phon = x.text;
          if (!audio && x.audio) audio = x.audio;
        });
        phonCache[word] = { phon: phon || '', audio: audio || '', tried: true };
        if (token === lookupToken && state.word === word && phon) {
          var el = $('#wordSheetPhon');
          if (el) { el.textContent = phon; el.hidden = false; }
        }
      })
      .catch(function () {
        clearTimeout(timer);
        phonCache[word] = { phon: '', audio: '', tried: true };
      });
  }

  function playAudio(url, word) {
    try {
      var a = new Audio(url);
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function () { speakText(word, 'en-US', 0.85); });
    } catch (e) { speakText(word, 'en-US', 0.85); }
  }

  function pronounceWord(word) {
    if (!word) return;
    var rec = phonCache[word];
    if (rec && rec.audio) { playAudio(rec.audio, word); return; }
    stopSpeak();
    speakText(word, 'en-US', 0.85);
    if (typeof fetch === 'function' && !(rec && rec.tried)) lookupPhon(word);
  }

  function syncSaveBtn(word) {
    var b = $('#wordSave');
    if (!b) return;
    var saved = isSaved(word);
    b.textContent = saved ? '✓ 단어장에 있음' : '⭐ 단어장 저장';
    b.classList.toggle('is-saved', saved);
    b.setAttribute('aria-pressed', saved ? 'true' : 'false');
  }
  function closeWord() {
    var sheet = $('#wordSheet');
    if (sheet) sheet.hidden = true;
    document.body.classList.remove('sheet-open');
    state.word = null;
    lookupToken++;
    $$('.story-word.is-sel').forEach(function (b) { b.classList.remove('is-sel'); });
  }
  function toggleSave() {
    var word = state.word;
    if (!word) return;
    var list = loadVocab();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].w === word) { idx = i; break; } }
    if (idx >= 0) {
      list.splice(idx, 1);
      storeVocab(list);
      toast('단어장에서 뺐어요');
    } else {
      var e = vocabOf(word);
      list.unshift({ w: word, ko: e ? e.ko : '', at: new Date().toISOString() });
      storeVocab(list);
      toast('단어장에 저장했어요 ⭐');
    }
    syncSaveBtn(word);
    renderVocab();
  }

  /* ---------------- 단어장 · 퀴즈 ---------------- */
  function renderVocab() {
    var list = loadVocab();
    var count = $('#vocabCount');
    if (count) count.textContent = list.length + '개';
    var empty = $('#vocabEmpty');
    var box = $('#vocabList');
    if (!box) return;
    box.textContent = '';
    if (!list.length) {
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      list.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'vocab-row';

        var w = document.createElement('span');
        w.className = 'vocab-word';
        w.textContent = it.w;
        var k = document.createElement('span');
        k.className = 'vocab-ko';
        k.textContent = it.ko || ((vocabOf(it.w) || {}).ko) || '';
        var sp = document.createElement('button');
        sp.type = 'button';
        sp.className = 'vocab-btn';
        sp.setAttribute('aria-label', it.w + ' 발음 듣기');
        sp.textContent = '🔊';
        sp.addEventListener('click', function () { pronounceWord(it.w); });
        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'vocab-btn';
        del.setAttribute('aria-label', it.w + ' 단어장에서 빼기');
        del.textContent = '✕';
        del.addEventListener('click', function () {
          var cur = loadVocab().filter(function (x) { return x.w !== it.w; });
          storeVocab(cur);
          renderVocab();
          toast('단어장에서 뺐어요');
          if (state.word === it.w) syncSaveBtn(it.w);
        });

        row.appendChild(w);
        row.appendChild(k);
        row.appendChild(sp);
        row.appendChild(del);
        box.appendChild(row);
      });
    }
    var quizBox = $('#quizBox');
    var quizNew = $('#quizNew');
    var canQuiz = list.length >= 2;
    if (quizBox) quizBox.hidden = !canQuiz;
    if (quizNew) quizNew.hidden = !canQuiz;
    if (canQuiz) newQuiz(); else resetQuiz();
  }

  var quizState = null;
  function resetQuiz() {
    quizState = null;
    var q = $('#quizQ'); if (q) q.textContent = '';
    var o = $('#quizOpts'); if (o) o.textContent = '';
    var n = $('#quizNote'); if (n) { n.textContent = ''; n.hidden = true; }
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function newQuiz() {
    var list = loadVocab();
    if (list.length < 2) { resetQuiz(); return; }
    var pool = shuffle(list.slice());
    var pick = pool[0];
    if (quizState && pool.length > 1 && pick.w === quizState.w) pick = pool[1];
    var entry = vocabOf(pick.w);
    var right = pick.ko || (entry && entry.ko) || '';
    if (!right) { resetQuiz(); return; }
    var others = [];
    var seen = {};
    seen[right] = 1;
    shuffle(Object.keys(VOCAB)).forEach(function (k) {
      var e = VOCAB[k];
      if (!e || !e.ko || seen[e.ko]) return;
      seen[e.ko] = 1;
      others.push(e.ko);
    });
    var opts = shuffle([right].concat(others.slice(0, 3)));
    quizState = { w: pick.w, right: right, done: false };

    var q = $('#quizQ');
    if (q) {
      q.textContent = '';
      var span = document.createElement('b');
      span.textContent = '"' + pick.w + '"';
      q.appendChild(span);
      q.appendChild(document.createTextNode(' 의 뜻은?'));
    }
    var box = $('#quizOpts');
    var note = $('#quizNote');
    if (note) { note.textContent = ''; note.hidden = true; }
    if (!box) return;
    box.textContent = '';
    opts.forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.textContent = opt;
      b.addEventListener('click', function () {
        if (!quizState || quizState.done) return;
        quizState.done = true;
        if (opt === quizState.right) {
          b.classList.add('is-right');
          if (note) { note.textContent = '정답이에요! 🎉'; note.hidden = false; }
        } else {
          b.classList.add('is-wrong');
          Array.prototype.slice.call(box.children).forEach(function (c) {
            if (c.textContent === quizState.right) c.classList.add('is-right');
          });
          if (note) { note.textContent = '아쉬워요. 정답은 "' + quizState.right + '"'; note.hidden = false; }
        }
        setTimeout(function () { if (quizState && quizState.done) newQuiz(); }, 1600);
      });
      box.appendChild(b);
    });
  }

  /* ---------------- 이벤트 ---------------- */
  function bind() {
    var langs = $('#storyLang');
    if (langs) {
      langs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-lang]');
        if (!b) return;
        state.lang = b.dataset.lang;
        $$('#storyLang [data-lang]').forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        stopSpeak();
        renderReader();
      });
    }

    var bEn = $('#storySpeakEn');
    var bKo = $('#storySpeakKo');
    var bSlow = $('#storySlow');
    var bStop = $('#storyStop');
    var bPrev = $('#storyPrev');
    var bNext = $('#storyNext');

    if (bEn) bEn.addEventListener('click', function () {
      var p = curPage();
      if (p) speakQueue([{ text: p.en, lang: 'en-US' }], 1, bEn);
    });
    if (bKo) bKo.addEventListener('click', function () {
      var p = curPage();
      if (p) speakQueue([{ text: p.ko, lang: 'ko-KR' }], 1, bKo);
    });
    if (bSlow) bSlow.addEventListener('click', function () {
      var p = curPage();
      if (!p) return;
      var items = [];
      if (state.lang !== 'ko') items.push({ text: p.en, lang: 'en-US' });
      if (state.lang !== 'en') items.push({ text: p.ko, lang: 'ko-KR' });
      if (!items.length) items.push({ text: p.en, lang: 'en-US' });
      speakQueue(items, 0.65, bSlow);
    });
    if (bStop) bStop.addEventListener('click', function () {
      stopSpeak();
      toast('읽어주기를 멈췄어요');
    });
    if (bPrev) bPrev.addEventListener('click', function () {
      if (state.page === 0) return;
      stopSpeak();
      state.page -= 1;
      renderReader();
      saveLast();
    });
    if (bNext) bNext.addEventListener('click', function () {
      var s = curStory();
      if (!s || state.page >= s.scenes.length - 1) return;
      stopSpeak();
      state.page += 1;
      renderReader();
      saveLast();
    });

    var shelfBtn = $('#storyShelfBtn');
    if (shelfBtn) shelfBtn.addEventListener('click', openShelf);
    var shelfClose = $('#storyShelfClose');
    var shelfDim = $('#storyShelfDim');
    if (shelfClose) shelfClose.addEventListener('click', closeShelf);
    if (shelfDim) shelfDim.addEventListener('click', closeShelf);
    var search = $('#storySearch');
    if (search) {
      search.addEventListener('input', function () {
        state.query = search.value || '';
        if (state.query && state.filter !== '전체') {
          state.filter = '전체';
          renderCats();
        }
        renderShelfGrid();
      });
      search.addEventListener('search', function () {
        state.query = search.value || '';
        renderShelfGrid();
      });
    }
    var retry = $('#storyRetry');
    if (retry) retry.addEventListener('click', function () { refresh(true); });

    var closeBtn = $('#wordSheetClose');
    var dim = $('#wordSheetDim');
    if (closeBtn) closeBtn.addEventListener('click', closeWord);
    if (dim) dim.addEventListener('click', closeWord);
    var speakBtn = $('#wordSpeak');
    if (speakBtn) speakBtn.addEventListener('click', function () { pronounceWord(state.word); });
    var saveBtn = $('#wordSave');
    if (saveBtn) saveBtn.addEventListener('click', toggleSave);
    var quizNew = $('#quizNew');
    if (quizNew) quizNew.addEventListener('click', newQuiz);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (state.word) closeWord();
      else if (state.shelfOpen) closeShelf();
    });

    /* 다른 탭으로 이동하면 읽어주기를 멈춥니다 */
    document.addEventListener('click', function (e) {
      var nav = e.target.closest && e.target.closest('.tab, .bottom-item');
      if (!nav) return;
      if (String(nav.dataset.tab) !== '7') {
        stopSpeak();
        if (state.word) closeWord();
        if (state.shelfOpen) closeShelf();
      }
    });

    /* 인터넷이 다시 연결되면 목록을 새로 받아 옵니다 */
    window.addEventListener('online', function () { refresh(true); });
  }

  function enter() {
    if (!booted) {
      booted = true;
      boot();
      renderVocab();
      return;
    }
    renderVocab();
    if (!state.loadedAt) refresh(false);
  }

  function init() {
    if (!$('#page-7')) return;
    bind();
    booted = true;
    boot();
    renderVocab();
    if (ttsOK()) {
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener('voiceschanged', function () {});
      } catch (e) {}
    }
  }

  window.BabyStory = {
    enter: enter,
    stop: stopSpeak,
    openShelf: openShelf,
    closeShelf: closeShelf,
    select: function (id) { selectStory(String(id || ''), false); },
    refresh: function () { refresh(true); },
    openWord: function (w) { openWord(String(w || '').toLowerCase()); },
    hasWord: function (w) { return !!vocabOf(resolveKey(String(w || ''))); },
    saveWord: function (w) {
      var word = resolveKey(String(w || ''));
      var list = loadVocab();
      if (list.some(function (x) { return x.w === word; })) return;
      var e = vocabOf(word);
      list.unshift({ w: word, ko: e ? e.ko : '', at: new Date().toISOString() });
      storeVocab(list);
      renderVocab();
    },
    state: function () {
      var s = curStory();
      return {
        story: s ? s.titleKo : '',
        id: s ? s.id : '',
        page: state.page + 1,
        pages: s ? s.scenes.length : 0,
        lang: state.lang,
        word: state.word,
        vocab: loadVocab().map(function (x) { return x.w; }),
        speech: ttsOK(),
        stories: state.list.length,
        source: state.source,
        filter: state.filter,
        shelfOpen: state.shelfOpen,
        status: state.status.text,
        categories: categoryCounts()
      };
    },
    vocabSize: function () { return Object.keys(VOCAB).length; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
