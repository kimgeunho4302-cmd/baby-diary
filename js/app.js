/* 우리 아기 육아일기 — 앱 로직 */
(function () {
  'use strict';

  var KEY = 'babyDiary.v1';
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  var MAX_PHOTO_SIDE = 900;
  var PHOTO_QUALITY = 0.75;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  /* ---------------- 날짜 유틸 ---------------- */
  function isoOfDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayISO() { return isoOfDate(new Date()); }
  function parts(s) { var a = String(s).split('-').map(Number); return { y: a[0], m: a[1], d: a[2] }; }
  function toUTC(s) { var p = parts(s); return Date.UTC(p.y, p.m - 1, p.d); }
  function dayDiff(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 86400000); }
  function addDays(s, n) {
    var p = parts(s); var t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
    return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
  }
  function addYears(s, n) {
    var p = parts(s);
    var last = new Date(Date.UTC(p.y + n, p.m, 0)).getUTCDate();
    var d = Math.min(p.d, last);
    return (p.y + n) + '-' + pad(p.m) + '-' + pad(d);
  }
  function weekdayOf(s) { var p = parts(s); return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); }
  function fmtKoreanDate(s) {
    var p = parts(s);
    return p.y + '년 ' + p.m + '월 ' + p.d + '일 ' + WEEK[weekdayOf(s)] + '요일';
  }
  function fmtShort(s) { var p = parts(s); return p.y + '.' + pad(p.m) + '.' + pad(p.d); }
  function ageParts(fromISO, toISO) {
    var a = parts(fromISO), b = parts(toISO);
    if (toUTC(toISO) < toUTC(fromISO)) return null;
    var y = b.y - a.y, m = b.m - a.m, d = b.d - a.d;
    if (d < 0) {
      m -= 1;
      var prevMonth = new Date(Date.UTC(b.y, b.m - 1, 0)).getUTCDate();
      d += prevMonth;
    }
    if (m < 0) { y -= 1; m += 12; }
    return { y: y, m: m, d: d };
  }
  function ageText(fromISO, toISO) {
    var ap = ageParts(fromISO, toISO);
    if (!ap) return null;
    if (ap.y > 0) return '만 ' + ap.y + '년 ' + ap.m + '개월';
    if (ap.m > 0) return '만 ' + ap.m + '개월 ' + ap.d + '일';
    return '만 ' + ap.d + '일';
  }
  function dday(targetISO) { return dayDiff(todayISO(), targetISO); }
  function ddayLabel(diff) {
    if (diff > 0) return 'D-' + diff;
    if (diff === 0) return 'D-DAY';
    return 'D+' + Math.abs(diff);
  }
  function ddayState(diff) {
    if (diff > 0) return { cls: 'upcoming', text: diff + '일 남음' };
    if (diff === 0) return { cls: 'today', text: '오늘!' };
    return { cls: 'past', text: Math.abs(diff) + '일 지남' };
  }
  function nextAnnual(iso) {
    var p = parts(iso); var today = todayISO();
    function make(y) {
      var last = new Date(Date.UTC(y, p.m, 0)).getUTCDate();
      var d = Math.min(p.d, last);
      return y + '-' + pad(p.m) + '-' + pad(d);
    }
    var cand = make(parts(today).y);
    if (toUTC(cand) < toUTC(today)) cand = make(parts(today).y + 1);
    return cand;
  }

  /* ---------------- 상태 ---------------- */
  function defaults() {
    return {
      family: { mom: '', dad: '', baby: '', birth: '', due: '', cal: 'solar', leap: false, momBirth: '', dadBirth: '' },
      first: {
        parents: { photo: '', memo: '', date: '' },
        baby: { photo: '', memo: '', date: '' }
      },
      birth: { place: '', time: '', weight: '', unit: 'kg', height: '', memo: '', photo: '' },
      diary: {},
      ui: { date: '', author: 'mom' },
      meta: { version: 1, updatedAt: '' }
    };
  }

  var state = defaults();
  var editingId = null;
  var formPhoto = '';

  function mergeInto(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    Object.keys(extra).forEach(function (k) {
      if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && base[k] && typeof base[k] === 'object') {
        mergeInto(base[k], extra[k]);
      } else if (extra[k] !== undefined) {
        base[k] = extra[k];
      }
    });
    return base;
  }

  function load() {
    var d = defaults();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) mergeInto(d, JSON.parse(raw));
    } catch (e) { /* 손상된 저장값은 무시하고 기본값으로 시작 */ }
    return d;
  }

  var saveTimer = null;
  function save(silent) {
    state.meta.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      if (!silent) flashSaved();
      return true;
    } catch (e) {
      toast('저장 공간이 부족해요. 사진을 줄이거나 오래된 기록을 정리해 주세요.');
      return false;
    }
  }
  function flashSaved() {
    var el = $('#familyHint');
    if (el) { el.textContent = '저장했어요 ✓'; clearTimeout(saveTimer); saveTimer = setTimeout(function () { el.textContent = ''; }, 1800); }
  }
  function saveDebounced() { clearTimeout(save._t); save._t = setTimeout(function () { save(true); }, 400); }

  /* ---------------- 토스트 ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  /* ---------------- 사진 ---------------- */
  function compressImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          var scale = Math.min(1, (maxSide || MAX_PHOTO_SIDE) / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale));
          var ch = Math.max(1, Math.round(h * scale));
          var c = document.createElement('canvas');
          c.width = cw; c.height = ch;
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, cw, ch);
          ctx.drawImage(img, 0, 0, cw, ch);
          URL.revokeObjectURL(url);
          resolve(c.toDataURL('image/jpeg', quality || PHOTO_QUALITY));
        } catch (err) { URL.revokeObjectURL(url); reject(err); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('이미지를 읽지 못했습니다')); };
      img.src = url;
    });
  }

  function bindPhoto(cfg) {
    var input = $(cfg.input), drop = $(cfg.drop), preview = $(cfg.preview), image = $(cfg.img), remove = $(cfg.remove);
    if (!input || !drop || !preview || !image) return;
    function paint(url) {
      if (url) {
        image.src = url;
        preview.hidden = false;
        drop.hidden = true;
      } else {
        image.removeAttribute('src');
        preview.hidden = true;
        drop.hidden = false;
      }
    }
    drop.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('이미지 파일만 올릴 수 있어요.'); input.value = ''; return; }
      compressImage(f).then(function (url) {
        cfg.onChange(url);
        paint(url);
        toast('사진을 추가했어요.');
      }).catch(function () {
        toast('사진을 읽지 못했어요. 다른 사진으로 해보세요.');
      });
      input.value = '';
    });
    if (remove) remove.addEventListener('click', function () { cfg.onChange(''); paint(''); });
    return paint;
  }

  /* ---------------- 음력 ---------------- */
  function solarOfLunarDate(y, m, d, leap) {
    if (!window.LunarCal) return null;
    return LunarCal.lunarToSolar(y, m, d, !!leap);
  }

  function babySolar() {
    var f = state.family;
    if (!f.birth) return null;
    var p = parts(f.birth);
    if (!p.y || !p.m || !p.d) return null;
    if (f.cal === 'lunar') {
      var s = solarOfLunarDate(p.y, p.m, p.d, f.leap);
      return s ? { y: s.y, m: s.m, d: s.d } : null;
    }
    return { y: p.y, m: p.m, d: p.d };
  }
  function babySolarISO() {
    var s = babySolar();
    if (!s) return '';
    return s.y + '-' + pad(s.m) + '-' + pad(s.d);
  }

  function dueISO() {
    var d = String(state.family.due || '');
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
  }

  /* 마지막 생리일을 예정일에서 280일 역산해 임신 주수를 구한다 */
  function pregnancyOf(baseISO, refISO) {
    if (!baseISO) return null;
    var lmp = addDays(baseISO, -280);
    var n = dayDiff(lmp, refISO);
    if (n < 0 || n > 320) return null;
    var w = Math.floor(n / 7), dd = n % 7;
    return { weeks: w, days: dd, lmp: lmp, text: w + '주 ' + dd + '일' };
  }

  /* 아기 상태: born(태어남) / expecting(만나기 전) / empty(정보 없음) */
  function familyStatus() {
    var birth = babySolarISO();
    var due = dueISO();
    var today = todayISO();
    if (birth && toUTC(birth) <= toUTC(today)) {
      return { mode: 'born', birth: birth, due: due, target: birth };
    }
    var target = birth && toUTC(birth) > toUTC(today) ? birth : due;
    if (target) {
      return {
        mode: 'expecting',
        birth: birth || '',
        due: due || '',
        target: target,
        weekBase: due || birth || target
      };
    }
    return { mode: 'empty', birth: birth || '', due: due, target: '' };
  }

  function countdownText(diff, isToday) {
    if (diff > 0) return (isToday ? '만남까지 ' : '예정일까지 ') + 'D-' + diff;
    if (diff === 0) return '만남까지 D-DAY';
    return '예정일 +' + Math.abs(diff) + '일';
  }

  function setBirthHint() {
    var hint = $('#birthHint');
    if (!hint) return;
    var f = state.family;
    hint.classList.remove('warn');
    if (!f.birth) {
      hint.textContent = '아기 생일을 넣으면 음력·띠·별자리·100일·첫돌을 자동으로 계산해 드려요.';
      return;
    }
    var s = babySolar();
    if (!s) {
      hint.classList.add('warn');
      hint.textContent = '이 날짜는 변환할 수 없어요. 1900~2050년 사이 날짜인지, 윤달 표시가 맞는지 확인해 주세요.';
      return;
    }
    var lun = window.LunarCal ? LunarCal.solarToLunar(s.y, s.m, s.d) : null;
    var moonTxt = lun ? ('음력 ' + lun.y + '년 ' + (lun.leap ? '윤' : '') + lun.m + '월 ' + lun.d + '일') : '';
    var solarTxt = '양력 ' + s.y + '년 ' + s.m + '월 ' + s.d + '일';
    hint.textContent = f.cal === 'lunar' ? ('음력 → ' + solarTxt + (lun ? '' : '')) : (solarTxt + ' · ' + moonTxt);
    if (f.cal === 'lunar') {
      var lp = parts(f.birth);
      var hasLeap = window.LunarCal && LunarCal.hasLeapMonth(lp.y, lp.m);
      hint.textContent = '음력 ' + lp.y + '년 ' + (f.leap && hasLeap ? '윤' : '') + lp.m + '월 ' + lp.d + '일 → ' + solarTxt;
    }
  }

  function syncLeapUI() {
    var wrap = $('#leapWrap');
    if (!wrap) return;
    var f = state.family;
    var p = f.birth ? parts(f.birth) : null;
    var hasLeap = !!(p && window.LunarCal && LunarCal.hasLeapMonth(p.y, p.m));
    var show = f.cal === 'lunar' && hasLeap;
    wrap.hidden = !show;
    if (!show && f.leap) { f.leap = false; $('#babyLeap').checked = false; }
    if (show && f.leap) $('#babyLeap').checked = true;
  }

  /* ---------------- 탭 이동 ---------------- */
  function showPage(n) {
    n = String(n);
    $$('.page').forEach(function (p) { p.classList.toggle('active', p.dataset.page === n); });
    $$('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === n); });
    $$('.bottom-item').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === n); });
    if (n === '5') buildInfo();
    if (n === '4') { renderDay(); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindNav() {
    $$('.tab, .bottom-item').forEach(function (btn) {
      btn.addEventListener('click', function () { showPage(btn.dataset.tab); });
    });
    var goFamily = $('#goFamily');
    if (goFamily) goFamily.addEventListener('click', function () { showPage(1); });
  }

  /* ---------------- 1p 가족 ---------------- */
  function updateBrand() {
    var f = state.family;
    var sub = $('#brandSub');
    if (!sub) return;
    var name = f.baby ? f.baby : '';
    var pre = name ? name + ' · ' : '';
    var st = familyStatus();
    if (st.mode === 'born') {
      var diff = dayDiff(st.birth, todayISO());
      var age = ageText(st.birth, todayISO());
      sub.textContent = pre + '태어난 지 +' + Math.max(0, diff) + '일' + (age ? ' · ' + age : '');
      return;
    }
    if (st.mode === 'expecting') {
      var d = dayDiff(todayISO(), st.target);
      var preg = pregnancyOf(st.weekBase, todayISO());
      sub.textContent = pre + countdownText(d, true) + (preg ? ' · 임신 ' + preg.text : '');
      return;
    }
    sub.textContent = name || '아이 정보를 등록해 주세요';
  }

  function setDueHint() {
    var el = $('#dueHint');
    if (!el) return;
    var due = dueISO();
    el.classList.remove('warn');
    if (!due) {
      el.textContent = '예정일만 있어도 저장되고, 만남까지 남은 날과 임신 주수를 함께 보여드려요.';
      return;
    }
    var st = familyStatus();
    var txt = '출산 예정일 ' + fmtKoreanDate(due);
    if (st.mode === 'expecting') {
      var preg = pregnancyOf(st.weekBase, todayISO());
      txt += ' · ' + countdownText(dayDiff(todayISO(), st.target), true);
      if (preg) txt += ' (' + preg.text + '). 생일을 넣으면 실제 생일 기준으로 바뀝니다.';
    } else if (st.mode === 'born') {
      var gap = dayDiff(st.birth, due);
      txt += ' · ' + (gap > 0 ? '예정일보다 ' + gap + '일 늦게' : (gap < 0 ? '예정일보다 ' + Math.abs(gap) + '일 일찍' : '예정일에')) + ' 만났어요.';
    }
    el.textContent = txt;
  }

  function bindFamily() {
    var f = state.family;
    var mom = $('#momName'), dad = $('#dadName'), baby = $('#babyName');
    var babyBirth = $('#babyBirth'), momBirth = $('#momBirth'), dadBirth = $('#dadBirth');
    var babyDue = $('#babyDue');
    mom.value = f.mom; dad.value = f.dad; baby.value = f.baby;
    babyBirth.value = f.birth; momBirth.value = f.momBirth; dadBirth.value = f.dadBirth;
    if (babyDue) babyDue.value = f.due || '';

    [mom, dad, baby].forEach(function (el) {
      el.addEventListener('input', function () {
        f.mom = mom.value.trim(); f.dad = dad.value.trim(); f.baby = baby.value.trim();
        updateBrand(); saveDebounced();
      });
      el.addEventListener('change', function () { save(true); });
    });

    babyBirth.addEventListener('change', function () {
      f.birth = babyBirth.value;
      syncLeapUI(); setBirthHint(); setDueHint(); updateBrand(); setOnboard(); renderDay(); save(true);
    });
    if (babyDue) babyDue.addEventListener('change', function () {
      f.due = babyDue.value;
      setDueHint(); setBirthHint(); updateBrand(); setOnboard(); renderDay(); save(true);
    });
    momBirth.addEventListener('change', function () { f.momBirth = momBirth.value; save(true); });
    dadBirth.addEventListener('change', function () { f.dadBirth = dadBirth.value; save(true); });

    $$('#calSegment .segment-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        f.cal = btn.dataset.cal;
        $$('#calSegment .segment-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
        syncLeapUI(); setBirthHint(); saveDebounced();
      });
    });
    var leap = $('#babyLeap');
    if (leap) leap.addEventListener('change', function () { f.leap = leap.checked; setBirthHint(); save(true); });

    var saveBtn = $('#saveFamily');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      if (!f.baby) { toast('아기 이름(태명)을 먼저 적어 주세요.'); baby.focus(); return; }
      if (!f.birth && !f.due) { toast('아기 생일 또는 출산 예정일 중 하나는 넣어 주세요.'); babyBirth.focus(); return; }
      if (f.birth && !babySolar()) { toast('아기 생일을 다시 확인해 주세요.'); return; }
      save(true); flashSaved(); updateBrand(); setOnboard(); renderDay(); toast('가족 정보를 저장했어요.');
    });
    var go = $('#goDiary');
    if (go) go.addEventListener('click', function () {
      save(true); updateBrand(); setOnboard(); showPage(4);
      if (!f.birth && !f.due) toast('생일이나 예정일을 넣으면 생후 일수와 만남까지 남은 날이 함께 보여요.');
    });

    var seg = f.cal;
    $$('#calSegment .segment-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.cal === seg); });
    syncLeapUI();
    setBirthHint();
    setDueHint();
  }

  function setOnboard() {
    var configured = !!(state.family.baby && familyStatus().mode !== 'empty');
    var ob = $('#onboard'), dob = $('#diaryOnboard');
    if (ob) ob.hidden = configured;
    if (dob) dob.hidden = configured;
  }

  /* ---------------- 2p 첫 만남 ---------------- */
  function bindFirstMeet() {
    var fm = state.first.parents, fb = state.first.baby;
    $('#p1memo').value = fm.memo; $('#p1date').value = fm.date;
    $('#b1memo').value = fb.memo; $('#b1date').value = fb.date;

    bindPhoto({
      input: '#p1photo', drop: '#p1drop', preview: '#p1preview', img: '#p1img', remove: '#p1remove',
      onChange: function (url) { fm.photo = url; save(true); }
    });
    bindPhoto({
      input: '#b1photo', drop: '#b1drop', preview: '#b1preview', img: '#b1img', remove: '#b1remove',
      onChange: function (url) { fb.photo = url; save(true); }
    });
    if (fm.photo) { $('#p1img').src = fm.photo; $('#p1preview').hidden = false; $('#p1drop').hidden = true; }
    if (fb.photo) { $('#b1img').src = fb.photo; $('#b1preview').hidden = false; $('#b1drop').hidden = true; }

    $('#p1memo').addEventListener('input', function (e) { fm.memo = e.target.value; saveDebounced(); });
    $('#b1memo').addEventListener('input', function (e) { fb.memo = e.target.value; saveDebounced(); });
    $('#p1date').addEventListener('change', function (e) { fm.date = e.target.value; save(true); });
    $('#b1date').addEventListener('change', function (e) { fb.date = e.target.value; save(true); });
  }

  /* ---------------- 3p 탄생 기록 ---------------- */
  function bindBirth() {
    var b = state.birth;
    $('#birthPlace').value = b.place;
    $('#birthTime').value = b.time;
    $('#birthWeight').value = b.weight;
    $('#birthUnit').value = b.unit || 'kg';
    $('#birthHeight').value = b.height;
    $('#birthMemo').value = b.memo;

    $('#birthPlace').addEventListener('input', function (e) { b.place = e.target.value; saveDebounced(); });
    $('#birthTime').addEventListener('change', function (e) { b.time = e.target.value; save(true); });
    $('#birthWeight').addEventListener('input', function (e) { b.weight = e.target.value; saveDebounced(); });
    $('#birthUnit').addEventListener('change', function (e) { b.unit = e.target.value; save(true); });
    $('#birthHeight').addEventListener('input', function (e) { b.height = e.target.value; saveDebounced(); });
    $('#birthMemo').addEventListener('input', function (e) { b.memo = e.target.value; saveDebounced(); });

    bindPhoto({
      input: '#birthPhoto', drop: '#birthDrop', preview: '#birthPreview', img: '#birthImg', remove: '#birthRemove',
      onChange: function (url) { b.photo = url; save(true); }
    });
    if (b.photo) { $('#birthImg').src = b.photo; $('#birthPreview').hidden = false; $('#birthDrop').hidden = true; }
  }

  /* ---------------- 4p 일기 ---------------- */
  function currentDate() {
    if (!state.ui.date) state.ui.date = todayISO();
    return state.ui.date;
  }

  function dayLine(dateISO) {
    var st = familyStatus();
    if (st.mode === 'born') {
      var diff = dayDiff(st.birth, dateISO);
      if (diff < 0) return '태어나기 ' + Math.abs(diff) + '일 전';
      var age = ageText(st.birth, dateISO);
      return '태어난 지 +' + diff + '일' + (age ? ' · ' + age : '');
    }
    if (st.mode === 'expecting') {
      var d = dayDiff(dateISO, st.target);
      var line = countdownText(d, dateISO === todayISO());
      var preg = pregnancyOf(st.weekBase, dateISO);
      return line + (preg ? ' · 임신 ' + preg.text : '');
    }
    return '생일이나 출산 예정일을 등록하면 함께 보여드려요';
  }

  function updateAuthorUI() {
    $$('.author-btn').forEach(function (b) {
      var on = b.dataset.author === state.ui.author;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderDay() {
    var date = currentDate();
    var label = $('#dateLabel');
    if (label) label.textContent = fmtKoreanDate(date);
    var sub = $('#dateSub');
    if (sub) sub.textContent = dayLine(date);
    var picker = $('#dayPicker');
    if (picker) { picker.value = date; picker.max = todayISO(); }
    var face = $('#dayPickerFace');
    if (face) {
      var dp = parts(date);
      face.textContent = dp.y + '. ' + dp.m + '. ' + dp.d + '. (' + WEEK[weekdayOf(date)] + ')';
    }
    var next = $('#nextDay');
    if (next) next.disabled = toUTC(date) >= toUTC(todayISO());

    var list = state.diary[date] || [];
    var count = $('#dayCount');
    if (count) count.textContent = list.length ? '기록 ' + list.length + '건' : '기록 없음';
    renderEntries(date, list);
    updateAuthorUI();
    setOnboard();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderEntries(date, list) {
    var box = $('#entryList');
    if (!box) return;
    box.innerHTML = '';
    if (!list.length) {
      var empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<span class="empty-emoji" aria-hidden="true">🍼</span>' +
        (state.family.baby ? esc(state.family.baby) + '의 이 날 기록이 아직 없어요.<br>엄마도 아빠도 자유롭게 한 줄씩 남겨 보세요.' : '아직 기록이 없어요.<br>왼쪽(아래) 작성 칸에서 오늘을 남겨 보세요.');
      box.appendChild(empty);
      return;
    }
    list.slice().sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); })
      .forEach(function (entry) {
        var art = document.createElement('article');
        art.className = 'entry';
        art.dataset.id = entry.id;

        var head = document.createElement('div');
        head.className = 'entry-head';
        var badge = document.createElement('span');
        badge.className = 'author-badge ' + (entry.author === 'dad' ? 'dad' : 'mom');
        badge.textContent = entry.author === 'dad' ? (state.family.dad || '아빠') : (state.family.mom || '엄마');
        head.appendChild(badge);
        var time = document.createElement('span');
        time.className = 'entry-time';
        time.textContent = entry.time || '';
        head.appendChild(time);

        var tools = document.createElement('div');
        tools.className = 'entry-tools';
        var edit = document.createElement('button');
        edit.type = 'button'; edit.textContent = '수정'; edit.dataset.edit = entry.id;
        var del = document.createElement('button');
        del.type = 'button'; del.textContent = '삭제'; del.dataset.del = entry.id;
        tools.appendChild(edit); tools.appendChild(del);
        head.appendChild(tools);
        art.appendChild(head);

        if (entry.text) {
          var p = document.createElement('p');
          p.className = 'entry-text';
          p.textContent = entry.text;
          art.appendChild(p);
        }
        if (entry.photo) {
          var img = document.createElement('img');
          img.className = 'entry-photo';
          img.src = entry.photo;
          img.alt = '이 날의 사진';
          art.appendChild(img);
        }

        var meta = document.createElement('div');
        meta.className = 'entry-meta';
        if (entry.mood && window.MOODS && MOODS[entry.mood]) {
          var c1 = document.createElement('span');
          c1.className = 'chip';
          c1.textContent = MOODS[entry.mood].emoji + ' ' + MOODS[entry.mood].label;
          meta.appendChild(c1);
        }
        if (entry.feed) { var c2 = document.createElement('span'); c2.className = 'chip'; c2.textContent = '🍼 ' + entry.feed; meta.appendChild(c2); }
        if (entry.sleep) { var c3 = document.createElement('span'); c3.className = 'chip'; c3.textContent = '😴 ' + entry.sleep; meta.appendChild(c3); }
        (entry.tags || []).forEach(function (t) {
          var c = document.createElement('span');
          c.className = 'chip tag-chip';
          c.textContent = '#' + t;
          meta.appendChild(c);
        });
        if (meta.children.length) art.appendChild(meta);

        box.appendChild(art);
      });

    $$('#entryList [data-edit]').forEach(function (b) {
      b.addEventListener('click', function () { startEdit(date, b.dataset.edit); });
    });
    $$('#entryList [data-del]').forEach(function (b) {
      b.addEventListener('click', function () { removeEntry(date, b.dataset.del); });
    });
  }

  function buildTags() {
    var row = $('#tagRow');
    if (!row) return;
    row.innerHTML = '';
    TAGS.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tag'; b.dataset.tag = t; b.textContent = '#' + t;
      b.addEventListener('click', function () { b.classList.toggle('on'); });
      row.appendChild(b);
    });
  }

  function buildMoodOptions() {
    var sel = $('#entryMood');
    if (!sel) return;
    Object.keys(MOODS).forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = MOODS[k].emoji + ' ' + MOODS[k].label;
      sel.appendChild(o);
    });
  }

  function resetEntryForm() {
    editingId = null;
    formPhoto = '';
    $('#entryText').value = '';
    $('#entryMood').value = '';
    $('#feedMemo').value = '';
    $('#sleepMemo').value = '';
    $$('#tagRow .tag').forEach(function (b) { b.classList.remove('on'); });
    var img = $('#entryImg');
    if (img) img.removeAttribute('src');
    $('#entryPreview').hidden = true;
    $('#entryDrop').hidden = false;
    $('#cancelEdit').hidden = true;
    $('#saveEntry').textContent = '기록 저장';
    $('#entryHint').textContent = '저장한 기록은 이 기기에 남아요.';
  }

  function startEdit(date, id) {
    var list = state.diary[date] || [];
    var entry = list.find(function (e) { return e.id === id; });
    if (!entry) return;
    editingId = id;
    state.ui.author = entry.author === 'dad' ? 'dad' : 'mom';
    updateAuthorUI();
    $('#entryText').value = entry.text || '';
    $('#entryMood').value = entry.mood || '';
    $('#feedMemo').value = entry.feed || '';
    $('#sleepMemo').value = entry.sleep || '';
    $$('#tagRow .tag').forEach(function (b) { b.classList.toggle('on', (entry.tags || []).indexOf(b.dataset.tag) >= 0); });
    formPhoto = entry.photo || '';
    if (formPhoto) { $('#entryImg').src = formPhoto; $('#entryPreview').hidden = false; $('#entryDrop').hidden = true; }
    else { $('#entryImg').removeAttribute('src'); $('#entryPreview').hidden = true; $('#entryDrop').hidden = false; }
    $('#cancelEdit').hidden = false;
    $('#saveEntry').textContent = '수정 완료';
    $('#entryHint').textContent = '수정 중이에요.';
    var form = $('#entryForm');
    if (form && form.scrollIntoView) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function removeEntry(date, id) {
    if (!window.confirm('이 기록을 삭제할까요? 되돌릴 수 없어요.')) return;
    var list = state.diary[date] || [];
    state.diary[date] = list.filter(function (e) { return e.id !== id; });
    if (!state.diary[date].length) delete state.diary[date];
    if (editingId === id) resetEntryForm();
    save(true); renderDay(); toast('기록을 삭제했어요.');
  }

  function saveEntry() {
    var date = currentDate();
    var text = $('#entryText').value.trim();
    var mood = $('#entryMood').value;
    var feed = $('#feedMemo').value.trim();
    var sleep = $('#sleepMemo').value.trim();
    var tags = $$('#tagRow .tag.on').map(function (b) { return b.dataset.tag; });
    if (!text && !formPhoto) { toast('이야기나 사진 중 하나는 남겨 주세요.'); $('#entryText').focus(); return; }

    var list = state.diary[date] || (state.diary[date] = []);
    var now = new Date();
    if (editingId) {
      var entry = list.find(function (e) { return e.id === editingId; });
      if (entry) {
        entry.author = state.ui.author; entry.text = text; entry.photo = formPhoto;
        entry.mood = mood; entry.feed = feed; entry.sleep = sleep; entry.tags = tags;
        entry.updatedAt = now.toISOString();
      }
      toast('기록을 수정했어요.');
    } else {
      list.push({
        id: 'e' + now.getTime().toString(36) + Math.random().toString(36).slice(2, 6),
        author: state.ui.author,
        text: text,
        photo: formPhoto,
        mood: mood,
        feed: feed,
        sleep: sleep,
        tags: tags,
        time: pad(now.getHours()) + ':' + pad(now.getMinutes()),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
      toast('오늘의 기록을 저장했어요.');
    }
    save(true);
    resetEntryForm();
    renderDay();
    updateBrand();
  }

  function bindDiaryForm() {
    buildMoodOptions();
    buildTags();
    updateAuthorUI();
    $$('.author-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        state.ui.author = b.dataset.author;
        updateAuthorUI();
        saveDebounced();
      });
    });

    bindPhoto({
      input: '#entryPhoto', drop: '#entryDrop', preview: '#entryPreview', img: '#entryImg', remove: '#entryRemove',
      onChange: function (url) { formPhoto = url; }
    });

    $('#saveEntry').addEventListener('click', saveEntry);
    $('#cancelEdit').addEventListener('click', function () { resetEntryForm(); toast('수정을 취소했어요.'); });

    var form = $('#entryForm');
    if (form) form.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); saveEntry(); }
    });

    $('#entryText').addEventListener('input', function () {
      if ($('#cancelEdit').hidden) $('#entryHint').textContent = '저장한 기록은 이 기기에 남아요.';
    });
  }

  function bindDayBar() {
    $('#prevDay').addEventListener('click', function () { setDate(addDays(currentDate(), -1)); });
    $('#nextDay').addEventListener('click', function () {
      var d = addDays(currentDate(), 1);
      if (toUTC(d) > toUTC(todayISO())) return;
      setDate(d);
    });
    $('#todayBtn').addEventListener('click', function () { setDate(todayISO()); });
    var picker = $('#dayPicker');
    picker.addEventListener('change', function (e) {
      if (e.target.value) setDate(e.target.value);
    });
    picker.addEventListener('click', function () {
      try { if (picker.showPicker) picker.showPicker(); } catch (e) { /* 브라우저가 지원하지 않으면 기본 동작 */ }
    });
  }

  function setDate(date) {
    if (!date) return;
    if (toUTC(date) > toUTC(todayISO())) {
      date = todayISO();
      toast('오늘까지만 기록할 수 있어요.');
    }
    state.ui.date = date;
    if (editingId) resetEntryForm();
    saveDebounced();
    renderDay();
  }

  /* ---------------- 공유 링크 ---------------- */
  function encodeShare(obj) {
    var bytes = new TextEncoder().encode(JSON.stringify(obj));
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeShare(str) {
    var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function sharePayload(date) {
    var list = (state.diary[date] || []).slice().sort(function (a, b) {
      return String(a.createdAt).localeCompare(String(b.createdAt));
    });
    return {
      v: 1,
      n: state.family.baby || '우리 아기',
      d: date,
      day: babySolarISO() ? Math.max(0, dayDiff(babySolarISO(), date)) : null,
      l: list.map(function (e) {
        var m = e.mood && window.MOODS && MOODS[e.mood] ? (MOODS[e.mood].emoji + ' ' + MOODS[e.mood].label) : '';
        return { a: e.author === 'dad' ? (state.family.dad || '아빠') : (state.family.mom || '엄마'), r: e.author === 'dad' ? 'dad' : 'mom', t: e.text || '', m: m };
      })
    };
  }

  function shareUrl(date) {
    var base = location.href.split('#')[0];
    return base + '#share=' + encodeShare(sharePayload(date));
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (e) { reject(e); }
    });
  }

  function bindShareButtons() {
    $('#shareBtn').addEventListener('click', function () {
      var date = currentDate();
      if (!(state.diary[date] || []).length) { toast('이 날은 아직 기록이 없어요.'); return; }
      var url = shareUrl(date);
      copyText(url).then(function () {
        toast('이 날 일기 공유 링크를 복사했어요. 메신저에 붙여넣어 보세요.');
      }).catch(function () {
        window.prompt('아래 주소를 복사해 주세요.', url);
      });
    });
    $('#cardBtn').addEventListener('click', function () { downloadCard(); });
  }

  /* ---------------- 공유 전용 화면 ---------------- */
  function hideShare() {
    var root = $('#shareRoot');
    if (root) { root.hidden = true; root.innerHTML = ''; }
    var app = $('#app');
    if (app) app.hidden = false;
  }

  function renderShareError() {
    var app = $('#app'); if (app) app.hidden = true;
    var root = $('#shareRoot'); root.hidden = false;
    root.innerHTML = '';
    var letter = document.createElement('div'); letter.className = 'letter';
    var top = document.createElement('div'); top.className = 'letter-top';
    var t = document.createElement('p'); t.className = 'letter-date'; t.textContent = '공유된 일기를 열 수 없어요';
    top.appendChild(t);
    letter.appendChild(top);
    var p = document.createElement('p'); p.className = 'letter-text';
    p.textContent = '주소가 중간에 잘렸거나, 이 앱의 공유 링크가 아닐 수 있어요. 보내준 분께 다시 링크를 받아 주세요.';
    letter.appendChild(p);
    var foot = document.createElement('div'); foot.className = 'letter-foot';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'share-open'; btn.textContent = '내 육아일기장 열기';
    btn.addEventListener('click', function () { location.hash = ''; });
    foot.appendChild(btn); letter.appendChild(foot);
    root.appendChild(letter);
  }

  function renderShare(payload) {
    var app = $('#app'); if (app) app.hidden = true;
    var root = $('#shareRoot'); root.hidden = false;
    root.innerHTML = '';

    var letter = document.createElement('div'); letter.className = 'letter';
    var top = document.createElement('div'); top.className = 'letter-top';

    var orn = document.createElement('p'); orn.className = 'letter-orn'; orn.textContent = '✿ ✿ ✿';
    top.appendChild(orn);

    var baby = document.createElement('p'); baby.className = 'letter-baby';
    var strong = document.createElement('strong'); strong.textContent = payload.n || '우리 아기';
    baby.appendChild(strong);
    baby.appendChild(document.createTextNode('의 하루'));
    top.appendChild(baby);

    var date = document.createElement('p'); date.className = 'letter-date';
    date.textContent = fmtKoreanDate(payload.d);
    top.appendChild(date);

    if (payload.day !== null && payload.day !== undefined) {
      var days = document.createElement('p'); days.className = 'letter-days';
      days.textContent = '태어난 지 +' + payload.day + '일';
      top.appendChild(days);
    }
    letter.appendChild(top);

    var body = document.createElement('div'); body.className = 'letter-body';
    (payload.l || []).forEach(function (e) {
      var wrap = document.createElement('div'); wrap.className = 'letter-entry';
      var author = document.createElement('span');
      author.className = 'letter-author';
      author.textContent = (e.r === 'dad' ? '👨 ' : '👩 ') + (e.a || '');
      wrap.appendChild(author);
      var txt = document.createElement('p'); txt.className = 'letter-text';
      txt.textContent = e.t || '';
      wrap.appendChild(txt);
      if (e.m) {
        var mood = document.createElement('p'); mood.className = 'letter-mood'; mood.textContent = e.m;
        wrap.appendChild(mood);
      }
      body.appendChild(wrap);
    });
    letter.appendChild(body);

    var foot = document.createElement('div'); foot.className = 'letter-foot';
    var note = document.createElement('p'); note.textContent = '우리 아기의 소중한 하루를 함께 읽어 주셔서 고마워요.';
    foot.appendChild(note);
    var open = document.createElement('button');
    open.type = 'button'; open.className = 'share-open'; open.textContent = '내 육아일기장 열기';
    open.addEventListener('click', function () {
      try { history.replaceState(null, '', location.pathname + location.search); }
      catch (e) { location.hash = ''; }
      hideShare();
      showPage(state.family.baby && familyStatus().mode !== 'empty' ? 4 : 1);
    });
    foot.appendChild(open);
    letter.appendChild(foot);

    root.appendChild(letter);
    var noteEl = document.createElement('p');
    noteEl.className = 'share-note';
    noteEl.textContent = '이 화면은 보내준 그날의 일기만 보여줘요. 내 일기장의 다른 기록은 보이지 않습니다.';
    root.appendChild(noteEl);
  }

  function checkShare() {
    var h = location.hash || '';
    if (h.indexOf('#share=') === 0) {
      var enc = h.slice(7);
      try {
        var payload = decodeShare(enc);
        if (!payload || !/^\d{4}-\d{2}-\d{2}$/.test(String(payload.d)) || !Array.isArray(payload.l)) throw new Error('bad payload');
        renderShare(payload);
      } catch (e) { renderShareError(); }
    } else {
      hideShare();
    }
  }

  /* ---------------- 카드 PNG ---------------- */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCover(ctx, img, x, y, w, h, r) {
    var ir = img.naturalWidth / img.naturalHeight;
    var br = w / h;
    var sw = ir > br ? img.naturalHeight * br : img.naturalWidth;
    var sh = ir > br ? img.naturalHeight : img.naturalWidth / br;
    var sx = (img.naturalWidth - sw) / 2;
    var sy = (img.naturalHeight - sh) / 2;
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
  }

  function wrapLines(ctx, text, maxWidth) {
    var lines = [];
    String(text).split('\n').forEach(function (para) {
      if (!para) { lines.push(''); return; }
      var line = '';
      for (var i = 0; i < para.length; i += 1) {
        var test = line + para[i];
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = para[i];
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
    });
    return lines;
  }

  function loadImage(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  function heart(ctx, cx, cy, s, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.9);
    ctx.bezierCurveTo(cx - s * 1.6, cy + s * 0.1, cx - s * 0.9, cy - s * 1.1, cx, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 0.9, cy - s * 1.1, cx + s * 1.6, cy + s * 0.1, cx, cy + s * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function downloadCard() {
    var date = currentDate();
    var list = (state.diary[date] || []).slice();
    if (!list.length) { toast('이 날은 아직 기록이 없어요.'); return; }
    list.sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); });
    var photoEntry = list.find(function (e) { return !!e.photo; });
    var sol = babySolarISO();

    var W = 1080, H = 1350, M = 54;
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    var FONT = '"Pretendard Variable",Pretendard,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';

    // 배경
    ctx.fillStyle = '#F2F4F6';
    ctx.fillRect(0, 0, W, H);
    var g1 = ctx.createRadialGradient(120, 40, 30, 120, 40, 720);
    g1.addColorStop(0, 'rgba(49, 130, 246, 0.16)');
    g1.addColorStop(1, 'rgba(49, 130, 246, 0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    var g2 = ctx.createRadialGradient(1000, 1260, 40, 1000, 1260, 640);
    g2.addColorStop(0, 'rgba(18, 183, 106, 0.12)');
    g2.addColorStop(1, 'rgba(18, 183, 106, 0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    // 종이 카드
    ctx.save();
    ctx.shadowColor = 'rgba(23, 31, 40, 0.12)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, M, M, W - M * 2, H - M * 2, 42);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, M, M, W - M * 2, H - M * 2, 42);
    ctx.clip();
    ctx.fillStyle = 'rgba(229, 232, 235, 0.75)';
    for (var px = M + 14; px < W - M; px += 26) {
      for (var py = M + 14; py < H - M; py += 26) {
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.strokeStyle = '#E5E8EB';
    ctx.lineWidth = 2;
    roundRect(ctx, M, M, W - M * 2, H - M * 2, 42);
    ctx.stroke();

    var cx = W / 2;
    var left = 104, maxW = W - left * 2;

    // 헤더
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3182F6';
    ctx.font = '600 26px ' + FONT;
    ctx.fillText('✿   ✿   ✿', cx, 150);

    ctx.fillStyle = '#6B7684';
    ctx.font = '700 29px ' + FONT;
    ctx.fillText((state.family.baby || '우리 아기') + '의 하루', cx, 212);

    ctx.fillStyle = '#191F28';
    ctx.font = '800 46px ' + FONT;
    ctx.fillText(fmtKoreanDate(date), cx, 282);

    var y = 282;
    if (sol) {
      ctx.fillStyle = '#1B64DA';
      ctx.font = '700 25px ' + FONT;
      ctx.fillText('태어난 지 +' + Math.max(0, dayDiff(sol, date)) + '일', cx, 326);
      y = 326;
    }

    // 점선 구분선
    ctx.save();
    ctx.strokeStyle = '#DDE1E6';
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 11]);
    ctx.beginPath();
    ctx.moveTo(210, y + 44);
    ctx.lineTo(W - 210, y + 44);
    ctx.stroke();
    ctx.restore();

    y = y + 84;
    var photoTop = y;
    var photoH = 430;
    if (photoEntry) y = photoTop + photoH + 54;

    var footY = H - M - 96;

    var pending = photoEntry ? loadImage(photoEntry.photo) : Promise.resolve(null);
    pending.then(function (img) {
      if (img && img.naturalWidth) {
        ctx.fillStyle = '#F2F4F6';
        roundRect(ctx, left, photoTop, maxW, photoH, 26);
        ctx.fill();
        drawCover(ctx, img, left, photoTop, maxW, photoH, 26);
        ctx.strokeStyle = '#E5E8EB';
        ctx.lineWidth = 2;
        roundRect(ctx, left, photoTop, maxW, photoH, 26);
        ctx.stroke();
      }

      list.forEach(function (entry) {
        if (y > footY - 30) return;
        var authorName = entry.author === 'dad' ? (state.family.dad || '아빠') : (state.family.mom || '엄마');

        ctx.textAlign = 'left';
        ctx.font = '800 25px ' + FONT;
        var nameW = ctx.measureText(authorName).width;
        var chipW = nameW + 66;
        ctx.fillStyle = entry.author === 'dad' ? '#E8F3FF' : '#FFF0F3';
        roundRect(ctx, left, y - 32, chipW, 50, 25);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = entry.author === 'dad' ? '#3182F6' : '#D6436A';
        ctx.arc(left + 26, y - 7, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = entry.author === 'dad' ? '#1B64DA' : '#C43A5E';
        ctx.fillText(authorName, left + 44, y + 1);

        if (entry.time) {
          ctx.font = '600 22px ' + FONT;
          ctx.fillStyle = '#8B95A1';
          ctx.fillText(entry.time, left + chipW + 16, y + 1);
        }
        y += 52;

        ctx.fillStyle = '#333D4B';
        ctx.font = '400 31px ' + FONT;
        var lines = wrapLines(ctx, entry.text || '', maxW);
        var maxLines = Math.max(1, Math.floor((footY - y - 10) / 50));
        lines.slice(0, maxLines).forEach(function (line, i) {
          var t = line;
          if (i === maxLines - 1 && lines.length > maxLines) t = t.slice(0, Math.max(0, t.length - 1)) + '…';
          ctx.fillText(t, left, y);
          y += 50;
        });

        if (entry.mood && MOODS[entry.mood]) {
          ctx.fillStyle = '#6B7684';
          ctx.font = '600 23px ' + FONT;
          ctx.fillText(MOODS[entry.mood].emoji + ' ' + MOODS[entry.mood].label, left, y + 8);
          y += 42;
        }
        y += 26;
      });

      // 남는 공간 장식
      if (y < footY - 90) {
        var hy = footY - 46;
        heart(ctx, cx - 46, hy, 15, 'rgba(214, 67, 106, 0.35)');
        heart(ctx, cx, hy - 8, 19, 'rgba(49, 130, 246, 0.45)');
        heart(ctx, cx + 46, hy, 15, 'rgba(18, 183, 106, 0.30)');
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#8B95A1';
      ctx.font = '600 21px ' + FONT;
      ctx.fillText('우리 아기 육아일기', cx, H - M - 44);

      function finish(blob, url) {
        window.__diaryApp.lastCard = { date: date, bytes: blob ? blob.size : 0 };
        var a = document.createElement('a');
        a.href = url;
        a.download = '육아일기_' + date + '.png';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast('카드 이미지를 저장했어요. 사진 앱이나 카톡으로 보내 보세요.');
      }
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) {
          var url = URL.createObjectURL(blob);
          finish(blob, url);
          setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        }, 'image/png');
      } else {
        finish(null, canvas.toDataURL('image/png'));
      }
    });
  }

  /* ---------------- 5p 아기 정보 ---------------- */
  function constellationOf(m, d) {
    var key = m * 100 + d;
    for (var i = 0; i < CONSTELLATIONS.length; i += 1) {
      var c = CONSTELLATIONS[i];
      var s = c.start[0] * 100 + c.start[1];
      var e = c.end[0] * 100 + c.end[1];
      if (s <= e) { if (key >= s && key <= e) return c; }
      else { if (key >= s || key <= e) return c; }
    }
    return CONSTELLATIONS[0];
  }

  function zodiacOf(lunarYear) {
    var idx = ((lunarYear - 4) % 12 + 12) % 12;
    return ZODIAC_ANIMALS[idx];
  }

  function ipchunNote(m, d) {
    // 입춘은 양력 2월 3~5일. 사주에서는 입춘을 해의 경계로 본다.
    if (m === 2 && d >= 3 && d <= 5) return '입춘 무렵 출생이에요. 사주(명리)에서는 입춘을 해의 경계로 보아 전년도 띠로 보기도 합니다.';
    return '';
  }

  function ddayCardHTML(label, dateISO, kind) {
    var diff = dday(dateISO);
    var st = ddayState(diff);
    return '<div class="dday-card">' +
      '<p class="dday-label">' + esc(label) + '</p>' +
      '<p class="dday-value">' + esc(ddayLabel(diff)) + '</p>' +
      '<p class="dday-date">' + esc(fmtShort(dateISO)) + ' (' + WEEK[weekdayOf(dateISO)] + ')</p>' +
      '<span class="dday-state ' + st.cls + '">' + esc(st.text) + '</span>' +
      '</div>';
  }

  function buildInfo() {
    var f = state.family;
    var st = familyStatus();
    var nameEl = $('#infoName');
    if (nameEl) nameEl.textContent = f.baby || '아기 이름';
    var birthEl = $('#infoBirth'), lunarEl = $('#infoLunar'), noteEl = $('#infoNote');
    var grid = $('#ddayGrid'), cards = $('#infoCards');

    var expecting = st.mode === 'expecting';
    var target = st.target;

    if (!target) {
      if (birthEl) birthEl.textContent = '아기 생일이나 출산 예정일을 등록하면 여기에 정보가 채워져요';
      if (lunarEl) lunarEl.textContent = '';
      if (noteEl) { noteEl.hidden = true; noteEl.textContent = ''; }
      if (grid) grid.innerHTML = '<div class="dday-card"><p class="dday-label">아직 생일도 예정일도 없어요</p><p class="dday-value">1p</p><p class="dday-date">가족 소개에서 생일이나 예정일을 넣어 주세요</p></div>';
      if (cards) cards.innerHTML = '';
      return;
    }

    var tp = parts(target);
    var targetISO = tp.y + '-' + pad(tp.m) + '-' + pad(tp.d);
    var lun = window.LunarCal ? LunarCal.solarToLunar(tp.y, tp.m, tp.d) : null;
    var today = todayISO();

    if (noteEl) {
      noteEl.hidden = !expecting;
      noteEl.textContent = expecting ? '지금은 출산 예정일 기준 미리보기예요. 실제 태어난 날 생일을 등록하면 띠·별자리·탄생석·꽃말이 실제 생일 기준으로 바뀝니다.' : '';
    }

    if (expecting) {
      var cd = dayDiff(today, targetISO);
      var preg = pregnancyOf(st.weekBase, today);
      if (birthEl) birthEl.textContent = '출산 예정일 ' + tp.y + '년 ' + tp.m + '월 ' + tp.d + '일 (' + WEEK[weekdayOf(targetISO)] + '요일)';
      if (lunarEl) lunarEl.textContent = (lun ? '음력 ' + lun.y + '년 ' + (lun.leap ? '윤' : '') + lun.m + '월 ' + lun.d + '일 · ' : '') + countdownText(cd, true);
      if (grid) {
        var stc = ddayState(cd);
        var meet = '<div class="dday-card">' +
          '<p class="dday-label">' + (cd < 0 ? '예정일에서' : '만남까지') + '</p>' +
          '<p class="dday-value">' + esc(ddayLabel(cd)) + '</p>' +
          '<p class="dday-date">' + esc(fmtShort(targetISO)) + ' (' + WEEK[weekdayOf(targetISO)] + ')</p>' +
          '<span class="dday-state ' + stc.cls + '">' + esc(stc.text) + '</span></div>';
        var weekCard = preg
          ? '<div class="dday-card"><p class="dday-label">임신 주수</p><p class="dday-value">' + esc(preg.text) + '</p><p class="dday-date">마지막 생리일 ' + esc(fmtShort(preg.lmp)) + ' 기준</p><span class="dday-state upcoming">280일 역산</span></div>'
          : '<div class="dday-card"><p class="dday-label">임신 주수</p><p class="dday-value">-</p><p class="dday-date">임신 기간(약 40주) 밖이에요</p></div>';
        grid.innerHTML = meet + weekCard + ddayCardHTML('100일', addDays(targetISO, 99), '예정일 기준');
      }
    } else {
      var birthISO = st.birth;
      if (birthEl) birthEl.textContent = '양력 ' + tp.y + '년 ' + tp.m + '월 ' + tp.d + '일 (' + WEEK[weekdayOf(birthISO)] + '요일)';
      var lunarTxt = lun ? ('음력 ' + lun.y + '년 ' + (lun.leap ? '윤' : '') + lun.m + '월 ' + lun.d + '일') : '';
      if (st.due) {
        var gap = dayDiff(birthISO, st.due); // +면 예정일보다 늦게
        lunarTxt += (lunarTxt ? ' · ' : '') + '출산 예정일 ' + fmtShort(st.due) + ' (' +
          (gap > 0 ? '예정일보다 ' + gap + '일 늦게 만났어요' : (gap < 0 ? '예정일보다 ' + Math.abs(gap) + '일 일찍 만났어요' : '예정일에 만났어요')) + ')';
      }
      if (lunarEl) lunarEl.textContent = lunarTxt;
      if (grid) {
        var nextBirth = nextAnnual(birthISO);
        grid.innerHTML =
          ddayCardHTML('100일', addDays(birthISO, 99), '출생일을 1일로 세는 한국식') +
          ddayCardHTML('첫돌', addYears(birthISO, 1), '양력 생일 기준 1년') +
          ddayCardHTML('다가오는 생일', nextBirth, (parts(nextBirth).y - tp.y) + '번째 생일');
      }
    }

    var html = '';
    var pre = expecting ? '예정일 기준 미리보기 · ' : '';

    // 띠
    var zYear = lun ? lun.y : tp.y;
    var z = zodiacOf(zYear);
    html += '<article class="card info-card">' +
      '<div class="info-card-head"><span class="info-icon">' + z.emoji + '</span><p class="info-main">' + esc(z.name) + '띠</p></div>' +
      '<p class="info-sub">' + esc(pre) + esc(f.baby || '아기') + '는 ' + esc(z.note) + ' 아이예요.</p>' +
      '<div class="info-list"><span class="info-pill peach">' + esc(ganjiOfYear(zYear)) + '</span><span class="info-pill">' + esc(z.hanja) + ' · 12지신 ' + (ZODIAC_ANIMALS.indexOf(z) + 1) + '번째</span></div>' +
      '<p class="info-sub">띠는 음력 설날(' + esc(lun ? (lun.y + '년 음력 1월 1일') : '음력 1월 1일') + ')을 기준으로 바뀌어요. ' + esc(ipchunNote(tp.m, tp.d) || '사주(명리)에서는 입춘(2월 3~5일)을 한 해의 경계로 보기도 합니다.') + '</p>' +
      '</article>';

    // 별자리
    var c = constellationOf(tp.m, tp.d);
    html += '<article class="card info-card">' +
      '<div class="info-card-head"><span class="info-icon">' + c.symbol + '</span><p class="info-main">' + esc(c.name) + '</p></div>' +
      '<p class="info-sub">' + esc(pre) + esc(c.note) + '</p>' +
      '<div class="info-list"><span class="info-pill sky">' + c.start[0] + '월 ' + c.start[1] + '일 ~ ' + c.end[0] + '월 ' + c.end[1] + '일</span><span class="info-pill">' + (expecting ? '예정일 ' : '양력 ') + tp.m + '월 ' + tp.d + '일</span></div>' +
      '</article>';

    // 탄생석
    var stone = BIRTHSTONES[tp.m];
    html += '<article class="card info-card">' +
      '<div class="info-card-head"><span class="stone-dot" style="background:' + stone.color + '"></span><p class="info-main">' + esc(stone.name) + '</p></div>' +
      '<p class="info-sub">' + esc(pre) + tp.m + '월의 탄생석 · ' + esc(stone.en) + '</p>' +
      '<div class="info-list"><span class="info-pill peach">의미 · ' + esc(stone.meaning) + '</span></div>' +
      '</article>';

    // 탄생화
    var key = tp.m + '-' + tp.d;
    var flower = (window.BIRTH_FLOWERS && BIRTH_FLOWERS[key]) || null;
    var mf = MONTH_FLOWERS[tp.m];
    html += '<article class="card info-card">' +
      '<div class="info-card-head"><span class="flower-emoji">🌸</span><p class="info-main">' + esc(flower ? flower[0] : mf.name) + '</p></div>' +
      '<p class="info-sub">' + esc(pre) + esc(tp.m) + '월 ' + esc(tp.d) + '일의 탄생화' + (flower ? '' : ' (월별 기준)') + '</p>' +
      '<div class="info-list"><span class="info-pill">꽃말 · ' + esc(flower ? flower[1] : mf.meaning) + '</span><span class="info-pill sky">' + tp.m + '월 대표 · ' + esc(mf.name) + '</span></div>' +
      '</article>';

    // 부모님 생일
    var parents = [];
    if (f.momBirth) parents.push({ who: '엄마', name: f.mom, birth: f.momBirth });
    if (f.dadBirth) parents.push({ who: '아빠', name: f.dad, birth: f.dadBirth });
    if (parents.length) {
      var rows = parents.map(function (p) {
        var next = nextAnnual(p.birth);
        var diff = dday(next);
        var pc = constellationOf(parts(p.birth).m, parts(p.birth).d);
        var pz = zodiacOf(parts(p.birth).y);
        return '<div class="parent-line">' +
          '<div><div class="p-name">' + esc(p.name || p.who) + ' <span class="p-sub">' + esc(p.who) + ' · ' + fmtShort(p.birth) + ' · ' + esc(pz.name) + '띠 ' + esc(pc.symbol) + '</span></div>' +
          '<div class="p-sub">' + esc(fmtKoreanDate(next)) + '</div></div>' +
          '<span class="p-dday">' + esc(ddayLabel(diff)) + '</span>' +
          '</div>';
      }).join('');
      html += '<article class="card info-card">' +
        '<div class="info-card-head"><span class="info-icon">🎂</span><p class="info-main">엄마·아빠 생일</p></div>' +
        rows +
        '</article>';
    }

    if (cards) cards.innerHTML = html;
  }

  /* ---------------- 백업 ---------------- */
  function backupText() { return JSON.stringify(state); }
  function backupFileName() { return 'baby-diary-backup-' + todayISO() + '.txt'; }

  function downloadTextFile(text, filename) {
    try {
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return true;
    } catch (e) { return false; }
  }

  function openPasteModal(prefill) {
    var modal = $('#pasteModal');
    if (!modal) return;
    var area = $('#pasteArea');
    if (area) area.value = prefill || '';
    modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(function () {
      if (!area) return;
      area.focus();
      if (prefill) { try { area.setSelectionRange(0, prefill.length); } catch (e) { /* noop */ } }
    }, 60);
  }

  function closePasteModal() {
    var modal = $('#pasteModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  function applyBackupText(raw) {
    var text = String(raw == null ? '' : raw).trim();
    if (!text) { toast('붙여넣은 내용이 비어 있어요.'); return false; }
    var incoming;
    try { incoming = JSON.parse(text); } catch (e) { toast('백업 내용을 읽지 못했어요. 글자가 잘리지 않았는지 확인해 주세요.'); return false; }
    if (!incoming || !incoming.family || !incoming.diary) { toast('이 앱의 백업 내용이 아니에요.'); return false; }
    var ok = window.confirm('가져온 기록을 지금 일기에 합칠까요?\n기존 기록은 그대로 두고, 없는 기록만 더합니다.');
    if (!ok) return false;
    mergeBackup(incoming);
    save(true);
    refreshAll();
    toast('백업을 합쳤어요.');
    return true;
  }

  function copyBackup() {
    var data = backupText();
    copyText(data).then(function () {
      toast('백업 텍스트를 복사했어요. 카톡 나에게 보내기·메모에 붙여넣어 두세요.');
    }).catch(function () {
      openPasteModal(data);
      toast('복사가 막혀 있어요. 열린 창의 글을 길게 눌러 전체 복사해 주세요.');
    });
  }

  function shareBackup() {
    var data = backupText();
    var fname = backupFileName();
    var file = null;
    try { file = new File([data], fname, { type: 'text/plain' }); } catch (e) { file = null; }

    function saveFile() {
      if (downloadTextFile(data, fname)) {
        toast('백업 파일을 저장했어요. 다운로드 폴더의 ' + fname + '을 확인해 주세요.');
      } else {
        openPasteModal(data);
        toast('파일 저장이 막혀 있어요. 백업 텍스트 복사를 이용해 주세요.');
      }
    }
    function sharePlainText() {
      if (data.length < 80000 && navigator.share) {
        navigator.share({ title: '우리 아기 육아일기 백업', text: data })
          .catch(function (err) { if (!err || err.name !== 'AbortError') saveFile(); });
        return;
      }
      saveFile();
    }

    if (navigator.share && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: '우리 아기 육아일기 백업', text: '우리 아기 육아일기 백업이에요.' })
        .catch(function (err) { if (!err || err.name !== 'AbortError') sharePlainText(); });
      return;
    }
    sharePlainText();
  }

  function bindBackup() {
    var copyBtn = $('#copyBackupBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyBackup);
    var pasteBtn = $('#pasteMergeBtn');
    if (pasteBtn) pasteBtn.addEventListener('click', function () { openPasteModal(''); });
    var shareBtn = $('#shareBackupBtn');
    if (shareBtn) shareBtn.addEventListener('click', shareBackup);

    var modal = $('#pasteModal');
    if (modal) {
      var closeBtn = $('#pasteClose'), cancelBtn = $('#pasteCancel'), confirmBtn = $('#pasteMergeConfirm');
      if (closeBtn) closeBtn.addEventListener('click', closePasteModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closePasteModal);
      modal.addEventListener('click', function (e) { if (e.target === modal) closePasteModal(); });
      if (confirmBtn) confirmBtn.addEventListener('click', function () {
        if (applyBackupText($('#pasteArea').value)) closePasteModal();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.hidden) closePasteModal();
      });
    }

    var file = $('#importFile');
    var importBtn = $('#importBtn');
    if (importBtn && file) importBtn.addEventListener('click', function () { file.click(); });
    if (file) file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { applyBackupText(reader.result); };
      reader.onerror = function () { toast('파일을 읽지 못했어요.'); };
      reader.readAsText(f);
      file.value = '';
    });

    $('#resetBtn').addEventListener('click', function () {
      if (!window.confirm('모든 기록과 사진을 지울까요? 되돌릴 수 없어요.')) return;
      if (!window.confirm('정말 지울까요? 필요하면 먼저 내보내기로 백업해 주세요.')) return;
      try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
      state = defaults();
      refreshAll();
      showPage(1);
      toast('모두 지웠어요. 새로 시작해요.');
    });
  }

  function mergeBackup(incoming) {
    var f = state.family;
    ['mom', 'dad', 'baby', 'birth', 'due', 'cal', 'momBirth', 'dadBirth'].forEach(function (k) {
      if (!f[k] && incoming.family && incoming.family[k]) f[k] = incoming.family[k];
    });
    ['parents', 'baby'].forEach(function (k) {
      if (!incoming.first || !incoming.first[k]) return;
      ['photo', 'memo', 'date'].forEach(function (kk) {
        if (!state.first[k][kk] && incoming.first[k][kk]) state.first[k][kk] = incoming.first[k][kk];
      });
    });
    if (incoming.birth) {
      Object.keys(incoming.birth).forEach(function (k) {
        if (!state.birth[k] && incoming.birth[k]) state.birth[k] = incoming.birth[k];
      });
    }
    Object.keys(incoming.diary || {}).forEach(function (date) {
      var mine = state.diary[date] || (state.diary[date] = []);
      var byId = {};
      mine.forEach(function (e) { byId[e.id] = e; });
      (incoming.diary[date] || []).forEach(function (e) {
        if (!e || !e.id) return;
        var cur = byId[e.id];
        if (!cur) {
          mine.push(e); byId[e.id] = e;
        } else if (String(e.updatedAt || '') > String(cur.updatedAt || '')) {
          Object.assign(cur, e);
        }
      });
    });
  }

  function refreshAll() {
    var f = state.family;
    $('#momName').value = f.mom; $('#dadName').value = f.dad; $('#babyName').value = f.baby;
    $('#babyBirth').value = f.birth; $('#momBirth').value = f.momBirth; $('#dadBirth').value = f.dadBirth;
    var dueEl = $('#babyDue'); if (dueEl) dueEl.value = f.due || '';
    $$('#calSegment .segment-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.cal === f.cal); });
    syncLeapUI(); setBirthHint(); setDueHint(); updateBrand(); setOnboard(); renderDay();
    if ($('#page-5').classList.contains('active')) buildInfo();
  }

  /* ---------------- 음악 (Web Audio 오르골) ---------------- */
  var MusicBox = (function () {
    var ctx = null, master = null, delayNode = null, nodes = [], timer = null;
    var playing = false, idx = 0, vol = 0.35, totalDur = 0;

    var twinkle = [
      [60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2],
      [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2],
      [67, 1], [67, 1], [65, 1], [65, 1], [64, 1], [64, 1], [62, 2],
      [67, 1], [67, 1], [65, 1], [65, 1], [64, 1], [64, 1], [62, 2],
      [60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2],
      [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2]
    ];

    var orgel = [
      [64, 1], [67, 1], [72, 2], [71, 1], [67, 1], [64, 2],
      [65, 1], [69, 1], [74, 2], [72, 1], [69, 1], [65, 2],
      [62, 1], [65, 1], [71, 2], [69, 1], [65, 1], [62, 2],
      [60, 1], [64, 1], [67, 2], [69, 1], [67, 1], [64, 2]
    ];
    var orgelBass = [[48, 3], [41, 3], [43, 3], [45, 3], [48, 3], [41, 3], [43, 3], [48, 3]];

    var moonlight = [];
    (function () {
      var chords = [[53, 57, 60, 65], [50, 53, 57, 62], [46, 50, 53, 58], [48, 52, 55, 60]];
      for (var rep = 0; rep < 2; rep += 1) {
        chords.forEach(function (ch) {
          var seq = [ch[0], ch[1], ch[2], ch[3], ch[2], ch[1], ch[0], ch[1]];
          seq.forEach(function (n) { moonlight.push([n, 0.5]); });
        });
      }
    })();
    var moonlightBass = (function () {
      var roots = [41, 38, 34, 36], out = [];
      for (var r = 0; r < 2; r += 1) roots.forEach(function (n) { out.push([n, 4]); });
      return out;
    })();

    var TRACKS = [
      { name: '반짝반짝 작은별', bpm: 82, melody: twinkle, bass: [[48, 8], [43, 8], [48, 8], [43, 8], [48, 8], [43, 8]] },
      { name: '오르골 자장가', bpm: 74, melody: orgel, bass: orgelBass },
      { name: '포근한 달빛 아르페지오', bpm: 66, melody: moonlight, bass: moonlightBass }
    ];

    function ensure() {
      if (ctx) return ctx;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = vol;
        delayNode = ctx.createDelay(1.0);
        delayNode.delayTime.value = 0.26;
        var fb = ctx.createGain();
        fb.gain.value = 0.16;
        var wet = ctx.createGain();
        wet.gain.value = 0.22;
        master.connect(delayNode);
        delayNode.connect(fb);
        fb.connect(delayNode);
        delayNode.connect(wet);
        wet.connect(ctx.destination);
        master.connect(ctx.destination);
      } catch (e) { ctx = null; return null; }
      return ctx;
    }

    function note(midi, start, dur, level) {
      var freq = 440 * Math.pow(2, (midi - 69) / 12);
      var o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.value = freq;
      var o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = freq * 2;
      o2.detune.value = 3;
      var g = ctx.createGain();
      var atk = 0.012;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(level || 0.18, start + atk);
      g.gain.exponentialRampToValueAtTime(0.0008, start + Math.max(0.12, dur * 0.95));
      var shimmer = ctx.createGain();
      shimmer.gain.value = 0.16;
      o1.connect(g);
      o2.connect(shimmer);
      shimmer.connect(g);
      g.connect(master);
      o1.start(start); o1.stop(start + dur + 0.08);
      o2.start(start); o2.stop(start + dur + 0.08);
      nodes.push(o1, o2);
      if (nodes.length > 400) nodes = nodes.slice(-200);
    }

    function scheduleTrack() {
      if (!ctx) return;
      var track = TRACKS[idx];
      var beat = 60 / track.bpm;
      var t0 = ctx.currentTime + 0.12;
      var t = t0;
      track.melody.forEach(function (n) {
        if (n[0]) note(n[0], t, n[1] * beat, 0.17);
        t += n[1] * beat;
      });
      if (track.bass) {
        var bt = t0;
        track.bass.forEach(function (n) {
          if (n[0]) note(n[0], bt, n[1] * beat, 0.10);
          bt += n[1] * beat;
        });
      }
      totalDur = t - t0;
      timer = setTimeout(function () { if (playing) scheduleTrack(); }, Math.max(400, (totalDur - 0.25) * 1000));
    }

    function start() {
      if (!ensure()) return false;
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      playing = true;
      scheduleTrack();
      return true;
    }

    function pause() {
      playing = false;
      clearTimeout(timer);
      nodes.forEach(function (n) { try { n.stop(); } catch (e) { /* noop */ } });
      nodes = [];
    }

    function toggle() {
      if (playing) { pause(); updateUI(); return true; }
      if (!start()) return false;
      updateUI();
      return true;
    }

    function next() {
      var was = playing;
      if (playing) pause();
      idx = (idx + 1) % TRACKS.length;
      if (was) start();
      updateUI();
    }

    function setVolume(v) {
      vol = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = vol;
    }

    function updateUI() {
      var btn = $('#playBtn'), name = $('#trackName'), wrap = $('#player');
      if (wrap) wrap.classList.toggle('playing', playing);
      if (btn) {
        btn.textContent = playing ? '❚❚' : '▶';
        btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
        btn.setAttribute('aria-label', playing ? '자장가 일시정지' : '자장가 재생');
      }
      if (name) name.textContent = TRACKS[idx].name;
    }

    return {
      toggle: toggle,
      next: next,
      setVolume: setVolume,
      updateUI: updateUI,
      isPlaying: function () { return playing; },
      trackName: function () { return TRACKS[idx].name; },
      trackIndex: function () { return idx; },
      ctxState: function () { return ctx ? ctx.state : 'none'; }
    };
  })();

  function bindPlayer() {
    var play = $('#playBtn'), next = $('#nextTrack'), vol = $('#volRange');
    MusicBox.updateUI();
    if (play) play.addEventListener('click', function () {
      var ok = MusicBox.toggle();
      if (ok === false) toast('이 브라우저에서는 소리를 낼 수 없어요.');
    });
    if (next) next.addEventListener('click', function () { MusicBox.next(); });
    if (vol) vol.addEventListener('input', function () { MusicBox.setVolume(Number(vol.value) / 100); });
  }

  /* ---------------- 시작 ---------------- */
  function init() {
    state = load();
    state.ui.date = todayISO();
    state.ui.author = state.ui.author === 'dad' ? 'dad' : 'mom';

    bindNav();
    bindFamily();
    bindFirstMeet();
    bindBirth();
    bindDiaryForm();
    bindDayBar();
    bindShareButtons();
    bindBackup();
    bindPlayer();
    updateBrand();
    setOnboard();
    renderDay();
    checkShare();

    var configured = !!(state.family.baby && familyStatus().mode !== 'empty');
    showPage(configured ? 4 : 1);

    window.addEventListener('hashchange', checkShare);

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* 오프라인 캐시는 없어도 앱은 동작 */ });
      });
    }
  }

  window.__diaryApp = {
    state: function () { return state; },
    today: todayISO,
    solarBirth: babySolarISO,
    shareUrl: shareUrl,
    music: MusicBox,
    lastCard: null
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
