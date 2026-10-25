// Service worker sederhana: menyimpan layar pembuka supaya cepat tampil & bisa dipasang sebagai aplikasi.
// Data keuangan tetap diambil langsung dari Google (tidak disimpan di sini).
var CACHE = 'dompetku-v1';
var FILE = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon-48.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // Google tidak disentuh
  e.respondWith(fetch(e.request).then(function (r) {
    var salin = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, salin); }); return r;
  }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('/'); }); }));
});
