/* 우리 아기 육아일기 — 동화책 (한글/영어 읽어주기 · 영어 단어 터치 · 단어장) */
(function () {
  'use strict';

  var VOCAB_KEY = 'babyDiary.vocab.v1';

  /* ---------------- 동화 4편 ----------------
     art: [큰 그림, 작은 그림1, 작은 그림2] — 이모지 그림이라 선명하고 용량이 없습니다. */
  var STORIES = [
    {
      id: 'bunny',
      emoji: '🐰',
      titleKo: '아기 토끼의 하루',
      titleEn: "Little Bunny's Day",
      pages: [
        { art: ['🐰', '🌅', '🌿'], ko: '아침 해가 떴어요. 아기 토끼가 기지개를 켜요.', en: 'The sun is up. Little Bunny stretches.' },
        { art: ['🥕', '🐰', '🍽️'], ko: '아기 토끼가 당근을 아침으로 먹어요.', en: 'Little Bunny eats a carrot for breakfast.' },
        { art: ['🐰', '🐿️', '🌼'], ko: '토끼는 풀밭에서 친구와 뛰어놀아요.', en: 'Bunny hops in the grass with a friend.' },
        { art: ['🌇', '🌙', '🐰'], ko: '해가 지고 달이 떠요. 토끼는 집으로 돌아가요.', en: 'The sun goes down and the moon rises. Bunny goes home.' },
        { art: ['🌙', '🐰', '💤'], ko: '잘 자요, 아기 토끼. 내일 또 만나요.', en: 'Good night, Little Bunny. See you tomorrow.' }
      ]
    },
    {
      id: 'bear',
      emoji: '🐻',
      titleKo: '곰돌이의 빨간 사과',
      titleEn: "Little Bear's Red Apple",
      pages: [
        { art: ['🐻', '🍎', '🌳'], ko: '곰돌이가 숲에서 빨간 사과를 찾았어요.', en: 'Little Bear finds a red apple in the forest.' },
        { art: ['🐻', '🍎', '⬆️'], ko: '사과가 너무 높아서 손이 닿지 않아요.', en: 'The apple is too high to reach.' },
        { art: ['🐻', '🌿', '🍎'], ko: '곰돌이가 나뭇가지를 흔들었어요. 사과가 똑 떨어졌어요.', en: 'Little Bear shakes the branch. The apple falls down.' },
        { art: ['🐻', '🐿️', '🍎'], ko: '곰돌이는 친구 다람쥐와 사과를 나눠 먹었어요.', en: 'Little Bear shares the apple with Squirrel.' },
        { art: ['🍎', '🐻', '🐿️'], ko: '함께 먹으니 사과가 더 달았어요.', en: 'The apple tastes sweeter together.' }
      ]
    },
    {
      id: 'moon',
      emoji: '🌙',
      titleKo: '달님 잘 자요',
      titleEn: 'Goodnight Little Moon',
      pages: [
        { art: ['🌙', '🌌', '⭐'], ko: '밤이 왔어요. 하늘에 작은 달이 떠요.', en: 'Night comes. A little moon rises in the sky.' },
        { art: ['⭐', '✨', '🌙'], ko: '별들이 하나둘 반짝여요.', en: 'Stars twinkle one by one.' },
        { art: ['👶', '🪟', '🌙'], ko: '아기가 창문을 열고 달님에게 인사해요.', en: 'Baby opens the window and says hello to the moon.' },
        { art: ['🌙', '🛏️', '✨'], ko: '달님이 아기 방에 은빛을 비춰 줘요.', en: "The moon shines silver light into baby's room." },
        { art: ['🌙', '👶', '💤'], ko: '달님 잘 자요. 아기도 잘 자요.', en: 'Goodnight, Little Moon. Sleep well, baby.' }
      ]
    },
    {
      id: 'mongi',
      emoji: '🐶',
      titleKo: '강아지 몽이의 산책',
      titleEn: "Puppy Mongi's Walk",
      pages: [
        { art: ['🐶', '🌅', '🌳'], ko: '아침에 몽이가 산책을 나갔어요.', en: 'Mongi goes for a walk in the morning.' },
        { art: ['🐶', '🌼', '🐾'], ko: '몽이는 노란 꽃을 보고 꼬리를 흔들어요.', en: 'Mongi sees a yellow flower and wags his tail.' },
        { art: ['🐶', '⚽', '🌳'], ko: '몽이가 공원에서 공을 쫓아가요.', en: 'Mongi chases a ball in the park.' },
        { art: ['🌧️', '🐶', '☔'], ko: '비가 내려서 몽이는 집으로 돌아왔어요.', en: 'It starts to rain, so Mongi comes home.' },
        { art: ['🐶', '🧺', '💛'], ko: '엄마가 몽이를 따뜻하게 닦아 줘요.', en: 'Mom dries Mongi with a warm towel.' }
      ]
    }
  ];

  /* ---------------- 내장 단어 사전 (오프라인에서도 동작) ----------------
     "뜻|품사" 형식 */
  var DICT = {
    a: '하나의, 어떤|관사',
    and: '그리고, ~와|접속사',
    apple: '사과|명사',
    baby: '아기|명사',
    ball: '공|명사',
    bear: '곰|명사',
    breakfast: '아침 식사|명사',
    branch: '나뭇가지|명사',
    bunny: '아기 토끼|명사',
    by: '~옆에, ~씩|전치사',
    carrot: '당근|명사',
    chases: '쫓아가다|동사',
    comes: '오다|동사',
    down: '아래로, 내려간|부사',
    dries: '닦아 말리다, 말리다|동사',
    eats: '먹다|동사',
    falls: '떨어지다|동사',
    finds: '찾다, 발견하다|동사',
    flower: '꽃|명사',
    for: '~을 위해, ~로|전치사',
    forest: '숲|명사',
    friend: '친구|명사',
    goes: '가다|동사',
    good: '좋은, 착한|형용사',
    goodnight: '잘 자요 (밤 인사)|감탄사',
    grass: '풀, 풀밭|명사',
    hello: '안녕|감탄사',
    high: '높은|형용사',
    his: '그의|대명사',
    home: '집, 우리 집|명사',
    hops: '깡충깡충 뛰다|동사',
    in: '~안에, ~에서|전치사',
    into: '~안으로|전치사',
    is: '~이다, ~이에요|동사',
    it: '그것 (날씨를 말할 때도 써요)|대명사',
    light: '빛|명사',
    little: '작은, 어린|형용사',
    mom: '엄마|명사',
    mongi: '몽이 (강아지 이름)|명사',
    moon: '달|명사',
    morning: '아침|명사',
    night: '밤|명사',
    one: '하나, 하나씩|수사',
    opens: '열다|동사',
    park: '공원|명사',
    rain: '비|명사',
    reach: '손이 닿다, 닿다|동사',
    red: '빨간|형용사',
    rises: '떠오르다|동사',
    room: '방|명사',
    says: '말하다|동사',
    see: '보다, 만나다|동사',
    sees: '보다, 알아보다|동사',
    shakes: '흔들다|동사',
    shares: '나눠 가지다, 함께 쓰다|동사',
    shines: '빛나다, 비추다|동사',
    silver: '은빛의, 은|형용사',
    sky: '하늘|명사',
    sleep: '자다|동사',
    so: '그래서|접속사',
    squirrel: '다람쥐|명사',
    stars: '별들|명사',
    starts: '시작하다|동사',
    stretches: '기지개를 켜다|동사',
    sun: '해, 태양|명사',
    sweeter: '더 달콤한|형용사',
    tail: '꼬리|명사',
    tastes: '맛이 나다, 맛보다|동사',
    the: '그, 저 (이미 말한 것을 가리켜요)|관사',
    to: '~로, ~하기 위해|전치사',
    together: '함께, 같이|부사',
    tomorrow: '내일|부사',
    too: '너무, 또한|부사',
    towel: '수건|명사',
    twinkle: '반짝반짝 빛나다|동사',
    up: '위로, 올라간|부사',
    wags: '꼬리를 흔들다|동사',
    walk: '산책, 걷기|명사',
    warm: '따뜻한|형용사',
    well: '잘|부사',
    window: '창문|명사',
    with: '~와 함께|전치사',
    yellow: '노란|형용사',
    you: '너, 당신|대명사'
  };

  var state = { story: 0, page: 0, lang: 'both', word: null };
  var phonCache = {};   /* word -> { phon, audio } */
  var lookupToken = 0;
  var tTimer = null;
  var rendered = false;

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

  /* ---------------- 단어 사전 ---------------- */
  function dictEntry(word) {
    var raw = DICT[word];
    if (!raw) return null;
    var i = raw.indexOf('|');
    return i < 0 ? { ko: raw, pos: '' } : { ko: raw.slice(0, i), pos: raw.slice(i + 1) };
  }

  /* ---------------- 단어장 저장 ---------------- */
  function loadVocab() {
    try {
      var a = JSON.parse(localStorage.getItem(VOCAB_KEY) || '[]');
      if (!Array.isArray(a)) return [];
      return a.filter(function (it) { return it && typeof it.w === 'string' && it.w; });
    } catch (e) { return []; }
  }
  function storeVocab(list) {
    try { localStorage.setItem(VOCAB_KEY, JSON.stringify(list.slice(0, 300))); } catch (e) {}
  }
  function isSaved(word) {
    return loadVocab().some(function (it) { return it.w === word; });
  }

  /* ---------------- 음성 읽어주기 ---------------- */
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
      if (btn && !btn.classList.contains('is-on')) return; /* 멈춤을 누른 경우 */
      var it = items[i++];
      speakText(it.text, it.lang, rate, next);
    })();
  }

  /* ---------------- 화면 그리기 ---------------- */
  function curStory() { return STORIES[state.story]; }
  function curPage() { return curStory().pages[state.page]; }

  function renderPicker() {
    var wrap = $('#storyPicker');
    if (!wrap) return;
    wrap.textContent = '';
    STORIES.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'story-pick' + (i === state.story ? ' is-on' : '');
      b.setAttribute('aria-pressed', i === state.story ? 'true' : 'false');
      var em = document.createElement('span');
      em.className = 'pk-emoji';
      em.setAttribute('aria-hidden', 'true');
      em.textContent = s.emoji;
      var txt = document.createElement('em');
      txt.textContent = s.titleKo;
      b.appendChild(em);
      b.appendChild(txt);
      b.addEventListener('click', function () {
        stopSpeak();
        state.story = i;
        state.page = 0;
        renderPicker();
        renderPage();
      });
      wrap.appendChild(b);
    });
  }

  function renderArt(art) {
    var box = $('#storyArt');
    if (!box) return;
    box.textContent = '';
    var main = document.createElement('span');
    main.className = 'art-main';
    main.textContent = art[0] || '📖';
    box.appendChild(main);
    ['art-side art-side-a', 'art-side art-side-b'].forEach(function (cls, i) {
      if (!art[i + 1]) return;
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
      var w = raw.toLowerCase().replace(/[’']s$/, '').replace(/[’']/g, '');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'story-word';
      b.dataset.w = w;
      b.textContent = raw;
      b.setAttribute('aria-label', raw + ' — 뜻 보기');
      b.addEventListener('click', function () { openWord(b.dataset.w); });
      box.appendChild(b);
      last = re.lastIndex;
    }
    if (last < sentence.length) box.appendChild(document.createTextNode(sentence.slice(last)));
  }

  function renderPage() {
    var p = curPage();
    if (!p) return;
    renderArt(p.art);
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
    if (count) count.textContent = (state.page + 1) + ' / ' + curStory().pages.length;
    var dots = $('#storyDots');
    if (dots) {
      dots.textContent = '';
      curStory().pages.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'story-dot' + (i === state.page ? ' is-on' : '');
        d.setAttribute('aria-label', (i + 1) + '쪽 보기');
        d.addEventListener('click', function () {
          stopSpeak();
          state.page = i;
          renderPage();
        });
        dots.appendChild(d);
      });
    }
    var prev = $('#storyPrev');
    var next = $('#storyNext');
    if (prev) prev.disabled = state.page === 0;
    if (next) next.disabled = state.page === curStory().pages.length - 1;
  }

  /* ---------------- 단어 카드 ---------------- */
  function openWord(word) {
    var entry = dictEntry(word);
    var sheet = $('#wordSheet');
    if (!sheet) return;
    state.word = word;
    $$('.story-word.is-sel').forEach(function (b) { b.classList.remove('is-sel'); });
    $$('.story-word').forEach(function (b) { if (b.dataset.w === word) b.classList.add('is-sel'); });

    $('#wordSheetWord').textContent = word;
    $('#wordSheetKo').textContent = entry ? entry.ko : '저장된 뜻이 없어요';
    $('#wordSheetPos').textContent = entry && entry.pos ? entry.pos : '';
    $('#wordSheetPos').hidden = !(entry && entry.pos);
    $('#wordSheetPhon').hidden = true;
    $('#wordSheetPhon').textContent = '';
    var note = $('#wordSheetNote');
    note.hidden = true;
    note.textContent = '';
    syncSaveBtn(word);
    sheet.hidden = false;
    document.body.classList.add('sheet-open');

    var cached = phonCache[word];
    if (cached) { applyPhon(cached); return; }
    if (typeof fetch !== 'function') { showPhonNote('인터넷이 없어도 저장된 뜻으로 볼 수 있어요.'); return; }

    var token = ++lookupToken;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);
    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word), ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(function (data) {
        clearTimeout(timer);
        if (token !== lookupToken) return;
        var e = data && data[0];
        if (!e) throw new Error('empty');
        var phon = e.phonetic || '';
        var audio = '';
        (e.phonetics || []).forEach(function (x) {
          if (!phon && x.text) phon = x.text;
          if (!audio && x.audio) audio = x.audio;
        });
        if (!phon && !audio) throw new Error('empty');
        var rec = { phon: phon || '', audio: audio || '' };
        phonCache[word] = rec;
        applyPhon(rec);
      })
      .catch(function () {
        clearTimeout(timer);
        if (token !== lookupToken) return;
        showPhonNote('사전 발음 정보를 불러오지 못했어요. 🔊 발음 듣기로 기기 음성을 들을 수 있어요.');
      });
  }

  function applyPhon(rec) {
    var el = $('#wordSheetPhon');
    if (!el) return;
    if (rec.phon) { el.textContent = rec.phon; el.hidden = false; }
    else { el.hidden = true; }
  }
  function showPhonNote(msg) {
    var n = $('#wordSheetNote');
    if (!n) return;
    n.textContent = msg;
    n.hidden = false;
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
      var e = dictEntry(word);
      list.unshift({ w: word, ko: e ? e.ko : '', at: new Date().toISOString() });
      storeVocab(list);
      toast('단어장에 저장했어요 ⭐');
    }
    syncSaveBtn(word);
    renderVocab();
  }
  function playWord() {
    var word = state.word;
    if (!word) return;
    var rec = phonCache[word];
    if (rec && rec.audio) {
      try {
        var a = new Audio(rec.audio);
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { speakText(word, 'en-US', 0.85); });
        return;
      } catch (e) {}
    }
    stopSpeak();
    speakText(word, 'en-US', 0.85);
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
        k.textContent = it.ko || (dictEntry(it.w) || {}).ko || '';
        var sp = document.createElement('button');
        sp.type = 'button';
        sp.className = 'vocab-btn';
        sp.setAttribute('aria-label', it.w + ' 발음 듣기');
        sp.textContent = '🔊';
        sp.addEventListener('click', function () {
          stopSpeak();
          var rec = phonCache[it.w];
          if (rec && rec.audio) { try { new Audio(rec.audio).play().catch(function () { speakText(it.w, 'en-US', 0.85); }); return; } catch (e) {} }
          speakText(it.w, 'en-US', 0.85);
        });
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
    var right = pick.ko || (dictEntry(pick.w) || {}).ko || '';
    if (!right) { resetQuiz(); return; }
    var others = [];
    var seen = {};
    seen[right] = 1;
    shuffle(Object.keys(DICT)).forEach(function (k) {
      var e = dictEntry(k);
      if (!e || seen[e.ko]) return;
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

  /* ---------------- 초기화 ---------------- */
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
        renderPage();
      });
    }

    var bEn = $('#storySpeakEn');
    var bKo = $('#storySpeakKo');
    var bSlow = $('#storySlow');
    var bStop = $('#storyStop');
    var bPrev = $('#storyPrev');
    var bNext = $('#storyNext');

    if (bEn) bEn.addEventListener('click', function () {
      speakQueue([{ text: curPage().en, lang: 'en-US' }], 1, bEn);
    });
    if (bKo) bKo.addEventListener('click', function () {
      speakQueue([{ text: curPage().ko, lang: 'ko-KR' }], 1, bKo);
    });
    if (bSlow) bSlow.addEventListener('click', function () {
      var items = [];
      if (state.lang !== 'ko') items.push({ text: curPage().en, lang: 'en-US' });
      if (state.lang !== 'en') items.push({ text: curPage().ko, lang: 'ko-KR' });
      if (!items.length) items.push({ text: curPage().en, lang: 'en-US' });
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
      renderPage();
    });
    if (bNext) bNext.addEventListener('click', function () {
      if (state.page >= curStory().pages.length - 1) return;
      stopSpeak();
      state.page += 1;
      renderPage();
    });

    var closeBtn = $('#wordSheetClose');
    var dim = $('#wordSheetDim');
    if (closeBtn) closeBtn.addEventListener('click', closeWord);
    if (dim) dim.addEventListener('click', closeWord);
    var speakBtn = $('#wordSpeak');
    if (speakBtn) speakBtn.addEventListener('click', playWord);
    var saveBtn = $('#wordSave');
    if (saveBtn) saveBtn.addEventListener('click', toggleSave);
    var quizNew = $('#quizNew');
    if (quizNew) quizNew.addEventListener('click', newQuiz);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.word) closeWord();
    });

    /* 다른 탭으로 이동하면 읽어주기를 멈춥니다 */
    document.addEventListener('click', function (e) {
      var nav = e.target.closest && e.target.closest('.tab, .bottom-item');
      if (!nav) return;
      if (String(nav.dataset.tab) !== '7') { stopSpeak(); if (state.word) closeWord(); }
    });
  }

  function enter() {
    if (!rendered) { rendered = true; renderPicker(); renderPage(); renderVocab(); }
    else { renderVocab(); }
  }

  function init() {
    if (!$('#page-7')) return;
    bind();
    renderPicker();
    renderPage();
    renderVocab();
    rendered = true;
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
    openWord: function (w) { openWord(String(w || '').toLowerCase()); },
    saveWord: function (w) {
      var word = String(w || '').toLowerCase();
      var list = loadVocab();
      if (list.some(function (x) { return x.w === word; })) return;
      var e = dictEntry(word);
      list.unshift({ w: word, ko: e ? e.ko : '', at: new Date().toISOString() });
      storeVocab(list);
      renderVocab();
    },
    state: function () {
      return {
        story: curStory() ? curStory().titleKo : '',
        page: state.page + 1,
        pages: curStory() ? curStory().pages.length : 0,
        lang: state.lang,
        word: state.word,
        vocab: loadVocab().map(function (x) { return x.w; }),
        speech: ttsOK(),
        stories: STORIES.length
      };
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
