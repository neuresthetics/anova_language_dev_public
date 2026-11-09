#!/usr/bin/env node
/* Browser smoke for 1.5.4: word endings, leaving Paths, replaying a finished path,
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
  } finally {
    await browser.close();
    server.close();
  }
  if (fails.length) { console.error(fails.length + " smoke checks failed"); process.exit(1); }
  console.log("app-smoke ok");
}
main().catch(function (e) { console.error(e); process.exit(1); });
