#!/usr/bin/env node
/* make-pack.js – turn a pack folder into files you can import on the device.
   usage: node tools/make-pack.js <pack-folder> <out-folder> [name]
   <pack-folder> must contain pack.json; any other files (photos/, recordings/ ...)
   are included and referenced by their relative path, e.g. "recordings/milk.m4a".
   Writes <name>.zip (pack.json + media) and <name>.json (media embedded as base64). */
const fs = require("fs"), path = require("path");
const [, , dir, out, name = "pack"] = process.argv;
if (!dir || !out) { console.error("usage: node tools/make-pack.js <pack-folder> <out-folder> [name]"); process.exit(1); }
const TYPES = { m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac", caf: "audio/x-caf", ogg: "audio/ogg",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
const pack = JSON.parse(fs.readFileSync(path.join(dir, "pack.json"), "utf8"));
if (!pack.config || !Array.isArray(pack.config.pages) || !Array.isArray(pack.config.words)) throw new Error("pack.json needs config.pages and config.words");

// ---- checks: fixed positions must not collide, ids unique, references exist
const pages = Object.fromEntries(pack.config.pages.map(p => [p.id, p])), seen = {}, ids = {}, problems = [];
for (const w of pack.config.words) {
  const p = pages[w.page]; if (!p) { problems.push(`${w.label}: unknown page ${w.page}`); continue; }
  if (w.row < 1 || w.row > p.rows || w.col < 1 || w.col > p.cols) problems.push(`${w.label}: r${w.row}c${w.col} outside ${p.id}`);
  const k = `${w.page}:${w.row},${w.col}`; if (seen[k]) problems.push(`${w.label} collides with ${seen[k]} at ${k}`); seen[k] = w.label;
  if (ids[w.id]) problems.push(`duplicate id ${w.id}`); ids[w.id] = 1;
  if (w.type === "folder" && !pages[w.target]) problems.push(`folder ${w.label} -> missing page ${w.target}`);
}
const files = [];
(function walk(d, rel) {
  for (const f of fs.readdirSync(d)) {
    const full = path.join(d, f), r = rel ? rel + "/" + f : f;
    if (fs.statSync(full).isDirectory()) walk(full, r);
    else if (r !== "pack.json" && !/\.(md|txt)$/i.test(f) && !f.startsWith(".")) files.push({ name: r, data: fs.readFileSync(full) });
  }
})(dir, "");
const have = new Set(files.map(f => f.name)), refs = [];
pack.config.words.forEach(w => { ["audio", "image"].forEach(k => w[k] && refs.push([w.label, w[k]])); });
(pack.stories || []).forEach(s => s.pages.forEach((p, i) => ["image", "pic"].forEach(k => p[k] && !/^(https?:|data:|blob:)/.test(p[k]) && refs.push([`${s.title} p${i + 1}`, p[k]]))));
const missing = refs.filter(([, k]) => !have.has(k) && !/^(https?|data):/.test(k));
if (problems.length) { console.error("PROBLEMS:\n  " + problems.join("\n  ")); process.exit(2); }

// ---- zip (store only; media is already compressed)
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = b => { let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const entries = [{ name: "pack.json", data: Buffer.from(JSON.stringify(pack, null, 2)) }, ...files];
const parts = [], central = []; let off = 0;
for (const e of entries) {
  const n = Buffer.from(e.name), crc = crc32(e.data), h = Buffer.alloc(30), c = Buffer.alloc(46);
  h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt32LE(crc, 14);
  h.writeUInt32LE(e.data.length, 18); h.writeUInt32LE(e.data.length, 22); h.writeUInt16LE(n.length, 26);
  c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt32LE(crc, 16);
  c.writeUInt32LE(e.data.length, 20); c.writeUInt32LE(e.data.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(off, 42);
  parts.push(h, n, e.data); central.push(c, n); off += 30 + n.length + e.data.length;
}
const cd = Buffer.concat(central), eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(off, 16);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, name + ".zip"), Buffer.concat([...parts, cd, eocd]));
const withMedia = Object.assign({}, pack, { media: Object.fromEntries(files.map(f => {
  const t = TYPES[(f.name.split(".").pop() || "").toLowerCase()] || "application/octet-stream";
  return [f.name, `data:${t};base64,${f.data.toString("base64")}`];
})) });
fs.writeFileSync(path.join(out, name + ".json"), JSON.stringify(withMedia));
console.log(`OK: ${pack.config.words.length} words, ${(pack.stories || []).length} stories, ${files.length} media files -> ${out}/${name}.zip / .json`);
if (missing.length) console.log("Note: referenced but not included yet (voice will be used instead):\n  " + missing.map(([l, k]) => `${l}: ${k}`).join("\n  "));
