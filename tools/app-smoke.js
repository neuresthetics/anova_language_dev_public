#!/usr/bin/env node
/* Browser smoke for 1.5.4 + the 1.5.6 bug-check regressions + 1.6 button looks: word endings, leaving Paths, replaying a finished path,
   ABC letter names, hold-to-clear. Based on paths-smoke.js. Uses system Chrome via puppeteer-core.
   Does not hardcode the old pattern titles; it opens cards by id and
   checks the chrome buttons by their aria-labels.
   Usage: node tools/app-smoke.js [port]
*/
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.join(__dirname, "..");
const port = Number(process.argv[2]) || 8767;
let puppeteer;
try { puppeteer = require("puppeteer-core"); }
catch (e) {
  try { puppeteer = require("/tmp/puppeteer-core-test/node_modules/puppeteer-core"); }
  catch (e2) {
    console.error("puppeteer-core is not installed. Install it with:");
    console.error('  npm install --prefix /tmp/puppeteer-core-test puppeteer-core');
    process.exit(1);
  }
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
function startServer() {
  return new Promise(function (resolve) {
    const server = http.createServer(function (req, res) {
      const url = new URL(req.url, "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/") rel = "/index.html";
      const file = path.join(root, rel);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, function (err, buf) {
        if (err) { res.writeHead(404); res.end("missing"); return; }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
        res.end(buf);
      });
    });
    server.listen(port, "127.0.0.1", function () { resolve(server); });
  });
}

async function tapChoice(page, label) {
  const found = await page.evaluate(function (lab) {
    const nodes = document.querySelectorAll("[data-choice]");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute("data-choice") === lab) { nodes[i].setAttribute("data-smoke", "pick"); return true; }
    }
    return false;
  }, label);
  if (!found) throw new Error("no choice " + label);
  await new Promise(function (r) { setTimeout(r, 260); });   // past the double-tap hold
  await tap(page, "[data-smoke=pick]");
}
async function tap(page, selector) {
  await page.waitForSelector(selector, { timeout: 8000 });
  const result = await page.$eval(selector, function (node) {
    if (node.disabled || node.classList.contains("is-hidden")) return "blocked";
    const r = node.getBoundingClientRect();
    const x = r.left + Math.min(r.width / 2, 40);
    const y = r.top + r.height / 2;
    const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: "touch", button: 0, isPrimary: true };
    node.dispatchEvent(new PointerEvent("pointerdown", opts));
    node.dispatchEvent(new PointerEvent("pointerup", opts));
    return "ok";
  });
  if (result !== "ok") throw new Error("could not tap " + selector + " (" + result + ")");
  await new Promise(function (r) { setTimeout(r, 40); });
}

async function main() {
  const server = await startServer();
  const chrome = process.env.CHROME_PATH || "/usr/local/bin/google-chrome";
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  const fails = [];
  function check(cond, msg) { if (!cond) { fails.push(msg); console.error("FAIL:", msg); } else console.log("ok:", msg); }
  const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    await page.setViewport({ width: 1180, height: 820 });
    page.on("pageerror", function (e) { fails.push("page error " + e.message); console.error("FAIL: page error", e.message); });
    await page.evaluateOnNewDocument(function () {
      window.__spoken = [];
      function Utterance(text) { this.text = text || ""; }
      window.SpeechSynthesisUtterance = Utterance;
      var fake = { speaking: false, pending: false, paused: false,
        getVoices: function () { return [{ name: "Test", lang: "en-US", localService: true, default: true, voiceURI: "test" }]; },
        addEventListener: function () {}, cancel: function () { this.speaking = false; window.__cancels = (window.__cancels || 0) + 1; }, resume: function () {},
        speak: function (u) { window.__spoken.push(String(u && u.text || "")); this.speaking = true; var self = this;
          setTimeout(function () { self.speaking = false; if (u && u.onend) try { u.onend(); } catch (e) {} }, window.__slow ? 1500 : 0); } };
      try { Object.defineProperty(window, "speechSynthesis", { configurable: true, get: function () { return fake; } }); } catch (e) { window.speechSynthesis = fake; }
    });
    await page.goto("http://127.0.0.1:" + port + "/", { waitUntil: "domcontentloaded" });
    // an older saved setup: sayLetters was saved off by the 1.5.3 default
    await page.evaluate(function () {
      localStorage.setItem("wb.settings", JSON.stringify({ wordsShown: "full", pathsSet: "auto", tapGuardMs: 0, sayLetters: false, clearMode: "hold", levelsVersion: 2 }));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(function () { return window.WB && document.getElementById("nav-paths"); });
    const msgText = function () { return page.evaluate(function () { return document.getElementById("msg").innerText.replace(/\s+/g, " ").trim(); }); };
    const lastSaid = function () { return page.evaluate(function () { return window.__spoken[window.__spoken.length - 1] || ""; }); };

    /* ---- endings only fit words that can take them ---- */
    await tap(page, "#nav-home");
    await tap(page, '#board [aria-label="again"]');
    const offAgain = await page.evaluate(function () {
      return [].map.call(document.querySelectorAll("#board .cell.ending"), function (b) { return b.getAttribute("data-ending") + ":" + b.classList.contains("ending-off"); });
    });
    check(offAgain.length >= 3 && offAgain.every(function (x) { return /:true$/.test(x); }), "after 'again' every ending is dimmed (" + offAgain + ")");
    await tap(page, '#board [data-ending="ing"]');
    check(/^again$/i.test(await msgText()), "-ing on 'again' does nothing (" + await msgText() + ")");
    await tap(page, '#board [data-ending="s"]');
    check(/^again$/i.test(await msgText()), "-s on 'again' does nothing");
    await tap(page, '#board [aria-label="go"]');
    const goState = await page.evaluate(function () {
      const o = {}; [].forEach.call(document.querySelectorAll("#board .cell.ending"), function (b) { o[b.getAttribute("data-ending")] = !b.classList.contains("ending-off"); }); return o;
    });
    check(goState.ing && goState.ed && goState.s && !goState.poss, "after 'go': -s -ing -ed on, 's off (" + JSON.stringify(goState) + ")");
    await tap(page, '#board [data-ending="ing"]');
    check(/again going$/i.test(await msgText()), "go + -ing = going (" + await msgText() + ")");
    const offAfter = await page.evaluate(function () { return document.querySelector('#board [data-ending="ing"]').classList.contains("ending-off"); });
    check(offAfter, "no second ending on 'going'");
    await tap(page, "#btn-del");
    check(/again go$/i.test(await msgText()), "delete takes the ending off first");
    await tap(page, '#board [data-ending="ed"]');
    check(/again went$/i.test(await msgText()), "go + -ed = went (" + await msgText() + ")");

    /* ---- hold-to-clear: a quick tap does nothing, a hold clears, undo brings it back ---- */
    await tap(page, "#btn-clear");
    check((await msgText()).length > 0, "a quick tap on clear does not clear (hold mode)");
    const holdClear = async function () {
      await page.evaluate(function () {
        const b = document.getElementById("btn-clear"), r = b.getBoundingClientRect();
        window.__o = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 9, pointerType: "touch", button: 0, isPrimary: true };
        b.dispatchEvent(new PointerEvent("pointerdown", window.__o));
      });
      await wait(300);
      const mid = await page.evaluate(function () { const b = document.getElementById("btn-clear"); return { cls: b.className, fill: getComputedStyle(b, "::after").backgroundColor, bg: getComputedStyle(b).backgroundColor }; });
      await wait(700);
      await page.evaluate(function () { document.getElementById("btn-clear").dispatchEvent(new PointerEvent("pointerup", window.__o)); });
      await wait(60);
      return mid;
    };
    const mid = await holdClear();
    check(/hold-mode/.test(mid.cls) && /pressed/.test(mid.cls), "hold shows the fill (" + mid.cls + ")");
    check(mid.bg === "rgb(45, 45, 45)" && mid.fill !== mid.bg, "button keeps its colour, fill contrasts (" + mid.bg + " / " + mid.fill + ")");
    check((await msgText()) === "", "hold clears the Words bar");
    await wait(450);
    await tap(page, "#btn-clear");
    check(/again went$/i.test(await msgText()), "undo clear brings it back");
    await wait(450);
    await holdClear();
    check((await msgText()) === "", "clear again");

    /* ---- ABC: each letter is said by name (and the old saved "off" was migrated on) ---- */
    await tap(page, "#nav-kbd");
    const letters = [];
    for (const L of ["A", "B", "W", "Z"]) {
      await tap(page, '#board [aria-label="' + L + '"], #board [data-key="' + L + '"]').catch(async function () {
        await page.evaluate(function (l) { const b = [].find.call(document.querySelectorAll("#board .key"), function (x) { return x.textContent.trim().toUpperCase() === l; }); b.setAttribute("data-smoke-key", l); }, L);
        await tap(page, '[data-smoke-key="' + L + '"]');
      });
      letters.push(await lastSaid());
    }
    check(letters.join("|") === "A.|bee|double you|zee", "letters said by name (" + letters.join("|") + ")");
    check(await page.evaluate(function () { return window.WB.settings.sayLetters === true; }), "say-letters is on after the 1.5.4 upgrade");
    const typed = await msgText();
    check(/abwz/i.test(typed), "letters still type (" + typed + ")");
    await holdClear();

    /* ---- leaving Paths resets it; Words lands on Home ---- */
    await tap(page, "#nav-home");
    await page.evaluate(function () { window.WB.state.page = "food"; });
    await tap(page, "#nav-paths");
    await tap(page, '[data-pattern="want"]');
    await tapChoice(page, "I");
    check(await page.evaluate(function () { return window.WB.paths().pathId === "want"; }), "a path is in progress");
    await tap(page, "#nav-home");
    const back = await page.evaluate(function () { return { view: window.WB.state.view, page: window.WB.state.page, id: window.WB.state.pathId, picks: window.WB.state.pathPicks.length }; });
    check(back.view === "words" && back.page === "home" && back.id === null && back.picks === 0, "leaving to Words drops the path and lands on Home (" + JSON.stringify(back) + ")");
    await tap(page, "#nav-paths");
    check(!!(await page.$(".path-card")) && !(await page.$(".path-slot")), "Paths opens at its menu again");
    await tap(page, '[data-pattern="want"]');
    await tapChoice(page, "I");
    await tap(page, "#nav-kbd");
    await tap(page, "#nav-paths");
    check(!!(await page.$(".path-card")), "leaving to ABC resets Paths too");
    await tap(page, '[data-pattern="want"]');
    await tapChoice(page, "I");
    await page.evaluate(function () {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: function () { return "hidden"; } });
      document.dispatchEvent(new Event("visibilitychange"));
      Object.defineProperty(document, "visibilityState", { configurable: true, get: function () { return "visible"; } });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    check(!!(await page.$(".path-card")) && await page.evaluate(function () { return window.WB.state.pathId === null; }), "going to the background resets Paths to its menu");

    /* ---- finished view: the big words say the whole sentence again ---- */
    await tap(page, '[data-pattern="want"]');
    await tapChoice(page, "I");
    await tapChoice(page, "want");
    const fringe = await page.evaluate(function () { return window.WB.paths().choices[0]; });
    await tapChoice(page, fringe);
    await wait(300);
    const sentence = await page.evaluate(function () { return document.querySelector(".path-sentence").textContent; });
    const n0 = await page.evaluate(function () { window.__cancels = 0; return window.__spoken.length; });
    const reps = await page.evaluate(function () { return document.querySelectorAll(".path-done .path-replay").length + "/" + document.querySelectorAll(".path-phrase .path-replay").length; });
    check(/^3\/3$/.test(reps), "every big word and slot can be tapped (" + reps + ")");
    await tap(page, ".path-done .path-replay");
    const said1 = await page.evaluate(function (n) { return window.__spoken.slice(n).join(" "); }, n0);
    check(said1.replace(/\s+/g, " ").toLowerCase().indexOf(sentence.toLowerCase().replace(/^i /, "")) >= 0 || said1.toLowerCase().replace(/eye/g, "i") === sentence.toLowerCase(), "tapping a big word says the sentence (" + said1 + " / " + sentence + ")");
    await wait(450);
    await page.evaluate(function () { window.__slow = true; window.__cancels = 0; });
    await tap(page, ".path-phrase .path-replay");
    await wait(80);
    const ring = await page.evaluate(function () { return document.body.classList.contains("speaking") && !!document.querySelector(".speak"); });
    check(ring, "speaking ring shows while the sentence is said");
    await wait(450);
    await tap(page, ".path-done .path-replay");
    check(await page.evaluate(function () { return window.__cancels > 0; }), "a new tap cancels and restarts (no stacking)");
    await page.evaluate(function () { window.__slow = false; });
    await wait(1600);
    check(!!(await page.$(".path-finish .say")) && !!(await page.$(".path-finish .path-again")) && !!(await page.$(".path-finish .to-words")), "say again / another / → Words are still there");
    // Paths → Words, then clear still works
    await tap(page, ".path-finish .to-words");
    check((await msgText()).length > 0, "sentence went to Words");
    await wait(450);
    await holdClear();
    check((await msgText()) === "", "hold-clear works after Paths → Words");
    // a new word right after a clear: clear must clear it, not bring the old message back
    await tap(page, "#board [aria-label=\"go\"]");
    check(await page.evaluate(function () { return !document.getElementById("btn-clear").classList.contains("undo"); }), "a new word ends the undo-clear window");
    await wait(450);
    await holdClear();
    check((await msgText()) === "", "clear after a new word clears it (no old message back)");
    await wait(450);
    // tap mode (a parent setting): one tap clears
    await page.evaluate(function () { window.WB.settings.clearMode = "tap"; });
    await tap(page, "#board [aria-label=\"go\"]");
    await wait(450);
    await tap(page, "#btn-clear");
    check((await msgText()) === "", "tap mode: one tap clears");
    await page.close();
    await regress156(browser, check, wait);
    await regress160(browser, check, wait);
  } finally {
    await browser.close();
    server.close();
  }
  if (fails.length) { console.error(fails.length + " smoke checks failed"); process.exit(1); }
  console.log("app-smoke ok");
}

/* ==== 1.5.6 regressions (bug check 2026-11-08, items 1-12 + small fixes) ==== */
async function regress156(browser, check, wait) {
  const pages = [];
  async function fresh(saved, o) {
    o = o || {};
    const p = await browser.newPage(); pages.push(p);
    p.setDefaultTimeout(15000);
    await p.setViewport({ width: o.w || 1180, height: o.h || 820, hasTouch: true, isMobile: false });
    p.on("pageerror", function (e) { check(false, "page error " + e.message); });
    await p.evaluateOnNewDocument(function (o) {
      window.__spoken = [];
      if (o.lang) {
        Object.defineProperty(navigator, "language", { configurable: true, get: function () { return o.lang; } });
        Object.defineProperty(navigator, "languages", { configurable: true, get: function () { return [o.lang]; } });
      }
      function Utterance(text) { this.text = text || ""; }
      window.SpeechSynthesisUtterance = Utterance;
      var voices = o.voices || [{ name: "Test", lang: "en-US", localService: true, default: true, voiceURI: "test" }];
      var fake = { speaking: false, pending: false, paused: false,
        getVoices: function () { return voices; },
        addEventListener: function () {}, cancel: function () { this.speaking = false; }, resume: function () {},
        speak: function (u) { window.__spoken.push(String(u && u.text || "")); window.__lastVoice = u.voice ? u.voice.voiceURI : ""; this.speaking = true; var self = this;
          if (o.neverEnd) return;   // an engine that never reports the end
          setTimeout(function () { self.speaking = false; if (u && u.onend) try { u.onend(); } catch (e) {} }, 0); } };
      try { Object.defineProperty(window, "speechSynthesis", { configurable: true, get: function () { return fake; } }); } catch (e) { window.speechSynthesis = fake; }
    }, o);
    await p.goto("http://127.0.0.1:" + port + "/", { waitUntil: "domcontentloaded" });
    await p.evaluate(function (s, c) {
      localStorage.clear();
      localStorage.setItem("wb.settings", JSON.stringify(Object.assign({ levelsVersion: 2, sayLetters: true, clearMode: "hold" }, s)));
      if (c) localStorage.setItem("wb.custom", JSON.stringify(c));
    }, saved, o.custom || null);
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForFunction(function () { return window.WB && document.getElementById("nav-paths") && document.querySelector("#board .cell"); });
    await wait(300);
    return p;
  }
  const msgOf = function (p) { return p.evaluate(function () { return document.getElementById("msg").innerText.replace(/\s+/g, " ").trim(); }); };
  const mark = function (p, fnSrc, tag) { return p.evaluate(new Function("tag", "var n = (" + fnSrc + ")(); if (!n) return false; n.setAttribute('data-r', tag); return true;"), tag); };
  async function hold(p, sel, ms) {
    await p.evaluate(function (sel) {
      const b = document.querySelector(sel), r = b.getBoundingClientRect();
      window.__ho = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 7, pointerType: "touch", button: 0, isPrimary: true };
      window.__hb = b; b.dispatchEvent(new PointerEvent("pointerdown", window.__ho));
    }, sel);
    await wait(ms);
    await p.evaluate(function () { window.__hb.dispatchEvent(new PointerEvent("pointerup", window.__ho)); });
    await wait(60);
  }
  function contrast(a, b) {
    function L(c) { const m = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; }
    const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  try {
    /* 1. a quick tap right after a folder opens is ignored; a normal tap a moment later works */
    let p = await fresh({ wordsShown: "full" });
    check(await mark(p, "function(){ return document.querySelector('#board .cell.t-folder'); }", "folder"), "home has a folder");
    await tap(p, "[data-r=folder]");
    await wait(30);
    await mark(p, "function(){ return [].find.call(document.querySelectorAll('#board .cell.btn'), function(b){ return !b.classList.contains('t-folder') && !b.classList.contains('ending'); }); }", "w1");
    await tap(p, "[data-r=w1]");
    check((await msgOf(p)) === "", "1: a tap 0.1 s after a folder opens is ignored (" + await msgOf(p) + ")");
    await wait(300);
    await tap(p, "[data-r=w1]");
    check((await msgOf(p)).length > 0, "1: the same word works 0.3 s later");
    await p.close();

    /* 2. larger text makes the bar and the word labels BIGGER */
    const sizes = {};
    for (const ts of ["normal", "large", "larger"]) {
      p = await fresh({ wordsShown: "full", textSize: ts });
      await tap(p, '#board [aria-label="go"]');
      sizes[ts] = await p.evaluate(function () {
        const l = [].map.call(document.querySelectorAll("#board .cell.btn:not(.t-folder) .lbl"), function (x) { return parseFloat(getComputedStyle(x).fontSize); });
        const over = [].filter.call(document.querySelectorAll("#board .cell.btn .lbl"), function (x) { const r = x.getBoundingClientRect(), b = x.closest(".cell").getBoundingClientRect(); return r.bottom > b.bottom + 1 || r.top < b.top - 1; }).length;
        return { msg: parseFloat(getComputedStyle(document.getElementById("msg")).fontSize), lbl: l.reduce(function (a, b) { return a + b; }, 0) / l.length, over: over };
      });
      await p.close();
    }
    check(sizes.large.msg > sizes.normal.msg && sizes.larger.msg > sizes.large.msg, "2: bar text grows normal<large<larger (" + [sizes.normal.msg, sizes.large.msg, sizes.larger.msg] + ")");
    check(sizes.large.lbl > sizes.normal.lbl * 1.05 && sizes.larger.lbl > sizes.large.lbl, "2: word labels grow (" + [sizes.normal.lbl, sizes.large.lbl, sizes.larger.lbl].map(Math.round) + ")");
    check(sizes.larger.over === 0, "2: no label spills out of its button at larger (" + sizes.larger.over + ")");

    /* 3. light board + high contrast: text stays readable */
    p = await fresh({ wordsShown: "full", boardColor: "light", contrast: "high" });
    await mark(p, "function(){ return document.querySelector('#board .cell.t-folder'); }", "folder");
    await tap(p, "[data-r=folder]");
    await wait(300);
    const titleC = await p.evaluate(function () { return [getComputedStyle(document.getElementById("page-title")).color, getComputedStyle(document.body).backgroundColor]; });
    check(contrast(titleC[0], titleC[1]) >= 4.5, "3: page title readable on light + high contrast (" + titleC.join(" on ") + ")");
    await tap(p, "#nav-paths");
    await tap(p, '[data-pattern="want"]');
    const emptyC = await p.evaluate(function () { const s = document.querySelector(".path-slot.empty"); return s ? [getComputedStyle(s).color, getComputedStyle(document.body).backgroundColor, getComputedStyle(s).backgroundColor] : null; });
    check(emptyC && (contrast(emptyC[0], emptyC[2].indexOf("0, 0, 0, 0") >= 0 || /rgba\(.*, 0\)/.test(emptyC[2]) ? emptyC[1] : emptyC[2]) >= 3), "3: empty Paths slot readable on light + high contrast (" + emptyC + ")");
    await p.close();

    /* 4. ABC: double letters typed quickly both count */
    p = await fresh({ wordsShown: "full", tapGuardMs: 400 });
    await tap(p, "#nav-kbd");
    await tap(p, '#board [aria-label="L"]');
    await wait(110);
    await tap(p, '#board [aria-label="L"]');
    await wait(110);
    await tap(p, '#board [aria-label="O"]');
    check(/^llo$/i.test(await msgOf(p)), "4: L L O typed 0.15 s apart = 'llo' (" + await msgOf(p) + ")");
    await p.close();

    /* 5. a long message: the first line can be reached, the newest word is in view */
    p = await fresh({ wordsShown: "full", tapGuardMs: 0 }, { w: 1180, h: 820 });
    for (let i = 0; i < 40; i++) { await tap(p, '#board [aria-label="go"]'); }
    const ms = await p.evaluate(function () { const m = document.getElementById("msg"); const r = { over: m.classList.contains("overflow"), atEnd: Math.abs(m.scrollTop + m.clientHeight - m.scrollHeight) <= 2 }; m.scrollTop = 0; const first = m.querySelector(".tok").getBoundingClientRect(), box = m.getBoundingClientRect(); r.firstVisible = first.top >= box.top - 1; return r; });
    check(ms.over && ms.atEnd, "5: long message scrolls to the newest word (" + JSON.stringify(ms) + ")");
    check(ms.firstVisible, "5: the first line can be scrolled back into view");
    await p.close();

    /* 6. Paths menu is readable at Full in landscape */
    p = await fresh({ wordsShown: "full", pathsSet: "all" });
    await tap(p, "#nav-paths");
    const pm = await p.evaluate(function () { const l = document.querySelector(".path-menu"); const t = [].map.call(l.querySelectorAll(".path-title"), function (x) { return parseFloat(getComputedStyle(x).fontSize); }); return { n: l.children.length, cols: getComputedStyle(l).gridTemplateColumns.split(" ").length, minTitle: Math.min.apply(null, t) }; });
    check(pm.n < 9 || pm.cols >= 4, "6: landscape Paths menu uses 4+ columns (" + JSON.stringify(pm) + ")");
    check(pm.minTitle >= 15, "6: Paths titles >= 15px in landscape (" + pm.minTitle + ")");
    await p.close();

    /* 7. picture only makes the pictures bigger */
    const emo = {};
    for (const sm of ["both", "pic"]) {
      p = await fresh({ wordsShown: "full", showMode: sm });
      emo[sm] = await p.evaluate(function () { const e = document.querySelector('#board [aria-label="go"] .emo'); return e ? e.getBoundingClientRect().height : 0; });
      await p.close();
    }
    check(emo.pic > emo.both * 1.4, "7: picture-only pictures are bigger (" + Math.round(emo.both) + " -> " + Math.round(emo.pic) + ")");

    /* 8. Paths → Words adds to the bar (with a full stop between) and can be undone */
    p = await fresh({ wordsShown: "full", tapGuardMs: 0 });
    await tap(p, '#board [aria-label="go"]');
    await tap(p, "#nav-paths");
    await tap(p, '[data-pattern="want"]');
    for (let s = 0; s < 4; s++) {
      const st = await p.evaluate(function () { return window.WB.paths(); });
      if (st.requiredDone || !st.choices.length) break;
      await p.evaluate(function (l) { const n = [].find.call(document.querySelectorAll("[data-choice]"), function (x) { return x.getAttribute("data-choice") === l; }); n.setAttribute("data-r", "c"); }, st.choices[0]);
      await wait(260); await tap(p, "[data-r=c]"); await wait(50);
    }
    await wait(300);
    await tap(p, ".path-finish .to-words");
    const added = await msgOf(p);
    check(/^go\. I want /i.test(added), "8: Paths → Words adds after 'go.' (" + added + ")");
    check(await p.evaluate(function () { return document.querySelector("#btn-clear .txt").textContent; }) === "undo add", "8: clear offers 'undo add'");
    await wait(450);
    await tap(p, "#btn-clear");
    check(/^go$/i.test(await msgOf(p)), "8: undo add brings back just 'go' (" + await msgOf(p) + ")");
    await p.close();

    /* 9. hiding a word on Starter (big buttons) keeps big buttons */
    p = await fresh({ wordsShown: "custom", bigButtons: true }, { custom: { base: 1, shown: { zzz: false } } });
    const big9 = await p.evaluate(function () { return window.WB.levels().mode + ":" + /fr/.test(document.querySelector("#board .grid, #board > div").style.gridTemplateRows) + ":" + document.querySelector("#board > div").style.gridTemplateRows; });
    p.close();
    p = await fresh({ wordsShown: "starter", bigButtons: true });
    const bigS = await p.evaluate(function () { return document.querySelector("#board > div").style.gridTemplateRows; });
    check(/^custom/.test(big9) && big9.split(":").slice(2).join(":") === bigS, "9: custom-from-Starter keeps the big-button layout (" + big9 + " vs " + bigS + ")");

    /* 10. Starter landscape folder row is readable */
    const fr = await p.evaluate(function () { const f = [].filter.call(document.querySelectorAll("#board .cell.t-folder"), function (b) { return true; }); return f.map(function (b) { return [Math.round(b.getBoundingClientRect().height), parseFloat(getComputedStyle(b.querySelector(".lbl")).fontSize)]; }); });
    check(fr.length > 0 && fr.every(function (x) { return x[0] >= 55 && x[1] >= 14; }), "10: Starter big folders >= 55px tall, labels >= 14px (" + JSON.stringify(fr) + ")");
    await p.close();

    /* 11. a hold during the undo window clears (never undoes); undo looks different */
    p = await fresh({ wordsShown: "full", tapGuardMs: 0 });
    await tap(p, '#board [aria-label="go"]');
    await hold(p, "#btn-clear", 1000);
    check((await msgOf(p)) === "", "11: hold clears");
    const look = await p.evaluate(function () { const b = document.getElementById("btn-clear"), cs = getComputedStyle(b); return { undo: b.classList.contains("undo"), border: cs.borderTopStyle, bg: cs.backgroundColor, txt: b.textContent }; });
    check(look.undo && look.border === "dashed" && look.bg !== "rgb(45, 45, 45)" && /↶/.test(look.txt), "11: undo state looks different (" + JSON.stringify(look) + ")");
    await wait(450);
    await hold(p, "#btn-clear", 1000);
    check((await msgOf(p)) === "", "11: holding again in the undo window keeps it cleared (" + await msgOf(p) + ")");
    check(await p.evaluate(function () { return !document.getElementById("btn-clear").classList.contains("undo"); }), "11: ...and the undo is gone");
    await p.close();

    /* 12. voice menu shows the voice in use; Automatic matches the iPad's English */
    const V = [{ name: "Samantha", lang: "en-US", localService: true, default: true, voiceURI: "sam" },
               { name: "Daniel", lang: "en-GB", localService: true, default: false, voiceURI: "dan" },
               { name: "Amélie", lang: "fr-CA", localService: true, default: false, voiceURI: "ame" }];
    p = await fresh({ wordsShown: "full", voiceURI: "ame", voiceName: "Amélie" }, { voices: V });
    await p.evaluate(function () { window.WB.openSettings && window.WB.openSettings(); });
    await wait(200);
    const vsel = await p.evaluate(function () { const s = document.getElementById("set-voice"); return s.value + "|" + (s.selectedOptions[0] ? s.selectedOptions[0].textContent : ""); });
    await tap(p, '#board [aria-label="go"]').catch(function () {});
    check(/^ame\|/.test(vsel), "12: the voice menu shows the saved voice that is in use (" + vsel + ")");
    await p.close();
    p = await fresh({ wordsShown: "full" }, { voices: V, lang: "en-GB" });
    check(await p.evaluate(function () { const v = window.WB.bestVoice(); return v && v.voiceURI; }) === "dan", "12: Automatic on an en-GB iPad picks the en-GB voice");
    await p.close();
    p = await fresh({ wordsShown: "full" }, { voices: V, lang: "en-US" });
    check(await p.evaluate(function () { const v = window.WB.bestVoice(); return v && v.voiceURI; }) === "sam", "12: Automatic on an en-US iPad picks the en-US voice");
    await p.close();

    /* small fixes: speaking indicator gives up if the engine never ends; Enter on a finished tile */
    p = await fresh({ wordsShown: "full", tapGuardMs: 0 }, { neverEnd: true });
    await tap(p, '#board [aria-label="go"]');
    await tap(p, "#btn-speak");
    await wait(100);
    const sp1 = await p.evaluate(function () { return document.body.classList.contains("speaking"); });
    await wait(4200);
    const sp2 = await p.evaluate(function () { return document.body.classList.contains("speaking"); });
    check(sp1 && !sp2, "speaking indicator turns off when the engine never reports the end (" + sp1 + "/" + sp2 + ")");
    await p.close();
    p = await fresh({ wordsShown: "full", pathsSet: "all" });
    await tap(p, "#nav-paths");
    await tap(p, '[data-pattern="want"]');
    for (let s = 0; s < 4; s++) {
      const st = await p.evaluate(function () { return window.WB.paths(); });
      if (st.requiredDone || !st.choices.length) break;
      await p.evaluate(function (l) { const n = [].find.call(document.querySelectorAll("[data-choice]"), function (x) { return x.getAttribute("data-choice") === l; }); n.setAttribute("data-r", "c"); }, st.choices[0]);
      await wait(460); await tap(p, "[data-r=c]"); await wait(50);
    }
    await wait(500);
    const n0 = await p.evaluate(function () { return window.__spoken.length; });
    await p.focus(".path-done .path-replay");
    await p.keyboard.press("Enter");
    await wait(100);
    check(await p.evaluate(function (n) { return window.__spoken.length > n; }, n0), "Enter on a finished big word says the sentence");
    await p.close();
    /* speaking label fits at portrait width */
    p = await fresh({ wordsShown: "full" }, { w: 820, h: 1180 });
    const lab = await p.evaluate(function () { const t = document.querySelector("#btn-speak .txt"); const old = t.textContent; t.textContent = "speaking"; const r = t.scrollWidth <= t.clientWidth + 1; t.textContent = old; return r; });
    check(lab, "speak button label 'speaking' fits in portrait");
    await p.close();
    /* sw.js installs all-or-nothing */
    const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
    check(!/\.catch\(function \(\) \{\}\)/.test(sw) && /throw/.test(sw), "sw.js install fails as a whole if a core file is missing");
  } finally {
    for (const p of pages) { try { if (!p.isClosed()) await p.close(); } catch (e) {} }
  }
}

/* ==== 1.6.0: button looks (classic / chunky / tint / pebble) ==== */
async function regress160(browser, check, wait) {
  const LOOKS = ["classic", "chunky", "tint", "pebble"];
  async function fresh(saved, o) {
    o = o || {};
    const p = await browser.newPage();
    p.setDefaultTimeout(15000);
    await p.setViewport({ width: o.w || 1180, height: o.h || 820 });
    p.on("pageerror", function (e) { check(false, "page error " + e.message); });
    if (o.reduce) await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await p.evaluateOnNewDocument(function () {
      var fake = { speaking: false, pending: false, paused: false, getVoices: function () { return []; }, addEventListener: function () {}, cancel: function () {}, resume: function () {},
        speak: function (u) { setTimeout(function () { if (u.onend) u.onend(); }, 0); } };
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      try { Object.defineProperty(window, "speechSynthesis", { configurable: true, get: function () { return fake; } }); } catch (e) {}
    });
    await p.goto("http://127.0.0.1:" + port + "/", { waitUntil: "domcontentloaded" });
    if (saved) await p.evaluate(function (s) { localStorage.clear(); localStorage.setItem("wb.settings", JSON.stringify(s)); }, saved);
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForFunction(function () { return window.WB && document.querySelector("#board .cell"); });
    await wait(300);
    return p;
  }
  function lum(c) { const m = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; }
  function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  const scan = function (p) {
    return p.evaluate(function () {
      const btns = [].slice.call(document.querySelectorAll("#board .cell.btn"));
      return {
        body: document.body.className,
        layout: btns.map(function (b) { return b.style.gridRow + "/" + b.style.gridColumn + ":" + b.getAttribute("aria-label"); }).join("|"),
        over: btns.filter(function (b) { const l = b.querySelector(".lbl"); if (!l || b.classList.contains("piconly")) return false; const r = l.getBoundingClientRect(), x = b.getBoundingClientRect(); return r.bottom > x.bottom + 1 || r.top < x.top - 1 || r.left < x.left - 1 || r.right > x.right + 1; }).map(function (b) { return b.getAttribute("aria-label"); }),
        colours: btns.filter(function (b) { return !b.classList.contains("piconly"); }).map(function (b) { return [getComputedStyle(b.querySelector(".lbl")).color, getComputedStyle(b).backgroundColor, b.getAttribute("aria-label")]; }),
        hcEdge: btns.every(function (b) { const cs = getComputedStyle(b); return cs.borderTopWidth === "5px" && cs.borderTopStyle === "solid" && cs.borderTopColor === "rgb(0, 0, 0)"; }),
        emo: (function () { const e = document.querySelector('#board [aria-label="go"] .emo'); return e ? e.getBoundingClientRect().height : 0; })()
      };
    });
  };
  const lowContrast = function (s) { return s.colours.filter(function (c) { return !/rgba\(0, 0, 0, 0\)/.test(c[1]) && ratio(c[0], c[1]) < 4.5; }).map(function (c) { return c[2]; }); };

  /* a 1.5.6 setup (no buttonLook saved) stays classic; nonsense values fall back to classic */
  let p = await fresh({ levelsVersion: 2, wordsShown: "full", sayLetters: true, clearMode: "hold", textSize: "normal", boardColor: "dark", bigButtons: false });
  const mig = await p.evaluate(function () { return { look: window.WB.settings.buttonLook, cls: /look-/.test(document.body.className), sel: (window.WB.openSettings(), document.getElementById("set-buttonlook").value), radius: getComputedStyle(document.querySelector("#board .cell.btn")).borderTopLeftRadius }; });
  check(mig.look === "classic" && !mig.cls && mig.sel === "classic" && mig.radius === "14px", "1.6: a 1.5.6 setup keeps the classic buttons (" + JSON.stringify(mig) + ")");
  const classicLayout = (await scan(p)).layout;
  /* choosing a look in settings applies it at once and survives a reload */
  await p.evaluate(function () { const s = document.getElementById("set-buttonlook"); s.value = "chunky"; s.dispatchEvent(new Event("change")); });
  await wait(100);
  check(await p.evaluate(function () { return document.body.classList.contains("look-chunky") && JSON.parse(localStorage.getItem("wb.settings")).buttonLook === "chunky"; }), "1.6: picking chunky applies and is saved");
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForFunction(function () { return window.WB && document.querySelector("#board .cell"); });
  check(await p.evaluate(function () { window.WB.openSettings(); return document.body.classList.contains("look-chunky") && document.getElementById("set-buttonlook").value === "chunky"; }), "1.6: the look persists after reopening the app (and settings shows it)");
  await p.evaluate(function () { const s = document.getElementById("set-buttonlook"); s.value = "classic"; s.dispatchEvent(new Event("change")); });
  check(await p.evaluate(function () { return !/look-/.test(document.body.className); }), "1.6: back to classic removes the look");
  await p.close();
  p = await fresh({ levelsVersion: 2, wordsShown: "full", buttonLook: "sparkly" });
  check(await p.evaluate(function () { return window.WB.settings.buttonLook === "classic" && !/look-/.test(document.body.className); }), "1.6: an unknown saved look falls back to classic");
  await p.close();

  /* every look with every Look setting: same positions, labels inside, readable text */
  const combos = [["dark", {}], ["light", { boardColor: "light" }], ["blue", { boardColor: "blue" }], ["hc", { contrast: "high" }], ["hc+light", { contrast: "high", boardColor: "light" }],
                  ["larger", { textSize: "larger" }], ["starter-big", { wordsShown: "starter", bigButtons: true }], ["picture-only", { showMode: "pic" }]];
  const picBase = {};
  for (const look of LOOKS) {
    for (const [name, extra] of combos) {
      p = await fresh(Object.assign({ levelsVersion: 2, wordsShown: "full", buttonLook: look }, extra));
      const s = await scan(p);
      const tag = look + "/" + name;
      if (name === "dark") check(s.layout === classicLayout, "1.6 " + tag + ": every button in the same place as classic");
      if (name === "starter-big") {
        if (look === "classic") picBase.starter = s.layout;
        else check(s.layout === picBase.starter, "1.6 " + tag + ": Starter big buttons keep their places");
      }
      check(s.over.length === 0, "1.6 " + tag + ": labels stay inside their buttons (" + s.over.slice(0, 5) + ")");
      const low = lowContrast(s);
      check(low.length === 0, "1.6 " + tag + ": label contrast >= 4.5 (" + low.slice(0, 5) + ")");
      if (/^hc/.test(name) && look !== "classic") check(s.hcEdge, "1.6 " + tag + ": high contrast keeps the solid black edge");
      if (name === "picture-only") {
        if (look === "classic") picBase.emo = s.emo;
        else check(s.emo >= picBase.emo * 0.9, "1.6 " + tag + ": picture-only pictures stay big (" + Math.round(s.emo) + " vs classic " + Math.round(picBase.emo) + ")");
      }
      await p.close();
    }
  }

  /* pressing: chunky / pebble move the button, but not with reduce motion on */
  for (const look of ["chunky", "pebble"]) {
    for (const reduce of [false, true]) {
      p = await fresh({ levelsVersion: 2, wordsShown: "full", buttonLook: look }, { reduce: reduce });
      const tf = await p.evaluate(function () { const b = document.querySelector('#board [aria-label="want"]'); b.classList.add("pressed"); const t = getComputedStyle(b).transform; b.classList.remove("pressed"); return t; });
      check(reduce ? tf === "none" : tf !== "none", "1.6 " + look + (reduce ? " + reduce motion: pressed button does not move" : ": pressed button moves") + " (" + tf + ")");
      await p.close();
    }
  }
}

main().catch(function (e) { console.error(e); process.exit(1); });
