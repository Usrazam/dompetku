// Service worker Dompetku: supaya bisa dipasang sebagai aplikasi & langsung terbuka.
// Halaman pembuka diambil dari simpanan HP dulu (cepat), versi terbaru dicek di belakang layar untuk dibuka berikutnya.
// Data keuangan tetap diambil langsung dari Google (tidak disimpan di sini).
var CACHE = 'dompetku-v5';
var FILE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon-48.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILE.map(function (f) { return c.add(new Request(f, { cache: 'reload' })).catch(function () {}); })); // satu gagal, yang lain tetap disimpan
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Google tidak disentuh
  var halaman = req.mode === 'navigate', kunci = halaman ? '/' : req;
  // Ambil versi terbaru di belakang layar; kalau GitHub sedang memperbarui (404/500), simpanan lama tetap dipakai
  var segar = fetch(halaman ? new Request('/', { cache: 'no-cache' }) : req, { cache: 'no-cache' }).then(function (r) {
    if (r && r.ok) { var salin = r.clone(); caches.open(CACHE).then(function (c) { c.put(kunci, salin); }); }
    return r;
  });
  e.respondWith(caches.match(kunci).then(function (c) {
    if (c) { e.waitUntil(segar.catch(function () {})); return c; } // ada simpanan: langsung tampil
    return segar.then(function (r) { return r && r.ok ? r : caches.match('/').then(function (x) { return x || r; }); })
      .catch(function () { return caches.match('/'); });
  }));
});
