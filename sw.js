/* 우리 아기 육아일기 — 오프라인 캐시 서비스워커 */
const CACHE = 'baby-diary-toss-v8';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=7',
  './manifest.json?v=7',
  './js/lunar.js?v=7',
  './js/data.js?v=7',
  './js/flowers.js?v=7',
  './js/app.js?v=7',
  './js/theme.js?v=7',
  './js/map.js?v=7',
  './js/story-vocab.js?v=7',
  './js/world-vocab.js?v=7',
  './js/story-world.js?v=7',
  './js/classics-vocab.js?v=7',
  './js/story-classics.js?v=7',
  './js/supabase-config.js?v=7',
  './js/story.js?v=7',
  './icons/icon-192.png',
  './icons/apple-touch-icon.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* 카카오 지도(dapi.kakao.com)·타일(daumcdn.net)·CDN·영어 사전 요청은 서비스워커가 가로채지 않습니다 */
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) {
        fetch(req).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((cache) => cache.put(req, res.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
