#!/usr/bin/env node
/* Browser smoke for Paths. Uses system Chrome via puppeteer-core.
   Does not hardcode the old pattern titles; it opens cards by id and
   checks the chrome buttons by their aria-labels.
   Usage: node tools/paths-smoke.js [port]
*/
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.join(__dirname, "..");
const port = Number(process.argv[2]) || 8765;
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
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });
  const fails = [];
  function check(cond, msg) { if (!cond) { fails.push(msg); console.error("FAIL:", msg); } else console.log("ok:", msg); }
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    await page.setViewport({ width: 1180, height: 820 });
    await page.evaluateOnNewDocument(function () {
      window.__spoken = [];
      function Utterance(text) { this.text = text || ""; }
      window.SpeechSynthesisUtterance = Utterance;
      var fake = {
        speaking: false, pending: false, paused: false,
        getVoices: function () { return [{ name: "Test", lang: "en-US", localService: true, default: true, voiceURI: "test" }]; },
        addEventListener: function () {},
        cancel: function () { this.speaking = false; },
        resume: function () {},
        speak: function (u) {
          window.__spoken.push(String(u && u.text || ""));
          this.speaking = true;
          var self = this;
          setTimeout(function () { self.speaking = false; if (u && u.onend) try { u.onend(); } catch (e) {} }, 0);
        }
      };
      try { Object.defineProperty(window, "speechSynthesis", { configurable: true, get: function () { return fake; } }); }
      catch (e) { window.speechSynthesis = fake; }
    });
    await page.goto("http://127.0.0.1:" + port + "/", { waitUntil: "domcontentloaded" });
    await page.evaluate(function () {
      localStorage.setItem("wb.settings", JSON.stringify({
        wordsShown: "expanded", pathsSet: "auto", pathsSpeakEach: true, pathsShowTab: true,
        pathsToWords: true, pathsMaxChoices: 6, pathsPreferRecent: true, tapGuardMs: 0,
        logEnabled: false, levelsVersion: 2
      }));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(function () { return window.WB && window.WB.paths && document.getElementById("nav-paths"); });

    check(!documentExists(await page.$("#nav-stories")), "stories tab is not on the bar");
    const storyCount = await page.evaluate(function () { return (window.WB.stories || []).length; });
    check(storyCount > 0, "stories still load (" + storyCount + ")");

    await tap(page, "#nav-paths");
    await page.waitForSelector(".path-card");
    const menu = await page.evaluate(function () {
      return {
        ids: Array.from(document.querySelectorAll("[data-pattern]")).map(function (b) { return b.getAttribute("data-pattern"); }),
        chrome: Array.from(document.querySelectorAll(".path-btn")).map(function (b) { return b.getAttribute("aria-label"); }),
        undoOff: document.querySelector(".path-btn.back").disabled,
        allOff: document.querySelector(".path-btn.home").disabled
      };
    });
    check(menu.ids.length === 12, "expanded shows 12 cards (" + menu.ids.length + ": " + menu.ids.join(", ") + ")");
    check(menu.ids.indexOf("who_what") >= 0 && menu.ids.indexOf("where_is") >= 0 && menu.ids.indexOf("dont_want") >= 0, "new expanded patterns are on the menu");
    check(menu.ids.indexOf("can") < 0 && menu.ids.indexOf("put") < 0, "sentence frames stay off Expanded");
    check(menu.chrome.join(" | ") === "undo last word | show all patterns | say whole phrase | copy phrase to Words", "chrome order " + menu.chrome.join(" | "));
    check(menu.undoOff && menu.allOff, "undo and all patterns start disabled");

    await tap(page, '[data-pattern="who_what"]');
    await tapChoice(page, "who");
    await tapChoice(page, "is");
    await tapChoice(page, "it");
    let snap = await page.evaluate(function () { return window.WB.paths(); });
    check(snap.picks.join("|") === "who|is|it" && snap.requiredDone, "who is it walks to the end");
    const said = await page.evaluate(function () { return window.__spoken.slice(); });
    check(said.indexOf("who") >= 0 && said.indexOf("is") >= 0 && said.indexOf("it") >= 0, "each tap is spoken (" + said.join(" / ") + ")");

    await tap(page, '[aria-label="undo last word"]');
    snap = await page.evaluate(function () { return window.WB.paths(); });
    check(snap.picks.join("|") === "who|is|" && snap.step === 2, "undo removes the last word");
    await tapChoice(page, "that");
    await page.evaluate(function () { window.__spoken = []; });
    await tap(page, '[aria-label="say whole phrase"]');
    const whole = await page.evaluate(function () { return window.__spoken.join(" | "); });
    check(/who is that\?/i.test(whole), "say whole speaks the question (" + whole + ")");

    await tap(page, '[aria-label="show all patterns"]');
    const back = await page.evaluate(function () {
      return { cards: document.querySelectorAll(".path-card").length, allOff: document.querySelector(".path-btn.home").disabled, path: window.WB.paths().pathId };
    });
    check(back.cards === 12 && back.allOff && !back.path, "all patterns returns to the menu");

    await tap(page, '[data-pattern="help"]');
    await tapChoice(page, "help");
    await tapChoice(page, "me");
    await tap(page, '[aria-label="copy phrase to Words"]');
    const copied = await page.evaluate(function () {
      return { msg: document.getElementById("msg").textContent, home: document.getElementById("nav-home").classList.contains("on"), view: window.WB.state.view };
    });
    check(copied.view === "words" && copied.home && /help/i.test(copied.msg) && /me/i.test(copied.msg), "→ words copies Help me (" + copied.msg + ")");

    await page.evaluate(function () {
      window.WB.settings.wordsShown = "sentences";
      window.WB.settings.pathsMaxChoices = 6;
    });
    await tap(page, "#nav-paths");
    await page.waitForSelector('[data-pattern="like_ing"]');
    const sent = await page.evaluate(function () {
      return Array.from(document.querySelectorAll("[data-pattern]")).map(function (b) { return b.getAttribute("data-pattern"); });
    });
    check(sent.indexOf("can") >= 0 && sent.indexOf("put") >= 0 && sent.indexOf("want_please") >= 0 && sent.indexOf("like_ing") >= 0, "sentences adds the longer frames");
    for (const id of ["dont_want", "where_is", "can", "put", "want_please"]) {
      await tap(page, '[data-pattern="' + id + '"]');
      for (let n = 0; n < 6; n++) {
        const choice = await page.evaluate(function () {
          const b = document.querySelector("[data-choice]");
          return b ? b.getAttribute("data-choice") : "";
        });
        if (!choice) break;
        await tapChoice(page, choice);
      }
      const walked = await page.evaluate(function () {
        const p = window.WB.paths();
        return { picks: p.picks, done: p.requiredDone, left: document.querySelectorAll("[data-choice]").length };
      });
      check(walked.done && walked.left === 0 && walked.picks.filter(Boolean).length >= 2, id + " walks (" + JSON.stringify(walked) + ")");
      await tap(page, '[aria-label="show all patterns"]');
    }

    await tap(page, '[data-pattern="like_ing"]');
    await tapChoice(page, "I");
    await tapChoice(page, "like");
    const activity = await page.evaluate(function () { return window.WB.paths().choices[0]; });
    check(!!activity, "I like …ing has an activity (" + activity + ")");
    await tapChoice(page, activity);
    const early = await page.evaluate(function () { return document.querySelector('[aria-label="copy phrase to Words"]').disabled; });
    check(!early, "→ words is available before the optional ending");
    await tapChoice(page, "-ing");
    await tap(page, '[aria-label="copy phrase to Words"]');
    const liked = await page.evaluate(function () { return document.getElementById("msg").textContent; });
    check(/like/i.test(liked) && /ing/i.test(liked) && liked.indexOf("-ing") < 0, "ending inflects into the message (" + liked + ")");

    await page.evaluate(function () { window.WB.openSettings(); });
    await page.waitForSelector("#set-pathsshow");
    const settingsOn = await page.evaluate(function () {
      return {
        show: document.getElementById("set-pathsshow").checked,
        speak: document.getElementById("set-pathspeak").checked,
        copy: document.getElementById("set-pathstowords").checked,
        max: document.getElementById("set-pathsmax").value,
        recent: document.getElementById("set-pathsrecent").checked
      };
    });
    check(settingsOn.show && settingsOn.speak && settingsOn.copy && settingsOn.max === "6" && settingsOn.recent, "path settings default on (" + JSON.stringify(settingsOn) + ")");
    await page.select("#set-pathsmax", "2");
    await page.$eval("#set-pathstowords", function (el) { el.checked = false; el.dispatchEvent(new Event("change", { bubbles: true })); });
    await page.$eval("#set-close", function (el) { el.click(); });
    await page.evaluate(function () { window.WB.settings.wordsShown = "expanded"; });
    await tap(page, "#nav-paths");
    await tap(page, '[data-pattern="want"]');
    await tapChoice(page, "I");
    await tapChoice(page, "want");
    const nChoices = await page.evaluate(function () { return document.querySelectorAll("[data-choice]").length; });
    check(nChoices === 2, "max choices 2 (" + nChoices + ")");
    const fringe = await page.evaluate(function () { return window.WB.paths().choices[0]; });
    await tapChoice(page, fringe);
    const sendOff = await page.evaluate(function () {
      return { disabled: document.querySelector('[aria-label="copy phrase to Words"]').disabled, done: window.WB.paths().requiredDone };
    });
    check(sendOff.done && sendOff.disabled, "copy to Words can be turned off");

    await page.evaluate(function () { window.WB.openSettings(); });
    await page.$eval("#set-pathsshow", function (el) { el.checked = false; el.dispatchEvent(new Event("change", { bubbles: true })); });
    await page.$eval("#set-close", function (el) { el.click(); });
    const hidden = await page.evaluate(function () {
      const b = document.getElementById("nav-paths");
      return b.classList.contains("is-hidden") && b.getAttribute("aria-hidden") === "true" && window.WB.state.view !== "paths";
    });
    check(hidden, "hiding the Paths tab keeps the slot and leaves the tab");
  } finally {
    await browser.close();
    server.close();
  }
  if (fails.length) {
    console.error(fails.length + " smoke checks failed");
    process.exit(1);
  }
  console.log("paths-smoke ok");
}

function documentExists(handle) { return !!handle; }

main().catch(function (e) { console.error(e); process.exit(1); });
