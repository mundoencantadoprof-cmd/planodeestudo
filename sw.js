/* App do Plano de Estudo (atalho instalável no celular). O site é grande e muda todo dia, então nada fica guardado
   aqui: cada abertura busca a versão publicada. Sem internet, mostra a página offline.html. */
var CACHE = 'pe-app-1';
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['offline.html', 'img/app/icon-192.png']); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(Promise.all([
    caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }),
    self.registration.navigationPreload ? self.registration.navigationPreload.enable() : null
  ]).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(Promise.resolve(e.preloadResponse).then(function (r) { return r || fetch(e.request); })
    .catch(function () { return caches.match('offline.html'); }));
});
