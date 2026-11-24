/* 우리 아기 육아일기 — 6p 병원·약국 찾기
   카카오 지도 JS SDK(libraries=services)로 주변 소아과·약국·야간응급·어린이집을 찾고,
   지도 핀과 목록을 함께 보여 줍니다. 전화(tel:)와 카카오맵 길찾기 링크로 바로 이어집니다. */
(function () {
  'use strict';

  /* 카카오 Developers > 내 애플리케이션 > JavaScript 키
     등록된 웹 도메인: https://kimgeunho4302-cmd.github.io */
  var APP_KEY = '10068832a5a7641b35eab0a873d745c7';
  var SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + APP_KEY + '&libraries=services&autoload=false';
  var DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780, label: '서울시청', mine: false };

  var CATS = {
    pedia:     { label: '소아과',    keyword: '소아과',   code: 'HP8', radius: 3000, empty: '주변 3km 안에 소아과가 없어요. 동네 이름을 넣어 다시 찾아보세요.' },
    pharmacy:  { label: '약국',      keyword: '약국',     code: 'PM9', radius: 2000, empty: '주변 2km 안에 약국이 없어요. 동네 이름을 넣어 다시 찾아보세요.' },
    emergency: { label: '야간·응급', keyword: '응급실',   code: 'HP8', radius: 8000, empty: '주변에 응급실 정보가 없어요. 동네 이름을 넣어 다시 찾아보세요.' },
    daycare:   { label: '어린이집',  keyword: '어린이집', code: 'PS3', radius: 2000, empty: '주변 2km 안에 어린이집이 없어요. 동네 이름을 넣어 다시 찾아보세요.' }
  };

  var KAKAO_MAP_SEARCH = 'https://map.kakao.com/?q=';

  var el = {};
  var sdkState = 'idle';       /* idle | loading | ready | error */
  var sdkWaiters = [];
  var map = null;
  var places = null;
  var geocoder = null;
  var center = { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, label: DEFAULT_CENTER.label, mine: false };
  var currentCat = 'pedia';
  var results = [];
  var markers = [];
  var popup = null;
  var selected = -1;
  var enteredOnce = false;
  var lastQuery = '';
  var seq = 0;

  function $(id) { return document.getElementById(id); }

  function has(el0) { return !!(el0 && el0.nodeType === 1); }

  /* ---------------- 공통 표시 ---------------- */

  function note(msg) {
    if (has(el.note)) el.note.textContent = msg;
  }

  function setLocText(text) {
    if (has(el.locText)) el.locText.textContent = text;
  }

  function setCount(text) {
    if (has(el.count)) el.count.textContent = text;
  }

  function fmtDist(m) {
    if (typeof m !== 'number' || !isFinite(m)) return '';
    if (m < 1000) return Math.max(10, Math.round(m / 10) * 10) + 'm';
    return (m / 1000).toFixed(m < 10000 ? 1 : 0) + 'km';
  }

  function distanceM(lat1, lng1, lat2, lng2) {
    var R = 6371000;
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function shortCategory(name) {
    if (!name) return '';
    var parts = String(name).split('>');
    return parts[parts.length - 1].trim();
  }

  function placeLink(place) {
    return 'https://map.kakao.com/link/to/' + encodeURIComponent(place.place_name) +
      ',' + place.y + ',' + place.x;
  }

  function telLink(phone) {
    return 'tel:' + String(phone).replace(/[^0-9+]/g, '');
  }

  /* ---------------- 카카오 SDK ---------------- */

  function flush(err) {
    var list = sdkWaiters;
    sdkWaiters = [];
    for (var i = 0; i < list.length; i++) {
      try { list[i](err); } catch (e) { /* 한 콜백 실패가 다른 콜백을 막지 않게 */ }
    }
  }

  function sdkReady() {
    return !!(window.kakao && window.kakao.maps && window.kakao.maps.services);
  }

  function sdkFailed() {
    sdkState = 'error';
    flush(new Error('sdk'));
  }

  function loadSdk(done) {
    if (sdkReady()) { done(null); return; }
    if (sdkState === 'ready') { sdkFailed(); return; }
    if (sdkState === 'error') { done(new Error('sdk')); return; }
    sdkWaiters.push(done);
    if (sdkState === 'loading') return;

    sdkState = 'loading';
    var answered = false;
    var timer = setTimeout(function () {
      if (answered) return;
      answered = true;
      sdkFailed();
    }, 12000);

    var script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = function () {
      if (answered) return;
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.load) {
        answered = true; clearTimeout(timer); sdkFailed(); return;
      }
      window.kakao.maps.load(function () {
        if (answered) return;
        answered = true;
        clearTimeout(timer);
        if (!sdkReady()) { sdkFailed(); return; }
        sdkState = 'ready';
        try {
          places = new window.kakao.maps.services.Places();
          geocoder = new window.kakao.maps.services.Geocoder();
        } catch (e) { sdkFailed(); return; }
        flush(null);
      });
    };
    script.onerror = function () {
      if (answered) return;
      answered = true; clearTimeout(timer); sdkFailed();
    };
    document.head.appendChild(script);
  }

  /* ---------------- 지도 그리기 ---------------- */

  function showFallback() {
    if (has(el.fallback)) el.fallback.hidden = false;
    if (has(el.mapBox)) el.mapBox.classList.add('is-off');
    setCount('지도를 불러오지 못했어요');
    renderEmpty('지도를 불러오지 못해 주변 목록을 가져오지 못했어요. 아래 ‘카카오맵에서 보기’로 확인해 주세요.', true);
    note('오프라인이거나 카카오 지도 설정(도메인 등록·사용 설정)이 꺼져 있으면 지도가 보이지 않아요.');
  }

  function buildMap() {
    if (!has(el.mapBox) || map || !sdkReady()) return;
    map = new window.kakao.maps.Map(el.mapBox, {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 4
    });
    window.kakao.maps.event.addListener(map, 'click', hidePopup);
    if (has(el.fallback)) el.fallback.hidden = true;
    el.mapBox.classList.remove('is-off');
  }

  function clearMarkers() {
    for (var i = 0; i < markers.length; i++) markers[i].setMap(null);
    markers = [];
    hidePopup();
    selected = -1;
  }

  function hidePopup() {
    if (popup && popup.setMap) popup.setMap(null);
    popup = null;
    var open = el.list ? el.list.querySelector('.place.is-open') : null;
    if (open) open.classList.remove('is-open');
    selected = -1;
  }

  function popupContent(place, index) {
    var wrap = document.createElement('div');
    wrap.className = 'map-pop';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'map-pop-close';
    close.setAttribute('aria-label', '설명 닫기');
    close.textContent = '×';
    close.addEventListener('click', function (ev) { ev.stopPropagation(); hidePopup(); });

    var name = document.createElement('p');
    name.className = 'map-pop-name';
    name.textContent = place.place_name;

    var meta = document.createElement('p');
    meta.className = 'map-pop-meta';
    var bits = [shortCategory(place.category_name), fmtDist(place.__dist)];
    meta.textContent = bits.filter(Boolean).join(' · ');

    var call = document.createElement(place.phone ? 'a' : 'span');
    call.className = 'map-pop-btn';
    if (place.phone) {
      call.href = telLink(place.phone);
      call.textContent = '📞 전화';
    } else {
      call.textContent = '전화번호 없음';
      call.classList.add('is-off');
    }

    var go = document.createElement('a');
    go.className = 'map-pop-btn';
    go.href = placeLink(place);
    go.target = '_blank';
    go.rel = 'noopener';
    go.textContent = '🗺️ 길찾기';

    var row = document.createElement('div');
    row.className = 'map-pop-row';
    row.appendChild(call);
    row.appendChild(go);

    wrap.appendChild(close);
    wrap.appendChild(name);
    wrap.appendChild(meta);
    wrap.appendChild(row);
    return wrap;
  }

  function openPopup(index) {
    var place = results[index];
    if (!map || !place) return;
    if (popup) popup.setMap(null);
    popup = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x)),
      content: popupContent(place, index),
      yAnchor: 1.35,
      xAnchor: 0.5,
      zIndex: 6
    });
    popup.setMap(map);
    selected = index;

    var items = el.list ? el.list.querySelectorAll('.place') : [];
    for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-open', i === index);
    if (items[index] && items[index].scrollIntoView) {
      items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function drawMarkers() {
    clearMarkers();
    if (!map) return;

    var bounds = new window.kakao.maps.LatLngBounds();
    for (var i = 0; i < results.length; i++) {
      (function (index) {
        var place = results[index];
        var pos = new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x));
        bounds.extend(pos);

        var node = document.createElement('div');
        node.className = 'map-pin';
        node.setAttribute('role', 'button');
        node.setAttribute('tabindex', '0');
        node.setAttribute('aria-label', place.place_name + ' 위치 보기');
        var label = document.createElement('span');
        label.textContent = String(index + 1);
        node.appendChild(label);
        node.addEventListener('click', function (ev) { ev.stopPropagation(); openPopup(index); });
        node.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openPopup(index); }
        });

        var overlay = new window.kakao.maps.CustomOverlay({
          position: pos,
          content: node,
          yAnchor: 1,
          xAnchor: 0.5,
          zIndex: 3,
          clickable: true
        });
        overlay.setMap(map);
        markers.push(overlay);
      })(i);
    }

    if (!results.length) return;
    if (results.length === 1) {
      map.setCenter(bounds.getNorthEast ? bounds.getNorthEast() : new window.kakao.maps.LatLng(center.lat, center.lng));
      map.setLevel(3);
    } else {
      map.setBounds(bounds);
    }
  }

  /* ---------------- 목록 ---------------- */

  function renderEmpty(text, withLink) {
    if (!has(el.list)) return;
    el.list.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'place-empty';
    var p = document.createElement('p');
    p.textContent = text;
    box.appendChild(p);
    if (withLink) {
      var a = document.createElement('a');
      a.className = 'btn btn-soft btn-sm';
      a.href = KAKAO_MAP_SEARCH + encodeURIComponent(lastQuery || CATS[currentCat].keyword);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = '카카오맵에서 보기';
      box.appendChild(a);
    }
    el.list.appendChild(box);
  }

  function renderList() {
    if (!has(el.list)) return;
    el.list.innerHTML = '';
    if (!results.length) return;

    var ul = document.createElement('ul');
    ul.className = 'place-items';

    for (var i = 0; i < results.length; i++) {
      (function (index) {
        var place = results[index];
        var li = document.createElement('li');
        li.className = 'place';

        var head = document.createElement('button');
        head.type = 'button';
        head.className = 'place-head';
        head.setAttribute('aria-label', place.place_name + ' 지도에서 보기');

        var rank = document.createElement('span');
        rank.className = 'place-rank';
        rank.textContent = String(index + 1);

        var info = document.createElement('span');
        info.className = 'place-info';

        var name = document.createElement('span');
        name.className = 'place-name';
        name.textContent = place.place_name;

        var meta = document.createElement('span');
        meta.className = 'place-meta';
        var bits = [shortCategory(place.category_name)];
        if (place.__dist != null) bits.push(fmtDist(place.__dist));
        meta.textContent = bits.filter(Boolean).join(' · ');

        info.appendChild(name);
        info.appendChild(meta);
        head.appendChild(rank);
        head.appendChild(info);
        head.addEventListener('click', function () {
          if (!map) return;
          map.panTo(new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x)));
          openPopup(index);
        });

        var addr = document.createElement('p');
        addr.className = 'place-addr';
        addr.textContent = place.road_address_name || place.address_name || '주소 정보 없음';

        var actions = document.createElement('div');
        actions.className = 'place-actions';

        if (place.phone) {
          var call = document.createElement('a');
          call.className = 'place-act place-act-call';
          call.href = telLink(place.phone);
          call.textContent = '📞 전화하기';
          actions.appendChild(call);
        } else {
          var noCall = document.createElement('span');
          noCall.className = 'place-act is-off';
          noCall.textContent = '📞 전화번호 없음';
          actions.appendChild(noCall);
        }

        var go = document.createElement('a');
        go.className = 'place-act place-act-go';
        go.href = placeLink(place);
        go.target = '_blank';
        go.rel = 'noopener';
        go.textContent = '🗺️ 길찾기';
        actions.appendChild(go);

        li.appendChild(head);
        li.appendChild(addr);
        li.appendChild(actions);
        ul.appendChild(li);
      })(i);
    }

    el.list.appendChild(ul);
  }

  /* ---------------- 검색 ---------------- */

  function withDistance(data) {
    for (var i = 0; i < data.length; i++) {
      var lat = parseFloat(data[i].y);
      var lng = parseFloat(data[i].x);
      data[i].__dist = isFinite(lat) && isFinite(lng)
        ? distanceM(center.lat, center.lng, lat, lng) : null;
    }
    return data;
  }

  function apply(data, label) {
    results = data;
    drawMarkers();
    renderList();
    if (data.length) {
      setCount((label || '주변 ' + CATS[currentCat].label) + ' ' + data.length + '곳');
    }
  }

  function searchCategory() {
    if (!places) return;
    var cat = CATS[currentCat];
    var mySeq = ++seq;
    lastQuery = cat.keyword;
    setCount('주변 ' + cat.label + '를 찾는 중…');
    if (has(el.list) && !results.length) {
      el.list.innerHTML = '<div class="place-empty is-busy"><p>주변 ' + cat.label + '를 찾고 있어요…</p></div>';
    }

    var options = {
      location: new window.kakao.maps.LatLng(center.lat, center.lng),
      radius: cat.radius,
      sort: window.kakao.maps.services.SortBy.DISTANCE,
      size: 15,
      page: 1,
      category_group_code: cat.code
    };

    places.keywordSearch(cat.keyword, function (data, status) {
      if (mySeq !== seq) return;
      if (status === window.kakao.maps.services.Status.OK) {
        apply(withDistance(data), '');
        return;
      }
      if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        /* 카카오 카테고리 코드로 걸러지지 않는 경우가 있어 코드 없이 한 번 더 */
        places.keywordSearch(cat.keyword, function (data2, status2) {
          if (mySeq !== seq) return;
          if (status2 === window.kakao.maps.services.Status.OK) {
            apply(withDistance(data2), '');
          } else {
            results = [];
            clearMarkers();
            setCount('검색 결과 없음');
            renderEmpty(cat.empty, true);
          }
        }, { size: 15, page: 1 });
        return;
      }
      results = [];
      clearMarkers();
      setCount('검색 결과를 가져오지 못했어요');
      renderEmpty('장소 검색을 사용할 수 없어요. 카카오 지도 설정(사용 설정·도메인)을 확인해 주세요.', true);
    }, options);
  }

  function geocode(query, done) {
    if (!geocoder) { done(null); return; }
    geocoder.addressSearch(query, function (data, status) {
      if (status === window.kakao.maps.services.Status.OK && data && data.length) {
        done({ lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) });
      } else {
        done(null);
      }
    });
  }

  function searchQuery(query) {
    if (!places) return;
    var q = String(query || '').trim();
    if (!q) { searchCategory(); return; }
    var mySeq = ++seq;
    lastQuery = q;
    setCount('‘' + q + '’를 찾는 중…');
    if (has(el.list)) {
      el.list.innerHTML = '<div class="place-empty is-busy"><p>‘' + escapeHtml(q) + '’를 찾고 있어요…</p></div>';
    }

    places.keywordSearch(q, function (data, status) {
      if (mySeq !== seq) return;
      if (status === window.kakao.maps.services.Status.OK && data.length) {
        apply(withDistance(data), '‘' + q + '’ 검색 결과');
        var first = data[0];
        var far = distanceM(center.lat, center.lng, parseFloat(first.y), parseFloat(first.x));
        if (far > 15000 && map) {
          map.panTo(new window.kakao.maps.LatLng(parseFloat(first.y), parseFloat(first.x)));
        }
        return;
      }
      /* 병원명이 아니라 동네 이름일 수 있으니 주소로 바꿔 중심만 옮기고 다시 찾습니다 */
      geocode(q, function (pos) {
        if (mySeq !== seq) return;
        if (pos) {
          center = { lat: pos.lat, lng: pos.lng, label: q, mine: false };
          setLocText('기준 위치 · ' + q);
          if (map) {
            map.setCenter(new window.kakao.maps.LatLng(pos.lat, pos.lng));
            map.setLevel(5);
          }
          searchCategory();
          return;
        }
        results = [];
        clearMarkers();
        setCount('검색 결과 없음');
        renderEmpty('‘' + q + '’에 대한 결과가 없어요. 병원·약국 이름이나 가까운 동네 이름을 넣어 보세요.', true);
      });
    }, { size: 15, page: 1, sort: window.kakao.maps.services.SortBy.ACCURACY });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* ---------------- 내 위치 ---------------- */

  function locate() {
    var button = el.locBtn;
    if (!navigator.geolocation) {
      setLocText('기준 위치 · 서울시청');
      note('이 브라우저에서는 위치를 쓸 수 없어 서울시청을 기준으로 보여 드려요.');
      searchCategory();
      return;
    }
    if (button) { button.disabled = true; button.classList.add('is-busy'); }
    setLocText('현재 위치를 확인하는 중…');

    navigator.geolocation.getCurrentPosition(function (pos) {
      if (button) { button.disabled = false; button.classList.remove('is-busy'); }
      center = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: '내 위치', mine: true };
      setLocText('기준 위치 · 내 위치');
      note('지도 위치는 카카오맵 자료이며, 진료시간·야간 진료 여부는 전화로 확인해 주세요. 응급 상황이면 먼저 119에 연락하세요.');
      if (map) {
        map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
        map.setLevel(4);
      }
      searchCategory();
    }, function (err) {
      if (button) { button.disabled = false; button.classList.remove('is-busy'); }
      center = { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, label: DEFAULT_CENTER.label, mine: false };
      setLocText('기준 위치 · 서울시청');
      note(err && err.code === 1
        ? '위치 권한을 허용하지 않아 서울시청을 기준으로 보여 드려요. 📍 내 위치를 누르면 다시 확인해요.'
        : '위치를 확인하지 못해 서울시청을 기준으로 보여 드려요. 📍 내 위치를 눌러 다시 시도해 보세요.');
      if (map) map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
      searchCategory();
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  }

  /* ---------------- 연결 ---------------- */

  function setCat(cat) {
    if (!CATS[cat]) return;
    currentCat = cat;
    if (el.chips) {
      var btns = el.chips.querySelectorAll('.chip');
      for (var i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute('data-cat') === cat;
        btns[i].classList.toggle('is-on', on);
        btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    if (has(el.input)) el.input.value = '';
    if (has(el.fallbackLink)) {
      el.fallbackLink.href = KAKAO_MAP_SEARCH + encodeURIComponent(CATS[cat].keyword);
    }
    results = [];
    clearMarkers();
    if (has(el.list)) {
      el.list.innerHTML = '<div class="place-empty is-busy"><p>주변 ' + CATS[cat].label + '를 찾고 있어요…</p></div>';
    }
    if (places) searchCategory();
  }

  var bound = false;
  function bind() {
    if (bound) return;
    bound = true;

    el.chips = $('mapChips');
    el.input = $('mapSearchInput');
    el.form = $('mapSearchForm');
    el.locBtn = $('mapLocBtn');
    el.locText = $('mapLocText');
    el.mapBox = $('kakaoMap');
    el.fallback = $('mapFallback');
    el.fallbackLink = $('mapFallbackLink');
    el.count = $('mapCount');
    el.reload = $('mapReloadBtn');
    el.list = $('placeList');
    el.note = document.querySelector('#page-6 .map-note');

    if (el.chips) {
      el.chips.addEventListener('click', function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest('[data-cat]') : null;
        if (!btn) return;
        setCat(btn.getAttribute('data-cat'));
      });
    }

    if (el.form) {
      el.form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        searchQuery(el.input ? el.input.value : '');
      });
    }

    if (el.locBtn) el.locBtn.addEventListener('click', locate);

    if (el.reload) {
      el.reload.addEventListener('click', function () {
        if (has(el.input) && el.input.value.trim()) searchQuery(el.input.value);
        else if (places) searchCategory();
      });
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (map) map.relayout();
      }, 180);
    });
  }

  /* 탭을 처음 열 때: SDK → 지도 → 내 위치(거부되면 서울시청) → 주변 검색 */
  function enter() {
    bind();
    if (!has(el.mapBox)) return;

    loadSdk(function (err) {
      if (err) { showFallback(); return; }
      try {
        buildMap();
      } catch (e) {
        showFallback();
        return;
      }
      if (map) map.relayout();
      if (!enteredOnce) {
        enteredOnce = true;
        locate();
      } else if (!results.length) {
        searchCategory();
      }
    });
  }

  window.BabyMap = {
    enter: enter,
    search: function (q) { bind(); searchQuery(q); },
    category: function (c) { bind(); setCat(c); },
    locate: function () { bind(); locate(); },
    state: function () {
      return {
        sdk: sdkState,
        center: center,
        category: currentCat,
        count: results.length,
        names: results.slice(0, 5).map(function (p) { return p.place_name; })
      };
    }
  };
})();
