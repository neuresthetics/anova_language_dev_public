/* store.js – on-device storage (IndexedDB) + tiny ZIP reader/writer.
   Personal content (pack, photos, recordings) lives ONLY here, on the device. */
(function (root) {
  "use strict";
  var DB_NAME = "wordboard", DB_VER = 1, dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!root.indexedDB) return rej(new Error("IndexedDB not available"));
      var r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv");
        if (!d.objectStoreNames.contains("media")) d.createObjectStore("media");
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.onblocked = function () { rej(new Error("database blocked")); };
    });
    dbp.catch(function () { dbp = null; });
    return dbp;
  }
  function run(store, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(store, mode), s = t.objectStore(store), out;
        var rq = fn(s);
        if (rq) rq.onsuccess = function () { out = rq.result; };
        t.oncomplete = function () { res(out); };
        t.onerror = function () { rej(t.error); };
        t.onabort = function () { rej(t.error || new Error("aborted")); };
      });
    });
  }
  var Store = {
    get: function (store, k) { return run(store, "readonly", function (s) { return s.get(k); }); },
    put: function (store, k, v) { return run(store, "readwrite", function (s) { return s.put(v, k); }); },
    del: function (store, k) { return run(store, "readwrite", function (s) { return s.delete(k); }); },
    clear: function (store) { return run(store, "readwrite", function (s) { return s.clear(); }); },
    keys: function (store) { return run(store, "readonly", function (s) { return s.getAllKeys(); }); },
    /* media values are {type, data: ArrayBuffer} (ArrayBuffer, not Blob: safest on older iOS) */
    all: function (store) {
      return open().then(function (db) {
        return new Promise(function (res, rej) {
          var out = {}, t = db.transaction(store, "readonly"), c = t.objectStore(store).openCursor();
          c.onsuccess = function () { var cur = c.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } };
          t.oncomplete = function () { res(out); };
          t.onerror = function () { rej(t.error); };
        });
      });
    },
    persist: function () {
      try { if (navigator.storage && navigator.storage.persist) return navigator.storage.persist(); } catch (e) {}
      return Promise.resolve(false);
    }
  };

  /* ---------------- ZIP (store-only writer; reader handles stored + deflate) ---------------- */
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s) { return new TextEncoder().encode(s); }
  /* files: [{name, data: Uint8Array}] -> Blob */
  function writeZip(files) {
    var parts = [], central = [], offset = 0, d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = utf8(f.name), data = f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(h.buffer, name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
      c.setUint32(42, offset, true);
      central.push(c.buffer, name);
      offset += 30 + name.length + data.length;
    });
    var csize = central.reduce(function (n, p) { return n + (p.byteLength || p.length); }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, csize, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [e.buffer]), { type: "application/zip" });
  }
  function inflateRaw(u8) {
    if (typeof DecompressionStream === "undefined") return Promise.reject(new Error("This browser can't unzip compressed files. Use the .json pack instead."));
    var ds = new DecompressionStream("deflate-raw");
    var stream = new Blob([u8]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }
  /* ArrayBuffer -> Promise<[{name, data: Uint8Array}]> */
  function readZip(ab) {
    var u8 = new Uint8Array(ab), dv = new DataView(ab), eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) return Promise.reject(new Error("Not a zip file."));
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), jobs = [];
    var dec = new TextDecoder();
    for (var k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) return Promise.reject(new Error("Broken zip directory."));
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      var nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      var lho = dv.getUint32(p + 42, true), name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      p += 46 + nlen + xlen + clen;
      if (/\/$/.test(name) || /(^|\/)(__MACOSX|\.DS_Store)/.test(name)) continue;
      var start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
      var raw = u8.subarray(start, start + csize);
      (function (name, method, raw) {
        if (method === 0) jobs.push(Promise.resolve({ name: name, data: raw.slice() }));
        else if (method === 8) jobs.push(inflateRaw(raw).then(function (d) { return { name: name, data: d }; }));
        else jobs.push(Promise.reject(new Error("Unsupported zip compression in " + name)));
      })(name, method, raw);
    }
    return Promise.all(jobs);
  }
  var TYPES = { m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac", ogg: "audio/ogg", caf: "audio/x-caf",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", heic: "image/heic" };
  function typeOf(name) { var m = /\.([a-z0-9]+)$/i.exec(name); return (m && TYPES[m[1].toLowerCase()]) || "application/octet-stream"; }

  root.WBStore = Store;
  root.WBZip = { write: writeZip, read: readZip, crc32: crc32, typeOf: typeOf };
})(typeof self !== "undefined" ? self : globalThis);
