/* 우리 아기 육아일기 — 배경 테마 4종
   캔버스·입력창 필드·히어로 틴트만 바꾸고, 카드와 포인트 색은 그대로 둡니다.
   고른 테마는 localStorage(babyDiary.theme.v1)에 저장되어 다음에 열어도 유지됩니다. */
(function () {
  'use strict';

  var KEY = 'babyDiary.theme.v1';
  var DEFAULT = 'gray';

  /* meta 는 모바일 브라우저 상단 바 색 = 캔버스 색 */
  var THEMES = {
    gray: { name: '토스 그레이', meta: '#F2F4F6' },
    cream: { name: '따뜻한 크림', meta: '#FBF7F0' },
    lavender: { name: '소프트 라벤더', meta: '#F4F2FA' },
    mint: { name: '민트 브리즈', meta: '#EFF7F4' }
  };

  var root = document.documentElement;

  function has(id) { return Object.prototype.hasOwnProperty.call(THEMES, id); }

  function read() {
    try {
      var v = window.localStorage.getItem(KEY);
      return has(v) ? v : DEFAULT;
    } catch (e) {
      return DEFAULT;
    }
  }

  function write(id) {
    try { window.localStorage.setItem(KEY, id); } catch (e) { /* 사생활 보호 모드 등에서는 저장만 건너뜀 */ }
  }

  function paint(id) {
    var theme = THEMES[id] || THEMES[DEFAULT];
    root.setAttribute('data-theme', id);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.meta);

    var buttons = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-theme-set') === id;
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  /* 앱 안의 토스트(#toast)를 그대로 빌려 씁니다 */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }

  function apply(id, announce) {
    if (!has(id)) id = DEFAULT;
    paint(id);
    write(id);
    if (announce) toast(THEMES[id].name + ' 테마로 바뀌었어요');
  }

  /* 첫 화면이 그려지기 전에 바로 적용 (깜빡임 없음) */
  var current = read();
  paint(current);

  /* 버튼 연결 — 헤더 색 버튼과 1p 가족 카드가 같은 테마를 씁니다 */
  function bind() {
    /* 버튼이 화면에 생긴 뒤라야 선택 표시를 맞출 수 있어요 */
    paint(current);
    document.addEventListener('click', function (ev) {
      var target = ev.target;
      var btn = target && target.closest ? target.closest('[data-theme-set]') : null;
      if (!btn) return;
      var id = btn.getAttribute('data-theme-set');
      if (!has(id)) return;
      if (id === current) return;
      current = id;
      apply(id, true);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  /* 개발·검증용 */
  window.__diaryTheme = {
    key: KEY,
    list: Object.keys(THEMES),
    name: function (id) { return (THEMES[id] || THEMES[DEFAULT]).name; },
    get: function () { return current; },
    set: function (id) { current = has(id) ? id : DEFAULT; apply(current, false); return current; }
  };
})();
