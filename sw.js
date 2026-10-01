/* Service worker: makes the app work with no network after the first visit.
   Only runs on https:// or http://localhost (browser rule). */
var CACHE = "wordboard-v10";   // bump this whenever app files change so devices update
var SHELL = ["./", "styles.css", "store.js", "app.js", "words.js", "stories.js", "manifest.json",
  "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

/* Some file servers (e.g. tailscale serve) redirect /index.html -> /.
   Safari refuses to show a redirected response from a service worker for a page
   load, so every cached/served response is rebuilt as a clean, non-redirected copy. */
function clean(res) {
  if (!res || !res.redirected) return Promise.resolve(res);
  return res.blob().then(function (body) {
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.all(SHELL.map(function (u) {
      return fetch(new Request(u, { cache: "reload" })).then(clean).then(function (res) {
        if (res && res.ok) return cache.put(u, res);
      });
    }));   // personal media lives in IndexedDB, not here
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Cache first (instant + offline), then refresh the cache in the background so
   edits to words.js etc. show up on the next launch. Page loads always use the "./" entry. */
self.addEventListener("fetch", function (event) {
  var req = event.request;
  var url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  var base = new URL("./", self.location).pathname;          // the app's own folder
  var rel = url.pathname.slice(base.length);
  // Only handle the app's own files. Anything else on this server (e.g. /pack/ downloads)
  // goes straight to the network untouched.
  if (url.pathname.indexOf(base) !== 0 || /^pack(\/|$)/.test(rel) || /\.(zip|json)$/i.test(rel) && rel !== "manifest.json") return;
  var isPage = req.mode === "navigate" && (rel === "" || rel === "index.html");
  if (req.mode === "navigate" && !isPage) return;
  var key = isPage ? "./" : req;
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(key, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(isPage ? "./" : req, isPage ? { cache: "no-store" } : undefined).then(clean).then(function (res) {
        if (res && res.ok && res.status === 200) cache.put(key, res.clone());
        return res;
      }).catch(function () { return null; });
      if (hit) { event.waitUntil(net); return clean(hit); }
      return net.then(function (res) {
        if (res) return res;
        return new Response("", { status: 504, statusText: "offline" });
      });
    });
  }));
});
