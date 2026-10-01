#!/usr/bin/env node
/* build-single.js – bundle the app shell into ONE self-contained HTML file: dist/aac.html
   usage: node tools/build-single.js
   Contains only the generic shell (no personal pack). Import a pack inside the app. */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const js = f => { const s = read(f); if (/<\/script/i.test(s)) throw new Error(f + " contains </script"); return s; };
let html = read("index.html");
const icon = "data:image/png;base64," + fs.readFileSync(path.join(root, "icons/icon-180.png")).toString("base64");
html = html.replace(/<link rel="manifest"[^>]*>\n?/, "")
  .replace(/<link rel="apple-touch-icon" href="[^"]*">/, `<link rel="apple-touch-icon" href="${icon}">`)
  .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/png" href="${icon}">`)
  .replace(/<link rel="stylesheet" href="styles.css">/, () => `<style>\n${read("styles.css")}\n</style>`);
for (const f of ["store.js", "words.js", "stories.js", "app.js"]) {
  const tag = `<script src="${f}"></script>`;
  if (!html.includes(tag)) throw new Error("missing " + tag);
  html = html.replace(tag, () => (f === "store.js" ? "<script>window.AAC_SINGLE_FILE = true;</script>\n" : "") + `<script>\n${js(f)}\n</script>`);
}
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/aac.html"), html);
console.log("wrote dist/aac.html", (html.length / 1024).toFixed(1) + " KB");
