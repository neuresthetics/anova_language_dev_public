/* Word Board – AAC app shell. Plain JS, no dependencies, works offline.
   The shell holds only generic content. Personal content (a "pack") is
   imported in parent mode and stored on this device only (IndexedDB). */
(function () {
  "use strict";
  var APP_VERSION = "1.2.8";
  var LS = { settings: "wb.settings", hidden: "wb.hidden", log: "wb.log", custom: "wb.custom" };
  var DEFAULT_SETTINGS = {
    voiceURI: "", voiceName: "", rate: 0.9, pitch: 1.0, volume: 1.0,
    wordCase: "asis", keyCase: "upper",
    showPictures: true, prediction: true, sayLetters: false, highlight: true,
    storyMode: "smooth", returnHome: false, tapGuardMs: 400, gateTripleTap: false,
    logEnabled: false, allVoices: false,
    wordsShown: "",          // "" = the pack's default (config.wordsShown), else starter | middle | full | custom
    levelInFolders: false    // also mask words inside folders by level (folder buttons always show)
  };
  var LETTER_NAMES = { a: "A.", b: "bee", c: "see", d: "dee", e: "ee", f: "ef", g: "gee", h: "aitch",
    i: "eye", j: "jay", k: "kay", l: "el", m: "em", n: "en", o: "oh", p: "pee", q: "cue", r: "ar",
    s: "ess", t: "tee", u: "you", v: "vee", w: "double you", x: "ex", y: "why", z: "zee" };
  /* Spoken forms used when no board word supplies a "say" (iOS reads a lone "I" as "capital I"). */
  var SAY_DEFAULTS = { i: "eye" };
  function sayFor(word) {
    var k = String(word).toLowerCase(), w = wordByLabel[k];
    return (w && w.say) || SAY_DEFAULTS[k] || null;
  }
  var NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical)\b/i;
  var Store = window.WBStore, Zip = window.WBZip;

  /* ------------------------------------------------------------ helpers */
  function readJSON(k, fb) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch (e) { return fb; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn("save failed", e); } }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  var settings = Object.assign({}, DEFAULT_SETTINGS, readJSON(LS.settings, {}));
  function saveSettings() { writeJSON(LS.settings, settings); }

  /* ------------------------------------------------------------ pack + media (on-device only) */
  var pack = null;          // personal pack from IndexedDB, or null = generic board
  var media = {};           // key -> {type, data: ArrayBuffer}
  var mediaUrls = {};       // key -> object URL
  function mediaURL(key) {
    if (!key) return null;
    if (media[key]) {
      if (!mediaUrls[key]) mediaUrls[key] = URL.createObjectURL(new Blob([media[key].data], { type: media[key].type }));
      return mediaUrls[key];
    }
    if (/^(https?:|data:|blob:)/.test(key)) return key;   // explicit URL; relative names come only from the pack
    return null;
  }
  function mediaBuffer(key) {
    if (media[key]) return Promise.resolve(media[key].data);
    if (/^(https?:|data:)/.test(key)) {
      return fetch(key).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); });
    }
    return Promise.reject(new Error("not in pack"));
  }
  function resetMediaUrls() { Object.keys(mediaUrls).forEach(function (k) { URL.revokeObjectURL(mediaUrls[k]); }); mediaUrls = {}; }
  function savePack() { return Store.put("kv", "pack", pack); }
  function ensurePack() {
    if (pack) return pack;
    pack = { format: "wordboard-pack", version: 1, name: "My pack", created: new Date().toISOString(),
      config: clone(window.AAC_DEFAULT_CONFIG), stories: [], includeSampleStories: true };
    return pack;
  }

  /* ------------------------------------------------------------ config */
  var config, problems = [], pageById = {}, cellMap = {}, wordByLabel = {}, stories = [];
  function loadConfig() {
    var base = pack && pack.config && pack.config.pages ? pack.config : window.AAC_DEFAULT_CONFIG;
    config = clone(base || { pages: [{ id: "home", title: "Home", rows: 5, cols: 8 }], words: [] });
    var hidden = readJSON(LS.hidden, {});
    config.words.forEach(function (w) { if (Object.prototype.hasOwnProperty.call(hidden, w.id)) w.hidden = !!hidden[w.id]; });
    validate();
    var sample = window.AAC_STORIES || [], own = (pack && pack.stories) || [];
    var ids = {}; own.forEach(function (s) { ids[s.id] = 1; });
    stories = own.concat(pack && pack.includeSampleStories === false ? [] : sample.filter(function (s) { return !ids[s.id]; }));
  }
  function validate() {
    problems = []; pageById = {}; cellMap = {}; wordByLabel = {};
    var ids = {};
    config.pages.forEach(function (p) {
      if (pageById[p.id]) problems.push("Duplicate page id: " + p.id);
      p.rows = p.rows || 5; p.cols = p.cols || 8; pageById[p.id] = p; cellMap[p.id] = {};
    });
    if (!pageById.home) problems.push('No page with id "home".');
    config.words.forEach(function (w) {
      if (!w.id) w.id = (w.page + "-" + w.label).toLowerCase().replace(/\s+/g, "-");
      if (ids[w.id]) problems.push('Duplicate word id "' + w.id + '".');
      ids[w.id] = true;
      var p = pageById[w.page];
      if (!p) { problems.push('"' + w.label + '": page "' + w.page + '" does not exist.'); return; }
      if (!(w.row >= 1 && w.row <= p.rows && w.col >= 1 && w.col <= p.cols)) {
        problems.push('"' + w.label + '" at row ' + w.row + ", col " + w.col + " is outside the " + p.rows + "x" + p.cols + " grid of " + p.id + "."); return;
      }
      var key = w.row + "," + w.col;
      if (cellMap[p.id][key]) { problems.push('"' + w.label + '" and "' + cellMap[p.id][key].label + '" both use ' + p.id + " row " + w.row + " col " + w.col + '. Kept "' + cellMap[p.id][key].label + '".'); return; }
      if (w.level != null && [1, 2, 3].indexOf(+w.level) < 0) problems.push('"' + w.label + '": level should be 1, 2 or 3 (got ' + w.level + ").");
      if (w.type === "folder" && !pageById[w.target]) problems.push('Folder "' + w.label + '" points to missing page "' + w.target + '".');
      cellMap[p.id][key] = w;
      if (w.type !== "folder") { var l = String(w.label).toLowerCase(); if (!wordByLabel[l] || (!wordByLabel[l].audio && w.audio)) wordByLabel[l] = w; }
    });
    problems.forEach(function (m) { console.warn("[words config] " + m); });
  }

  /* ------------------------------------------------------------ words shown (progressive reveal)
     AAC practice: MASK buttons, never move them. A masked word leaves an empty cell, so every
     visible button keeps its place as more words are revealed. Level per word: 1 = starter,
     2 = middle, 3 = full (pack field "level"; otherwise the generic defaults below).
     Folder buttons always show. */
  var LEVELS = { starter: 1, middle: 2, full: 3 };
  var GENERIC_LEVEL = {};
  // Generic defaults from published toddler/preschool core-vocabulary lists (not any one child's words).
  ("i|you|want|more|help|go|stop|yes|no|all done|it|that|my|mine|up|in|on|off|what|here|eat|drink|play|look|like|not")
    .split("|").forEach(function (l) { GENERIC_LEVEL[l] = 1; });
  ("open|down|out|get|put|see|do|make|come|again|some|all|and|don't|please|thank you|your|good|big|little|" +
   "different|same|there|where|where?|hi|bye|finished|my turn|turn|me|we|is|can|the|a|to|this|now")
    .split("|").forEach(function (l) { GENERIC_LEVEL[l] = 2; });
  function wordLevel(w) {
    if (w.type === "folder") return 1;
    var n = +w.level;
    if (n === 1 || n === 2 || n === 3) return n;
    return GENERIC_LEVEL[String(w.label).toLowerCase()] || 3;
  }
  var customVis = readJSON(LS.custom, null);          // { base: 1-3, shown: { wordId: true/false } }
  if (!customVis || typeof customVis !== "object" || !customVis.shown) customVis = null;
  function wordsShownMode() {
    var m = settings.wordsShown || (config && config.wordsShown) || "full";
    return LEVELS[m] || m === "custom" ? m : "full";
  }
  function isShown(w, pageId) {
    if (!w) return false;
    if (w.type === "folder") return !w.hidden;
    var mode = wordsShownMode(), lv = LEVELS[mode] || 3;
    if (mode === "custom") {
      if (customVis && Object.prototype.hasOwnProperty.call(customVis.shown, w.id)) return !!customVis.shown[w.id];
      lv = (customVis && customVis.base) || 3;
    }
    if (w.hidden) return false;
    if (lv >= 3 || ((pageId || w.page) !== "home" && !settings.levelInFolders)) return true;
    return wordLevel(w) <= lv;
  }
  function setWordsShown(mode) {
    if (mode === "custom" && !customVis) { customVis = { base: LEVELS[wordsShownMode()] || 3, shown: {} }; writeJSON(LS.custom, customVis); }
    settings.wordsShown = mode; saveSettings();
  }
  function shownCount(pageId) {
    var n = 0, all = 0;
    config.words.forEach(function (w) { if (w.page === pageId && w.type !== "folder" && cellMap[pageId][w.row + "," + w.col] === w) { all++; if (isShown(w, pageId)) n++; } });
    return [n, all];
  }

  /* ------------------------------------------------------------ text case + fitting */
  function caseWord(t) {
    t = String(t);
    if (settings.wordCase === "upper") return t.toUpperCase();
    if (settings.wordCase === "capital") return t.replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });
    return t;
  }
  function caseTyped(t) { t = String(t).toLowerCase(); if (t === "i") t = "I"; return caseWord(t); }
  function caseKey(L) { return settings.keyCase === "lower" ? L.toLowerCase() : L.toUpperCase(); }
  var mctx = document.createElement("canvas").getContext("2d");
  function textW(t, fam) { mctx.font = "800 100px " + fam; return mctx.measureText(t).width || t.length * 60; }
  /* Size each label so its longest word fits the button width; short words share the same max size. */
  function fitLabels(root) {
    var btns = root.querySelectorAll(".cell.btn:not(.key)");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i], l = b.querySelector(".lbl"); if (!l) continue;
      // drop the previous pass's sizes before measuring, so old sizes can't carry over
      var e0 = b.querySelector(".emo"), p0 = b.querySelector(".pic");
      l.style.fontSize = ""; if (e0) e0.style.fontSize = ""; if (p0) { p0.style.height = ""; p0.style.maxWidth = ""; }
    }
    for (i = 0; i < btns.length; i++) {
      var b = btns[i], l = b.querySelector(".lbl"); if (!l) continue;
      var cs = getComputedStyle(b);
      var W = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var H = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (W <= 0 || H <= 0) continue;
      var fam = getComputedStyle(l).fontFamily, text = l.textContent, words = text.split(/\s+/);
      var pic = !b.classList.contains("nopic"), usable = W * 0.9;
      // words shorter than "more" are sized like "more", so short and 4-letter words match
      var ref = textW("more", fam);
      var size = Math.min(100 * usable / Math.max(ref, textW(text, fam)), H * (pic ? 0.36 : 0.5)), two = false;
      if (words.length > 1) {
        var widest = Math.max.apply(null, words.map(function (w) { return Math.max(ref, textW(w, fam)); }));
        var s2 = Math.min(100 * usable / widest, H * (pic ? 0.27 : 0.38));
        if (s2 > size * 1.08) { size = s2; two = true; }
      }
      size = Math.min(size, pic ? 60 : 84);
      l.style.fontSize = Math.floor(size) + "px";
      l.style.whiteSpace = two ? "normal" : "nowrap";
      var e = b.querySelector(".emo"), ph = b.querySelector(".pic");
      if (e) e.style.fontSize = Math.floor(Math.min(H * (two ? 0.31 : 0.37), W * 0.55)) + "px";
      if (ph) { var h = Math.floor(Math.min(H * (two ? 0.34 : 0.42), W)); ph.style.height = h + "px"; ph.style.maxWidth = W + "px"; }
    }
  }

  /* ------------------------------------------------------------ speech */
  var Speech = {
    synth: window.speechSynthesis || null, voices: [], unlocked: false, keep: [],
    load: function () {
      if (!this.synth) return;
      var v = this.synth.getVoices() || [];
      if (v.length && v.length !== this.voices.length) { this.voices = v; fillVoiceSelect(); }
    },
    init: function () {
      if (!this.synth) return;
      var self = this;
      this.load();
      if (this.synth.addEventListener) this.synth.addEventListener("voiceschanged", function () { self.load(); });
      else this.synth.onvoiceschanged = function () { self.load(); };
      // iOS often loads voices late and may never fire voiceschanged: poll briefly.
      var tries = 0, t = setInterval(function () { self.load(); tries++; if (tries > 40 || (self.voices.length && tries > 8)) clearInterval(t); }, 250);
    },
    voice: function () {
      var vs = this.voices; if (!vs.length) return null;
      var i;
      for (i = 0; i < vs.length; i++) if (settings.voiceURI && vs[i].voiceURI === settings.voiceURI) return vs[i];
      for (i = 0; i < vs.length; i++) if (settings.voiceName && vs[i].name === settings.voiceName) return vs[i];
      var us = vs.filter(function (x) { return /^en[-_]US/i.test(x.lang) && !NOVELTY.test(x.name); });
      var pool = us.length ? us : vs.filter(function (x) { return /^en/i.test(x.lang) && !NOVELTY.test(x.name); });
      return pool.filter(function (x) { return /premium|enhanced|natural/i.test(x.name); })[0] ||
        pool.filter(function (x) { return /samantha/i.test(x.name); })[0] ||
        pool.filter(function (x) { return x.default; })[0] ||
        pool.filter(function (x) { return x.localService; })[0] || pool[0] || null;
    },
    speak: function (text, opts) {
      opts = opts || {};
      if (!this.synth || !text) { if (opts.onend) setTimeout(opts.onend, 0); return; }
      var s = this.synth;
      if (s.speaking || s.pending) s.cancel();
      if (s.paused) s.resume();
      var u = new SpeechSynthesisUtterance(text), v = this.voice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
      u.rate = +settings.rate || 1; u.pitch = +settings.pitch || 1; u.volume = +settings.volume || 1;
      var done = false, self = this;
      function finish() { if (done) return; done = true; self.keep = self.keep.filter(function (x) { return x !== u; }); if (opts.onend) opts.onend(); }
      u.onend = finish;
      u.onerror = function (e) { if (e && e.error && e.error !== "interrupted" && e.error !== "canceled") console.info("speech:", e.error); finish(); };
      if (opts.onboundary) u.onboundary = function (e) { if (e.name === "word" || e.name === undefined) opts.onboundary(e.charIndex); };
      this.keep.push(u);            // keep a reference: engines can garbage-collect utterances mid-speech
      s.speak(u);
      this.unlocked = true;
    },
    /* Call inside a tap before async work that may speak later (iOS: speech must start from a gesture). */
    unlock: function () {
      if (this.unlocked || !this.synth) return;
      try { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; this.keep.push(u); this.synth.speak(u); } catch (e) {}
      this.unlocked = true;
    },
    stop: function () { if (this.synth && (this.synth.speaking || this.synth.pending)) this.synth.cancel(); }
  };

  /* ------------------------------------------------------------ recorded clips (Web Audio) */
  var Clips = {
    ctx: null, buffers: {}, missing: {}, src: null,
    unlock: function () {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) { try { this.ctx = new AC(); } catch (e) { return; } }
      if (this.ctx.state === "suspended") this.ctx.resume();
      if (!this._primed) { try { var b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0); } catch (e) {} this._primed = true; }
    },
    play: function (key) {
      var self = this;
      if (!key || this.missing[key] || !this.ctx) return Promise.resolve(false);
      var get = this.buffers[key] ? Promise.resolve(this.buffers[key]) :
        mediaBuffer(key).then(function (ab) { return new Promise(function (res, rej) { self.ctx.decodeAudioData(ab.slice(0), res, rej); }); })
          .then(function (buf) { self.buffers[key] = buf; return buf; });
      return get.then(function (buf) {
        return new Promise(function (res) {
          self.stop();
          var s = self.ctx.createBufferSource(); s.buffer = buf;
          var g = self.ctx.createGain(); g.gain.value = +settings.volume || 1;
          s.connect(g); g.connect(self.ctx.destination);
          s.onended = function () { if (self.src === s) self.src = null; res(true); };
          self.src = s; s._res = res; s.start(0);
        });
      }).catch(function (e) { self.missing[key] = true; console.info("recording unavailable, using voice:", key, e && e.message); return false; });
    },
    stop: function () { if (this.src) { var s = this.src; this.src = null; try { s.onended = null; s.stop(); } catch (e) {} if (s._res) s._res(false); } },
    reset: function () { this.buffers = {}; this.missing = {}; }
  };
  function hasClip(key) { return !!key && !Clips.missing[key] && (!!media[key] || !!mediaURL(key)); }

  /* ------------------------------------------------------------ talker */
  var seq = 0, hlFn = null;
  function stopAll() { seq++; Speech.stop(); Clips.stop(); if (hlFn) hlFn(-1); }
  /* tokens [{text, say, audio}], idx[i] = highlight index, opts {hl: fn, each: speak word by word} */
  function talk(tokens, idx, opts) {
    opts = opts || {};
    stopAll();
    var my = seq, hl = opts.hl || highlightMsg; hlFn = hl;
    Clips.unlock();
    if (tokens.some(function (t) { return hasClip(t.audio); })) Speech.unlock();
    var segs = [];
    tokens.forEach(function (t, i) {
      var ix = idx ? idx[i] : -1;
      if (hasClip(t.audio)) segs.push({ audio: t.audio, tok: t, idx: ix });
      else {
        var last = segs[segs.length - 1];
        if (opts.each || !last || last.audio) { last = { parts: [] }; segs.push(last); }
        last.parts.push({ text: (t.say || t.text) + (t.punct || ""), idx: ix });
      }
    });
    function next(k) {
      if (my !== seq) return;
      if (k >= segs.length) { hl(-1); return; }
      var sg = segs[k];
      if (sg.audio) {
        hl(sg.idx);
        Clips.play(sg.audio).then(function (ok) {
          if (my !== seq) return;
          if (ok) next(k + 1); else speakParts([{ text: sg.tok.say || sg.tok.text, idx: sg.idx }], function () { next(k + 1); });
        });
      } else speakParts(sg.parts, function () { next(k + 1); });
    }
    function speakParts(parts, done) {
      var text = "", starts = [];
      parts.forEach(function (p, i) { if (i) text += " "; starts.push(text.length); text += p.text; });
      if (parts.length) hl(parts[0].idx);
      Speech.speak(text, {
        onboundary: function (ci) { if (my !== seq) return; var j = 0; for (var i = 0; i < starts.length; i++) if (ci >= starts[i]) j = i; hl(parts[j].idx); },
        onend: function () { if (my === seq) done(); }
      });
    }
    next(0);
  }

  /* ------------------------------------------------------------ message bar */
  var msg = { tokens: [], buf: "" };
  function highlightMsg(i) {
    if (!settings.highlight) i = -1;
    var toks = $("msg").querySelectorAll(".tok");
    for (var k = 0; k < toks.length; k++) toks[k].classList.toggle("now", k === i);
  }
  function renderMsg() {
    var m = $("msg"); m.textContent = "";
    msg.tokens.forEach(function (t) { m.appendChild(el("span", "tok", (t.typed ? caseTyped(t.text) : caseWord(t.text)) + (t.punct || ""))); });
    if (state.view === "keyboard" || msg.buf) {
      var b = el("span", "buf", msg.buf ? caseTyped(msg.buf) : "");
      if (state.view === "keyboard") b.appendChild(el("span", "caret"));
      m.appendChild(b);
    }
    m.scrollTop = m.scrollHeight;
  }
  function tokenFromWord(w) { return { text: w.label, say: w.say || (w.type !== "folder" ? SAY_DEFAULTS[String(w.label).toLowerCase()] : null), audio: w.audio, id: w.id, typed: false }; }
  function tokenFromTyped(text) { var w = wordByLabel[text.toLowerCase()]; return { text: text.toLowerCase(), say: sayFor(text), audio: w && w.audio, id: w ? w.id : null, typed: true }; }
  function commitBuf(speakIt) {
    if (!msg.buf) return null;
    var t = tokenFromTyped(msg.buf);
    msg.buf = ""; msg.tokens.push(t); logUse(t.text);
    if (speakIt) talk([t], [msg.tokens.length - 1]);
    return t;
  }
  function addWord(w) {
    commitBuf(false);
    var t = tokenFromWord(w);
    msg.tokens.push(t); logUse(w.label); renderMsg();
    talk([t], [msg.tokens.length - 1]);
  }
  function speakMessage() {
    commitBuf(false); renderMsg();
    if (msg.tokens.length) talk(msg.tokens, msg.tokens.map(function (_, i) { return i; }));
  }
  function del() {
    stopAll();
    var lastTok = msg.tokens[msg.tokens.length - 1];
    if (!msg.buf && lastTok && lastTok.punct) delete lastTok.punct;   // delete takes off "." / "?" first
    else if (state.view === "keyboard") {
      if (!msg.buf && msg.tokens.length && msg.tokens[msg.tokens.length - 1].typed) msg.buf = msg.tokens.pop().text;
      if (msg.buf) msg.buf = msg.buf.slice(0, -1); else msg.tokens.pop();
    } else { if (msg.buf) msg.buf = ""; else msg.tokens.pop(); }
    renderMsg(); renderPreds();
  }
  function clearMsg() { stopAll(); msg.tokens = []; msg.buf = ""; renderMsg(); renderPreds(); }

  /* ------------------------------------------------------------ usage log (opt-in, local only) */
  function logUse(word) {
    if (!settings.logEnabled) return;
    var log = readJSON(LS.log, []);
    log.push({ t: new Date().toISOString(), w: String(word).toLowerCase() });
    if (log.length > 20000) log = log.slice(-20000);
    writeJSON(LS.log, log);
  }

  /* ------------------------------------------------------------ taps */
  var lastTap = { key: null, t: 0 };
  function guard(key) {
    var now = Date.now(), ms = +settings.tapGuardMs || 0;
    if (ms && lastTap.key === key && now - lastTap.t < ms) return false;
    lastTap = { key: key, t: now }; return true;
  }
  /* A press counts when the finger LIFTS, however long it was held, as long as it is still
     on the button or within PRESS_SLOP px of it. Children press slowly, hold and wiggle, so we
     don't rely on the browser's "click" (iOS drops it after a long press or a few px of movement).
     opts.scroll: the button sits in a scrolling area, so let the browser pan (a pan cancels the press). */
  var PRESS_SLOP = 28;
  function onTap(node, key, fn, opts) {
    opts = opts || {};
    var pid = null, upAt = 0;
    function fire(e) { if (!guard(key)) return; Clips.unlock(); fn(e); }
    function near(e) {
      var r = node.getBoundingClientRect();
      return e.clientX >= r.left - PRESS_SLOP && e.clientX <= r.right + PRESS_SLOP &&
             e.clientY >= r.top - PRESS_SLOP && e.clientY <= r.bottom + PRESS_SLOP;
    }
    function end() { pid = null; upAt = Date.now(); node.classList.remove("pressed"); }
    node.style.touchAction = opts.scroll ? "pan-y" : "none";
    node.addEventListener("pointerdown", function (e) {
      if (pid !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
      pid = e.pointerId; node.classList.add("pressed");
      if (!opts.scroll && node.setPointerCapture) { try { node.setPointerCapture(pid); } catch (x) { /* ignore */ } }
    });
    node.addEventListener("pointerup", function (e) {
      if (e.pointerId !== pid) return;
      var ok = near(e); end();
      if (ok) { e.preventDefault(); fire(e); }
    });
    node.addEventListener("pointercancel", function (e) { if (e.pointerId === pid) end(); });
    // Stop iOS long-press callouts, text selection and the magnifier from taking over the touch.
    if (!opts.scroll) node.addEventListener("touchstart", function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false });
    // Keyboard, switch access and screen readers still send a plain click; ignore the click that
    // follows a pointer press we already handled (or rejected).
    node.addEventListener("click", function (e) {
      e.preventDefault();
      if (e.detail !== 0 && (pid !== null || Date.now() - upAt < 1000)) return;   // detail 0 = keyboard / assistive tech
      fire(e);
    });
  }

  /* ------------------------------------------------------------ views */
  var state = { view: "words", page: "home", story: null, storyPage: 0 };
  function render() {
    var board = $("board"); board.textContent = "";
    $("nav-home").classList.toggle("on", state.view === "words" && state.page === "home");
    $("nav-kbd").classList.toggle("on", state.view === "keyboard");
    $("nav-stories").classList.toggle("on", state.view === "stories");
    if (state.view === "keyboard") { $("page-title").textContent = "spelling"; renderKeyboard(board); }
    else if (state.view === "stories") renderStories(board);
    else { var p = pageById[state.page] || pageById.home; state.page = p.id; $("page-title").textContent = p.id === "home" ? "" : p.title; renderPage(board, p); }
    renderMsg();
    fitLabels(board);
  }
  function renderPage(board, p) {
    var g = el("div", "grid" + (wordsShownMode() !== "full" ? " masking" : ""));
    g.style.gridTemplateColumns = "repeat(" + p.cols + ", 1fr)";
    g.style.gridTemplateRows = "repeat(" + p.rows + ", 1fr)";
    for (var r = 1; r <= p.rows; r++) for (var c = 1; c <= p.cols; c++) {
      var w = cellMap[p.id][r + "," + c], cell;
      if (!isShown(w, p.id)) { cell = el("div", "cell blank" + (w ? " masked" : "")); cell.setAttribute("aria-hidden", "true"); }
      else cell = wordButton(w);
      cell.style.gridRow = r; cell.style.gridColumn = c;
      g.appendChild(cell);
    }
    board.appendChild(g);
  }
  function picFor(item) {
    if (!settings.showPictures) return null;
    var url = item.image && mediaURL(item.image);
    if (url) { var img = el("img", "pic"); img.src = url; img.alt = ""; img.draggable = false; return img; }
    if (item.emoji) return el("span", "emo", item.emoji);
    return null;
  }
  function wordButton(w) {
    var b = el("button", "cell btn t-" + (w.type || "noun")); b.type = "button";
    var pic = picFor(w);
    if (pic) b.appendChild(pic); else b.classList.add("nopic");
    b.appendChild(el("span", "lbl", caseWord(w.label)));
    b.setAttribute("aria-label", w.label + (w.type === "folder" ? " folder" : ""));
    onTap(b, "w:" + w.id, function () {
      if (w.type === "folder") { stopAll(); state.page = w.target; render(); return; }
      addWord(w);
      if (settings.returnHome && state.page !== "home") { state.page = "home"; render(); }
    });
    return b;
  }

  /* keyboard: A–Z in alphabetical order + space, prediction row on top */
  var LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  function renderKeyboard(board) {
    var k = el("div", "kbd"), preds = el("div", "preds"), keys = el("div", "keys");
    preds.id = "preds";
    LETTERS.forEach(function (L) {
      var b = el("button", "cell btn t-key key nopic"); b.type = "button"; b.setAttribute("aria-label", L);
      b.appendChild(el("span", "lbl", caseKey(L)));
      onTap(b, "k:" + L, function () { typeLetter(L.toLowerCase()); });
      keys.appendChild(b);
    });
    [[".", "period"], ["?", "question mark"]].forEach(function (pk) {
      var b = el("button", "cell btn t-key key punct nopic"); b.type = "button"; b.setAttribute("aria-label", pk[1]);
      b.appendChild(el("span", "lbl", pk[0]));
      onTap(b, "k:" + pk[0], function () { punct(pk[0]); });
      keys.appendChild(b);
    });
    var sp = el("button", "cell btn t-key key space nopic"); sp.type = "button"; sp.setAttribute("aria-label", "space");
    sp.style.gridColumn = "1 / -1";
    sp.appendChild(el("span", "lbl", "space"));
    onTap(sp, "k:space", space);
    keys.appendChild(sp);
    k.appendChild(preds); k.appendChild(keys); board.appendChild(k);
    renderPreds();
  }
  function typeLetter(ch) {
    msg.buf += ch; renderMsg(); renderPreds();
    if (settings.sayLetters) { stopAll(); Speech.speak(LETTER_NAMES[ch] || ch); }
  }
  function space() { if (!msg.buf) return; commitBuf(true); renderMsg(); renderPreds(); }
  /* "." or "?" ends the last word (typed or from the board). It shows in the message bar and is
     kept in the spoken text, so the voice uses question intonation. */
  function punct(ch) {
    commitBuf(false);
    var t = msg.tokens[msg.tokens.length - 1];
    if (t) t.punct = ch;
    renderMsg(); renderPreds();
  }
  function predictionList(prefix) {
    if (!prefix) return [];
    var seen = {}, out = [];
    function add(x) { x = String(x).toLowerCase(); if (!seen[x] && x.indexOf(prefix) === 0) { seen[x] = 1; out.push(x); } }
    config.words.forEach(function (w) { if (w.type !== "folder" && isShown(w)) add(w.label); });
    (config.knownWords || []).forEach(add);
    out.sort(function (a, b) { return (a === prefix ? -1 : b === prefix ? 1 : 0) || a.length - b.length || (a < b ? -1 : 1); });
    return out.slice(0, 6);
  }
  function renderPreds() {
    var p = $("preds"); if (!p) return;
    p.textContent = "";
    var list = settings.prediction ? predictionList(msg.buf) : [];
    for (var i = 0; i < 6; i++) {
      var word = list[i];
      if (!word) { p.appendChild(el("div", "cell pred empty")); continue; }
      var b = el("button", "cell btn t-pred pred nopic"); b.type = "button";
      b.appendChild(el("span", "lbl", caseTyped(word)));
      (function (wd) { onTap(b, "p:" + wd, function () { msg.buf = wd; commitBuf(true); renderMsg(); renderPreds(); }); })(word);
      p.appendChild(b);
    }
    fitLabels(p);
  }

  /* ------------------------------------------------------------ stories
     Rule: turning a page is SILENT. Speech only when a word or the read button is tapped. */
  var ARROW_L = '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="70,8 18,50 70,92" fill="currentColor"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="30,8 82,50 30,92" fill="currentColor"/></svg>';
  /* Page picture, best first: a photo/picture ("pic" or "image": pack media or a URL),
     then a "scene" (array of emoji laid out together; the main subject is drawn bigger: the first,
     or the index in "sceneMain", -1 for none),
     then a single "emoji". */
  function pageScene(pg) {
    return Array.isArray(pg.scene) ? pg.scene.filter(function (x) { return typeof x === "string" && x.trim(); }).slice(0, 6) : [];
  }
  function storyArt(pg) {
    var url = mediaURL(pg.pic || pg.image);
    if (url) { var img = el("img"); img.src = url; img.alt = ""; img.draggable = false; return img; }
    var sc = pageScene(pg);
    if (sc.length > 1) {
      var box = el("div", "scene"); box.style.setProperty("--n", sc.length);
      var main = typeof pg.sceneMain === "number" ? pg.sceneMain : 0;   // -1 = all the same size
      sc.forEach(function (e, k) { box.appendChild(el("span", "semo" + (k === main ? " main" : ""), e)); });
      return box;
    }
    if (sc.length || pg.emoji) return el("span", "semo", sc[0] || pg.emoji);
    return null;
  }
  /* Choose columns/rows so every story tile is visible without scrolling when possible (max 3 rows).
     Returns true when all tiles fit. */
  function layoutStoryList(list, board) {
    var n = Math.max(1, stories.length), W = board.clientWidth || 800, H = board.clientHeight || 900, best = null;
    for (var c = 2; c <= 5; c++) {
      var r = Math.min(Math.ceil(n / c), 3), size = Math.min(W / c, (H / r) * 0.9), fit = n <= c * r;
      if (!best || (fit && !best.fit) || (fit === best.fit && size > best.size + 1)) best = { c: c, r: r, size: size, fit: fit };
    }
    list.style.gridTemplateColumns = "repeat(" + best.c + ", minmax(0, 1fr))";
    list.style.gridAutoRows = "calc((100% - " + (best.r - 1) + " * var(--gap)) / " + best.r + ")";
    return n <= best.c * best.r;
  }
  function storyById(id) { return stories.filter(function (s) { return s.id === id; })[0] || null; }
  function renderStories(board) {
    var st = state.story && storyById(state.story);
    if (!st) {
      state.story = null; $("page-title").textContent = "stories";
      var list = el("div", "story-list");
      board.appendChild(list);
      var fits = layoutStoryList(list, board);
      stories.forEach(function (s) {
        var b = el("button", "cell btn t-story"); b.type = "button";
        var p0 = s.pages[0] || {};
        var cover = picFor({ image: s.image || s.pic || p0.image || p0.pic, emoji: s.emoji });
        if (cover) b.appendChild(cover); else b.classList.add("nopic");
        b.appendChild(el("span", "lbl", s.title));
        onTap(b, "s:" + s.id, function () { stopAll(); state.story = s.id; state.storyPage = 0; render(); }, { scroll: !fits });
        list.appendChild(b);
      });
      if (!stories.length) list.appendChild(el("p", "note-dark", "No stories yet."));
      return;
    }
    var n = st.pages.length, i = Math.max(0, Math.min(state.storyPage, n - 1)); state.storyPage = i;
    var pg = st.pages[i];
    $("page-title").textContent = st.title;
    var wrap = el("div", "story");
    var back = el("button", "arrow back"); back.type = "button"; back.innerHTML = ARROW_L; back.setAttribute("aria-label", "previous page");
    var next = el("button", "arrow next"); next.type = "button"; next.innerHTML = ARROW_R; next.setAttribute("aria-label", "next page");
    back.disabled = i === 0; next.disabled = i === n - 1;
    onTap(back, "s:back", function () { if (state.storyPage > 0) { stopAll(); state.storyPage--; render(); } });
    onTap(next, "s:next", function () { if (state.storyPage < n - 1) { stopAll(); state.storyPage++; render(); } });
    var page = el("div", "spage");
    var picBox = el("div", "spic"), art = storyArt(pg);
    if (art) picBox.appendChild(art);
    page.appendChild(picBox);
    var text = el("div", "stext"), words = [];
    var re = /\S+/g, m;
    while ((m = re.exec(pg.text || ""))) words.push({ raw: m[0], start: m.index, clean: m[0].replace(/^[^\w']+|[^\w']+$/g, "") });
    words.forEach(function (w, k) {
      var b = el("button", "sword", w.raw); b.type = "button";
      onTap(b, "sw:" + i + ":" + k, function () {
        var cw = wordByLabel[w.clean.toLowerCase()];
        talk([{ text: w.clean, say: sayFor(w.clean), audio: cw && cw.audio }], [k], { hl: storyHl });
      });
      text.appendChild(b);
    });
    page.appendChild(text);
    var bar = el("div", "sbar");
    var all = el("button", "sbtn"); all.type = "button"; all.textContent = "☰ all stories";
    onTap(all, "s:all", function () { stopAll(); state.story = null; render(); });
    var count = el("div", "scount", (i + 1) + " / " + n);
    var read = el("button", "sbtn read"); read.type = "button"; read.innerHTML = '<span aria-hidden="true">▶</span> read'; read.setAttribute("aria-label", "read this page");
    onTap(read, "s:read", function () { readPage(pg.text || "", words); });
    bar.appendChild(all); bar.appendChild(count); bar.appendChild(read);
    page.appendChild(bar);
    wrap.appendChild(back); wrap.appendChild(page); wrap.appendChild(next);
    board.appendChild(wrap);
  }
  function storyHl(i) {
    if (!settings.highlight) i = -1;
    var ws = document.querySelectorAll(".stext .sword");
    for (var k = 0; k < ws.length; k++) ws[k].classList.toggle("now", k === i);
  }
  function readPage(text, words) {
    if (settings.storyMode === "word") {
      talk(words.map(function (w) { return { text: w.clean, say: sayFor(w.clean) }; }), words.map(function (_, k) { return k; }), { hl: storyHl, each: true });
      return;
    }
    stopAll();
    // Build the spoken sentence word by word so "say" forms apply and highlight offsets stay right.
    var spoken = "", starts = [];
    words.forEach(function (w, k) {
      var s = sayFor(w.clean), piece = s && w.clean ? w.raw.replace(w.clean, s) : w.raw;
      if (k) spoken += " "; starts.push(spoken.length); spoken += piece;
    });
    var my = seq; hlFn = storyHl; storyHl(0);
    Speech.speak(spoken || text, {
      onboundary: function (ci) { if (my !== seq) return; var j = 0; for (var k = 0; k < starts.length; k++) if (ci >= starts[k]) j = k; storyHl(j); },
      onend: function () { if (my === seq) storyHl(-1); }
    });
  }

  /* ------------------------------------------------------------ parent gate */
  function setupGate() {
    // Hold the gear for 2 s (a small wiggle is fine). Optional: 3 quick taps.
    var g = $("gear"), timer = null, taps = [], pid = null, x0 = 0, y0 = 0, t0 = 0;
    function open() { clearTimeout(timer); timer = null; pid = null; openSettings(); }
    function stop() { clearTimeout(timer); timer = null; pid = null; }
    g.style.touchAction = "none";
    g.addEventListener("touchstart", function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false });
    g.addEventListener("pointerdown", function (e) {
      e.preventDefault(); if (pid !== null) return;
      pid = e.pointerId; x0 = e.clientX; y0 = e.clientY; t0 = Date.now();
      if (g.setPointerCapture) { try { g.setPointerCapture(pid); } catch (x) { /* ignore */ } }
      clearTimeout(timer); timer = setTimeout(open, 2000);
    });
    g.addEventListener("pointermove", function (e) {
      if (e.pointerId === pid && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 60) stop();
    });
    g.addEventListener("pointerup", function (e) {
      if (e.pointerId !== pid) return;
      var quick = timer && Date.now() - t0 < 700; stop();
      if (!quick || !settings.gateTripleTap) return;
      var now = Date.now(); taps = taps.filter(function (t) { return now - t < 900; }); taps.push(now);
      if (taps.length >= 3) { taps = []; open(); }
    });
    g.addEventListener("pointercancel", function (e) { if (e.pointerId === pid) stop(); });
    g.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }

  /* ------------------------------------------------------------ settings panel */
  function openSettings() {
    stopAll();
    $("settings").hidden = false;
    fillVoiceSelect(); syncSettingsUI(); renderPackInfo(); renderVisibility(); renderStoryEditor();
    $("log-out").textContent = "";
  }
  function closeSettings() { $("settings").hidden = true; render(); }
  function fillVoiceSelect() {
    var sel = $("set-voice"); if (!sel) return;
    var cur = Speech.voice(), vs = Speech.voices.slice();
    sel.textContent = "";
    if (!settings.allVoices) vs = vs.filter(function (v) { return /^en/i.test(v.lang) && !NOVELTY.test(v.name); });
    vs.sort(function (a, b) {
      var au = /^en[-_]US/i.test(a.lang) ? 0 : 1, bu = /^en[-_]US/i.test(b.lang) ? 0 : 1;
      return au - bu || (a.lang < b.lang ? -1 : a.lang > b.lang ? 1 : 0) || (a.name < b.name ? -1 : 1);
    });
    var auto = el("option", null, "Automatic (best en-US voice" + (cur ? ": " + cur.name : "") + ")"); auto.value = ""; sel.appendChild(auto);
    vs.forEach(function (v) { var o = el("option", null, v.name + " (" + v.lang + ")" + (v.localService ? "" : " – online")); o.value = v.voiceURI; sel.appendChild(o); });
    sel.value = settings.voiceURI && vs.some(function (v) { return v.voiceURI === settings.voiceURI; }) ? settings.voiceURI : "";
    var note = $("voice-note");
    if (!Speech.synth) note.textContent = "This browser has no speech synthesis. Recorded clips still play.";
    else if (!Speech.voices.length) note.textContent = "No voices reported yet. On iPad they can take a moment to load; speech still uses the default en-US voice. For better voices: iPad Settings → Accessibility → Spoken Content → Voices → English → download an Enhanced or Premium voice, then reopen this app.";
    else note.textContent = Speech.voices.length + " voices on this device. For a more natural voice, download an Enhanced/Premium voice in iPad Settings → Accessibility → Spoken Content → Voices. Siri voices are not available to web apps.";
  }
  function syncSettingsUI() {
    $("set-rate").value = settings.rate; $("rate-val").textContent = (+settings.rate).toFixed(2);
    $("set-pitch").value = settings.pitch; $("pitch-val").textContent = (+settings.pitch).toFixed(2);
    $("set-volume").value = settings.volume; $("vol-val").textContent = Math.round(settings.volume * 100) + "%";
    $("set-wordcase").value = settings.wordCase; $("set-keycase").value = settings.keyCase; $("set-storymode").value = settings.storyMode;
    $("set-pictures").checked = !!settings.showPictures; $("set-prediction").checked = !!settings.prediction;
    $("set-sayletters").checked = !!settings.sayLetters; $("set-highlight").checked = !!settings.highlight;
    $("set-returnhome").checked = !!settings.returnHome; $("set-triple").checked = !!settings.gateTripleTap;
    $("set-log").checked = !!settings.logEnabled; $("set-allvoices").checked = !!settings.allVoices;
    $("set-tapguard").value = String(settings.tapGuardMs);
    $("set-wordsshown").value = wordsShownMode(); $("set-levelfolders").checked = !!settings.levelInFolders;
    var hc = shownCount("home"), dm = config.wordsShown && LEVELS[config.wordsShown] ? config.wordsShown : "full";
    $("level-note").textContent = "Home shows " + hc[0] + " of " + hc[1] + " words. Hidden words leave their cell empty, so no button ever moves. " +
      (settings.wordsShown ? "Saved on this device; importing a pack keeps it." : "Not chosen yet, so this pack's default (" + dm + ") is used.");
    var sw = navigator.serviceWorker && navigator.serviceWorker.controller;
    $("about").textContent = "Word Board " + APP_VERSION + ". Offline copy: " + (sw ? "installed (works without Wi-Fi)" :
      location.protocol === "file:" ? "not available when opened as a file" :
      window.AAC_SINGLE_FILE ? "single-file build (no service worker)" :
      window.isSecureContext ? "not installed yet (reload once)" : "not available: needs https:// or localhost") + ".";
  }
  function bindSettings() {
    $("set-close").addEventListener("click", closeSettings);
    $("set-voice").addEventListener("change", function () {
      var uri = this.value, v = Speech.voices.filter(function (x) { return x.voiceURI === uri; })[0];
      settings.voiceURI = uri; settings.voiceName = v ? v.name : ""; saveSettings();
    });
    $("set-allvoices").addEventListener("change", function () { settings.allVoices = this.checked; saveSettings(); fillVoiceSelect(); });
    [["set-rate", "rate"], ["set-pitch", "pitch"], ["set-volume", "volume"]].forEach(function (p) {
      $(p[0]).addEventListener("input", function () { settings[p[1]] = +this.value; saveSettings(); syncSettingsUI(); });
    });
    $("set-test").addEventListener("click", function () { Speech.speak("I want more milk, please."); });
    [["set-wordcase", "wordCase"], ["set-keycase", "keyCase"], ["set-storymode", "storyMode"]].forEach(function (p) {
      $(p[0]).addEventListener("change", function () { settings[p[1]] = this.value; saveSettings(); renderVisibility(); });
    });
    $("set-tapguard").addEventListener("change", function () { settings.tapGuardMs = +this.value; saveSettings(); });
    $("set-wordsshown").addEventListener("change", function () { setWordsShown(this.value); syncSettingsUI(); renderVisibility(); });
    $("set-levelfolders").addEventListener("change", function () { settings.levelInFolders = this.checked; saveSettings(); syncSettingsUI(); renderVisibility(); });
    [["set-pictures", "showPictures"], ["set-prediction", "prediction"], ["set-sayletters", "sayLetters"], ["set-highlight", "highlight"],
     ["set-returnhome", "returnHome"], ["set-triple", "gateTripleTap"], ["set-log", "logEnabled"]].forEach(function (p) {
      $(p[0]).addEventListener("change", function () { settings[p[1]] = this.checked; saveSettings(); });
    });
    // pack
    $("pack-import").addEventListener("change", function () {
      var f = this.files && this.files[0], input = this; if (!f) return;
      f.arrayBuffer().then(function (ab) { return importPack(ab, f.name); })
        .catch(function (e) { packMsg("Import failed: " + (e && e.message || e)); })
        .then(function () { input.value = ""; });
    });
    $("pack-export").addEventListener("click", function () { exportPack(false); });
    $("pack-share").addEventListener("click", function () { exportPack(true); });
    $("pack-remove").addEventListener("click", removePack);
    // photos
    $("photo-input").addEventListener("change", onPhotoChosen);
    // log
    $("log-view").addEventListener("click", showLog);
    $("log-csv").addEventListener("click", function () {
      var rows = readJSON(LS.log, []).map(function (e) { return e.t + "," + JSON.stringify(e.w); });
      saveFile("word-board-usage-" + today() + ".csv", new Blob(["timestamp_utc,word\n" + rows.join("\n") + "\n"], { type: "text/csv" }), false);
    });
    $("log-json").addEventListener("click", function () {
      saveFile("word-board-usage-" + today() + ".json", new Blob([JSON.stringify(readJSON(LS.log, []), null, 1)], { type: "application/json" }), false);
    });
    $("log-clear").addEventListener("click", function () { if (confirm("Delete the whole usage log on this device?")) { localStorage.removeItem(LS.log); showLog(); } });
  }

  /* ---------- personal pack import / export ---------- */
  function packMsg(t) { $("pack-msg").textContent = t; }
  function renderPackInfo() {
    var info = $("pack-info");
    var nMedia = Object.keys(media).length;
    info.textContent = pack ?
      "Personal pack loaded: “" + (pack.name || "pack") + "” – " + config.words.length + " words, " + ((pack.stories || []).length) + " own stories, " + nMedia + " photos/recordings. Stored only on this device." :
      "No personal pack. Showing the generic starter board. Import a pack (.zip or .json) from the Files app.";
    var pr = $("config-problems"); pr.textContent = "";
    problems.forEach(function (m) { pr.appendChild(el("div", null, "⚠ " + m)); });
  }
  function b64ToBuf(dataUrl) {
    var m = /^data:([^;,]*)(;base64)?,(.*)$/.exec(dataUrl); if (!m) return null;
    var bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return { type: m[1] || "application/octet-stream", data: u8.buffer };
  }
  function importPack(ab, filename) {
    var u8 = new Uint8Array(ab), isZip = u8[0] === 0x50 && u8[1] === 0x4b;
    var p = isZip ? Zip.read(ab).then(function (files) {
      var pj = files.filter(function (f) { return /(^|\/)pack\.json$/i.test(f.name); }).sort(function (a, b) { return a.name.length - b.name.length; })[0];
      if (!pj) throw new Error("pack.json not found in the zip.");
      var prefix = pj.name.slice(0, pj.name.length - "pack.json".length);
      var data = JSON.parse(new TextDecoder().decode(pj.data)), med = {};
      files.forEach(function (f) {
        if (f === pj || f.name.indexOf(prefix) !== 0) return;
        var key = f.name.slice(prefix.length);
        if (/\.(md|txt|json)$/i.test(key)) return;
        med[key] = { type: Zip.typeOf(key), data: f.data.buffer.slice(f.data.byteOffset, f.data.byteOffset + f.data.byteLength) };
      });
      return { data: data, media: med };
    }) : Promise.resolve().then(function () {
      var data = JSON.parse(new TextDecoder().decode(u8)), med = {};
      Object.keys(data.media || {}).forEach(function (k) { var v = b64ToBuf(data.media[k]); if (v) med[k] = v; });
      delete data.media;
      return { data: data, media: med };
    });
    return p.then(function (r) {
      var d = r.data;
      if (d && Array.isArray(d.pages) && Array.isArray(d.words)) d = { config: d };   // bare config also accepted
      if (!d || !d.config || !Array.isArray(d.config.pages) || !Array.isArray(d.config.words)) throw new Error("This file is not a Word Board pack (needs config.pages and config.words).");
      if (pack && !confirm("Replace the personal pack on this device with “" + (d.name || filename) + "”? (Export a backup first if you changed photos here.)")) return;
      var np = { format: "wordboard-pack", version: 1, name: d.name || filename.replace(/\.(zip|json)$/i, ""), created: d.created || new Date().toISOString(),
        imported: new Date().toISOString(), config: d.config, stories: d.stories || [], includeSampleStories: d.includeSampleStories !== false };
      return Store.clear("media").then(function () {
        return Promise.all(Object.keys(r.media).map(function (k) { return Store.put("media", k, r.media[k]); }));
      }).then(function () { return Store.put("kv", "pack", np); }).then(function () {
        pack = np; media = r.media; resetMediaUrls(); Clips.reset();
        localStorage.removeItem(LS.hidden);
        loadConfig(); state.page = "home"; state.story = null;
        return Store.persist();
      }).then(function (persisted) {
        renderPackInfo(); renderVisibility(); renderStoryEditor();
        packMsg("Imported “" + pack.name + "”: " + config.words.length + " words, " + stories.length + " stories, " + Object.keys(media).length + " media files." +
          (persisted ? " Storage marked as persistent." : "") + (problems.length ? " See problems listed above." : ""));
      });
    });
  }
  function currentPackForExport() {
    var p = clone(pack || ensurePackCopy());
    p.config = clone(config); // includes hide/show state
    p.exported = new Date().toISOString(); p.app = "Word Board " + APP_VERSION;
    return p;
  }
  function ensurePackCopy() { return { format: "wordboard-pack", version: 1, name: "My pack", config: clone(config), stories: [], includeSampleStories: true }; }
  function exportPack(share) {
    var p = currentPackForExport(), enc = new TextEncoder();
    var files = [{ name: "pack.json", data: enc.encode(JSON.stringify(p, null, 2)) }];
    Object.keys(media).forEach(function (k) { files.push({ name: k, data: new Uint8Array(media[k].data) }); });
    var name = "word-board-pack-" + today() + ".zip";
    saveFile(name, Zip.write(files), share);
  }
  function saveFile(name, blob, share) {
    if (share) {
      try {
        var file = new File([blob], name, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(function () {}); return; }
      } catch (e) {}
      packMsg("Sharing isn't supported here; downloading instead.");
    }
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 5000);
    packMsg("Saved " + name + ". On iPad look in Files → Downloads. If nothing happened, use “Share / Save to Files”.");
  }
  function removePack() {
    if (!confirm("Remove the personal pack (words, stories, photos, recordings) from this device? Export a backup first. The generic board will show.")) return;
    Promise.all([Store.del("kv", "pack"), Store.clear("media")]).catch(function () {}).then(function () {
      pack = null; media = {}; resetMediaUrls(); Clips.reset(); localStorage.removeItem(LS.hidden);
      loadConfig(); state.page = "home"; state.story = null;
      renderPackInfo(); renderVisibility(); renderStoryEditor(); packMsg("Personal pack removed.");
    });
  }

  /* ---------- word visibility + photos ---------- */
  function editMode() { var r = document.querySelector('input[name="edit-mode"]:checked'); return r ? r.value : "hide"; }
  function renderVisibility() {
    var box = $("vis-pages"); box.textContent = "";
    config.pages.forEach(function (p) {
      var wrap = el("div", "vis-page");
      wrap.appendChild(el("h3", null, p.title + "  (" + p.rows + " × " + p.cols + ", page id \"" + p.id + "\")"));
      var g = el("div", "vis-grid"); g.style.gridTemplateColumns = "repeat(" + p.cols + ", 1fr)";
      for (var r = 1; r <= p.rows; r++) for (var c = 1; c <= p.cols; c++) {
        var w = cellMap[p.id][r + "," + c], cell;
        if (!w) cell = el("div", "vis-cell empty", "r" + r + " c" + c);
        else {
          cell = el("button", "vis-cell t-" + (w.type || "noun") + (isShown(w, p.id) ? "" : " hid")); cell.type = "button";
          var u = w.image && mediaURL(w.image);
          if (u) { var im = el("img"); im.src = u; im.alt = ""; cell.appendChild(im); }
          cell.appendChild(el("span", null, caseWord(w.label)));
          if (w.type !== "folder") cell.appendChild(el("small", "lv", "L" + wordLevel(w)));
          cell.title = "row " + r + ", col " + c + (w.type !== "folder" ? ", level " + wordLevel(w) : "");
          (function (word) { cell.addEventListener("click", function () { onVisCell(word); }); })(w);
        }
        g.appendChild(cell);
      }
      wrap.appendChild(g); box.appendChild(wrap);
    });
  }
  function onVisCell(w) {
    var mode = editMode();
    if (mode === "hide" && w.type === "folder") {
      w.hidden = !w.hidden;
      var h = readJSON(LS.hidden, {}); h[w.id] = w.hidden; writeJSON(LS.hidden, h);
      renderVisibility();
    } else if (mode === "hide") {
      // Picking words one by one = Custom. Starting from a level copies what that level shows.
      var now = isShown(w, w.page);
      if (wordsShownMode() !== "custom") { customVis = { base: LEVELS[wordsShownMode()] || 3, shown: {} }; settings.wordsShown = "custom"; saveSettings(); }
      customVis.shown[w.id] = !now; writeJSON(LS.custom, customVis);
      syncSettingsUI(); renderVisibility();
    } else if (mode === "photo") { pendingPhoto = { kind: "word", id: w.id }; $("photo-input").click(); }
    else if (mode === "nophoto") {
      if (!w.image) return;
      ensurePack();
      var pw = pack.config.words.filter(function (x) { return x.id === w.id; })[0];
      var old = pw && pw.image; if (pw) delete pw.image;
      savePack().then(function () { return dropMediaIfUnused(old); }).then(afterEdit);
    }
  }
  var pendingPhoto = null;
  function onPhotoChosen() {
    var f = this.files && this.files[0], input = this, target = pendingPhoto; pendingPhoto = null;
    if (!f || !target) return;
    packMsg("Adding photo…");
    resizeImage(f, 640).then(function (buf) {
      ensurePack();
      var key = "photos/" + (target.kind === "word" ? target.id : target.story + "-p" + (target.page + 1)) + "-" + Date.now() + ".jpg", old;
      if (target.kind === "word") {
        var pw = pack.config.words.filter(function (x) { return x.id === target.id; })[0];
        if (!pw) throw new Error("word not found");
        old = pw.image; pw.image = key;
      } else {
        var s = ownStory(target.story); old = s.pages[target.page].image; s.pages[target.page].image = key;
      }
      media[key] = { type: "image/jpeg", data: buf };
      return Store.put("media", key, media[key]).then(savePack).then(function () { return dropMediaIfUnused(old); });
    }).then(function () { afterEdit(); packMsg("Photo saved on this device."); })
      .catch(function (e) { packMsg("Photo failed: " + (e && e.message || e)); })
      .then(function () { input.value = ""; });
  }
  function afterEdit() { loadConfig(); renderPackInfo(); renderVisibility(); renderStoryEditor(); }
  function mediaInUse(key) {
    var used = false;
    (pack && pack.config.words || []).forEach(function (w) { if (w.image === key || w.audio === key) used = true; });
    (pack && pack.stories || []).forEach(function (s) { if (s.image === key) used = true; s.pages.forEach(function (p) { if (p.image === key || p.pic === key) used = true; }); });
    return used;
  }
  function dropMediaIfUnused(key) {
    if (!key || !media[key] || mediaInUse(key)) return Promise.resolve();
    delete media[key]; if (mediaUrls[key]) { URL.revokeObjectURL(mediaUrls[key]); delete mediaUrls[key]; }
    return Store.del("media", key).catch(function () {});
  }
  function resizeImage(file, max) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var cv = document.createElement("canvas"); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
        var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob(function (b) { if (!b) return rej(new Error("could not encode image")); b.arrayBuffer().then(res, rej); }, "image/jpeg", 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("could not read that image")); };
      img.src = url;
    });
  }

  /* ---------- story photos ---------- */
  function ownStory(id) {
    ensurePack();
    pack.stories = pack.stories || [];
    var s = pack.stories.filter(function (x) { return x.id === id; })[0];
    if (!s) { s = clone(storyById(id)); pack.stories.push(s); }   // copy a sample story into the pack so it can be edited
    return s;
  }
  function renderStoryEditor() {
    var box = $("story-edit"); box.textContent = "";
    stories.forEach(function (s) {
      var own = pack && (pack.stories || []).some(function (x) { return x.id === s.id; });
      var d = el("details"), sum = el("summary", null, s.title + (own ? "" : "  (sample story)"));
      d.appendChild(sum);
      s.pages.forEach(function (pg, i) {
        var row = el("div", "story-row");
        var u = mediaURL(pg.image || pg.pic);
        if (u) { var im = el("img"); im.src = u; im.alt = ""; row.appendChild(im); } else row.appendChild(el("span", "semo-sm", pageScene(pg).join("") || pg.emoji || "·"));
        row.appendChild(el("span", "story-txt", (i + 1) + ". " + pg.text));
        var add = el("button", "pbtn", u ? "Change photo" : "Add photo"); add.type = "button";
        add.addEventListener("click", function () { pendingPhoto = { kind: "story", story: s.id, page: i }; $("photo-input").click(); });
        row.appendChild(add);
        if (pg.image) {
          var rm = el("button", "pbtn warn", "Remove photo"); rm.type = "button";
          rm.addEventListener("click", function () { var st = ownStory(s.id), old = st.pages[i].image; delete st.pages[i].image; savePack().then(function () { return dropMediaIfUnused(old); }).then(afterEdit); });
          row.appendChild(rm);
        }
        d.appendChild(row);
      });
      box.appendChild(d);
    });
  }

  /* ---------- usage log ---------- */
  function showLog() {
    var out = $("log-out"); out.textContent = "";
    var log = readJSON(LS.log, []);
    if (!log.length) { out.appendChild(el("p", "note", settings.logEnabled ? "Log is on, nothing recorded yet." : "Log is empty (logging is off).")); return; }
    var counts = {}; log.forEach(function (e) { counts[e.w] = (counts[e.w] || 0) + 1; });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 20);
    out.appendChild(el("p", "note", log.length + " entries since " + new Date(log[0].t).toLocaleString() + ". Most used: " + top.map(function (w) { return w + " (" + counts[w] + ")"; }).join(", ")));
    var t = el("table"), hr = el("tr"); hr.appendChild(el("th", null, "time")); hr.appendChild(el("th", null, "word")); t.appendChild(hr);
    log.slice(-200).reverse().forEach(function (e) { var tr = el("tr"); tr.appendChild(el("td", null, new Date(e.t).toLocaleString())); tr.appendChild(el("td", null, e.w)); t.appendChild(tr); });
    out.appendChild(el("p", "note", "Newest 200:")); out.appendChild(t);
  }

  /* ------------------------------------------------------------ boot */
  function start() {
    loadConfig();
    Speech.init();
    onTap($("btn-speak"), "a:speak", speakMessage);
    onTap($("btn-del"), "a:del", del);
    onTap($("btn-clear"), "a:clear", clearMsg);
    onTap($("msg"), "a:msg", speakMessage, { scroll: true });   // the message bar scrolls when long
    onTap($("nav-home"), "n:home", function () { stopAll(); commitBuf(false); state.view = "words"; state.page = "home"; render(); });
    onTap($("nav-kbd"), "n:kbd", function () { stopAll(); state.view = "keyboard"; render(); });
    onTap($("nav-stories"), "n:stories", function () { stopAll(); commitBuf(false); state.story = null; state.storyPage = 0; state.view = "stories"; render(); });
    setupGate(); bindSettings();
    document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
    $("app").addEventListener("contextmenu", function (e) { e.preventDefault(); });
    $("app").addEventListener("touchmove", function (e) { if (!e.target.closest("#msg, .story-list")) e.preventDefault(); }, { passive: false });
    document.addEventListener("pointerdown", function () { Clips.unlock(); }, { capture: true, passive: true });
    // iPad rotation: Safari fires "resize" before the new layout settles, so a single
    // refit can measure the old (landscape) button size and keep the huge labels.
    // Refit whenever the board itself changes size, plus a few delayed passes after rotating.
    var rz = 0, rzT = [];
    function refit() { cancelAnimationFrame(rz); rz = requestAnimationFrame(function () { var sl = $("board").querySelector(".story-list"); if (sl) layoutStoryList(sl, $("board")); fitLabels($("board")); }); }
    function refitSoon() { refit(); rzT.forEach(clearTimeout); rzT = [150, 400, 900].map(function (ms) { return setTimeout(refit, ms); }); }
    window.addEventListener("resize", refitSoon);
    window.addEventListener("orientationchange", refitSoon);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", refitSoon);
    if (window.ResizeObserver) new ResizeObserver(refit).observe($("board"));
    render();
    if ("serviceWorker" in navigator && !window.AAC_SINGLE_FILE && window.isSecureContext && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(function (e) { console.info("offline support not available:", e && e.message); });
    }
    window.WB = { state: state, msg: msg, settings: settings, get config() { return config; }, get stories() { return stories; }, get pack() { return pack; },
      problems: function () { return problems; }, openSettings: openSettings, predictionList: predictionList, importPack: importPack };
  }
  function boot() {
    // Load the on-device pack BEFORE the first paint so buttons never jump from the generic layout.
    var done = false;
    function go() { if (done) return; done = true; start(); }
    setTimeout(go, 2500);
    if (!Store) return go();
    Store.get("kv", "pack").then(function (p) { pack = p || null; return Store.all("media"); })
      .then(function (m) { media = m || {}; }, function (e) { console.info("on-device storage unavailable:", e && e.message); })
      .then(go);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
