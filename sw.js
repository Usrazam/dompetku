// Service worker Dompetku: supaya bisa dipasang sebagai aplikasi & tetap terbuka walau GitHub sedang memperbarui.
// Data keuangan tetap diambil langsung dari Google (tidak disimpan di sini).
var CACHE = 'dompetku-v4';
var FILE = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/favicon-48.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILE.map(function (f) { return c.add(f).catch(function () {}); })); // satu gagal, yang lain tetap disimpan
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
  var halaman = req.mode === 'navigate';
  // Selalu cek versi terbaru ke server (tidak memakai simpanan lama browser)
  e.respondWith(fetch(halaman ? new Request('/', { cache: 'no-cache' }) : req, { cache: 'no-cache' }).then(function (r) {
    if (r && r.ok) {
      var salin = r.clone();
      caches.open(CACHE).then(function (c) { c.put(halaman ? '/' : req, salin); });
      return r;
    }
    // Server sedang memperbarui (404/500): pakai versi terakhir yang berhasil
    return caches.match(halaman ? '/' : req).then(function (c) { return c || r; });
  }).catch(function () {
    return caches.match(halaman ? '/' : req).then(function (c) { return c || caches.match('/'); });
  }));
});
