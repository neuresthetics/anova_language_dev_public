#!/usr/bin/env node
/* Paths checks. Walks whatever AAC_PATHS.patterns lists — no frozen title list.
   Usage: node tools/paths-check.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const context = { console };
context.globalThis = context;
context.self = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "words.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "paths.js"), "utf8"), context);

const words = context.AAC_DEFAULT_CONFIG.words;
const P = context.AAC_PATHS;
const byId = {};
words.forEach(function (w) { byId[w.id] = w; });
let failed = 0;
function assert(cond, msg) {
  if (cond) return;
  failed++;
  console.error("FAIL:", msg);
}
function ctx(level, extra) {
  return Object.assign({
    words: words,
    level: level,
    set: "auto",
    hideHiddenStem: true,
    hidden: function (w) { return !!(w && w.hidden); }
  }, extra || {});
}
function ids(level, extra) {
  return P.visible(ctx(level, extra)).map(function (p) { return p.id; });
}
function labels(patternId, step, c) {
  return P.choices(P.byId(patternId), step, c || ctx(5)).map(function (w) { return w.label; });
}

assert(P && P.patterns.length >= 12, "patterns loaded");
P.patterns.forEach(function (p) {
  assert(p.id && p.title && p.steps && p.steps.length, "pattern has id, title, steps");
  (p.steps || []).forEach(function (step, i) {
    (step.words || []).forEach(function (lab) {
      const w = P.lookup(lab, ctx(5));
      assert(w && !w._pathOnly && byId[w.id], p.id + " step " + i + " word missing: " + lab);
    });
  });
});

[1, 2, 3, 4, 5].forEach(function (level) {
  P.visible(ctx(level)).forEach(function (p) {
    assert(p.minLevel <= level, p.id + " visible at level " + level + " but minLevel " + p.minLevel);
    p.steps.forEach(function (step, i) {
      const ch = P.choices(p, i, ctx(level));
      if (!ch.length) {
        assert(!!step.optional, p.id + " step " + i + " empty at level " + level);
        return;
      }
      ch.forEach(function (w) {
        assert(w && !w._pathOnly && byId[w.id], p.id + " step " + i + " is not a board word: " + (w && w.label));
        assert(w.label && String(w.label).trim(), p.id + " blank label");
        if (step.fringe) {
          assert(!w.ending && w.type !== "folder", p.id + " fringe included " + w.label);
          const lv = +w.level || 3;
          assert(lv <= level || w.hidden, p.id + " fringe " + w.label + " is above level " + level);
        }
        if (step.endings) assert(step.endings.indexOf(w.ending) >= 0, p.id + " ending step returned " + w.label);
      });
    });
  });
});

assert(ids(1).length === 6, "starter menu " + ids(1).join(","));
assert(ids(2).length === 9, "middle menu " + ids(2).length + " " + ids(2).join(","));
assert(ids(3).length === 12, "expanded menu " + ids(3).length + " " + ids(3).join(","));
assert(ids(3).length <= 12, "expanded menu over 12");
assert(ids(4).length === 16, "sentences menu " + ids(4).length + " " + ids(4).join(","));
["dont_want", "who_what", "where_is"].forEach(function (id) { assert(ids(3).indexOf(id) >= 0, "expanded missing " + id); });
["can", "put", "want_please", "like_ing"].forEach(function (id) {
  assert(ids(3).indexOf(id) < 0, id + " should wait for Sentences");
  assert(ids(4).indexOf(id) >= 0, "sentences missing " + id);
});
assert(ids(2).indexOf("who_what") < 0 && ids(2).indexOf("dont_want") >= 0, "middle gating");
assert(ids(5, { set: "expanded" }).indexOf("can") < 0, "pattern set Expanded stops at expanded frames");
assert(ids(5, { set: "expanded" }).length === 12, "pattern set Expanded count");
assert(ids(1, { set: "all" }).length === P.patterns.length, "All patterns ignores word level for the menu");

assert(labels("who_what", 0).join("|") === "who|what", "who/what " + labels("who_what", 0));
assert(labels("who_what", 1).join("|") === "is", "is");
assert(labels("who_what", 2).join("|") === "it|that", "it/that " + labels("who_what", 2));
assert(P.byId("who_what").punct === "?" && P.byId("where_is").punct === "?", "questions carry ?");
const where = P.lookup("where?", ctx(5));
assert(where && where.id === "where-q" && where.say === "where", "where? uses the board word that speaks where");
assert(labels("where_is", 0)[0] === "where?", "where step");
const whereFringe = labels("where_is", 2, ctx(3));
assert(whereFringe.indexOf("park") >= 0 || whereFringe.indexOf("bed") >= 0, "where fringe has a place: " + whereFringe);
assert(whereFringe.indexOf("school") < 0, "school is conversation-level");
assert(labels("dont_want", 1)[0] === "don't", "don't step");
assert(labels("can", 1, ctx(4))[0] === "can", "can step");
assert(labels("put", 2, ctx(4)).join("|") === "on|in", "on/in " + labels("put", 2, ctx(4)));
const spots = labels("put", 3, ctx(4));
["box", "bag", "cup", "chair", "bed", "bath"].forEach(function (lab) {
  assert(spots.indexOf(lab) >= 0, "put spot missing " + lab + " in " + spots);
});
assert(spots.indexOf("park") < 0, "put fringe is surfaces");
assert(labels("want_please", 3, ctx(4)).join("|") === "please|thank you", "please wrapper");
const ing = P.choices(P.byId("like_ing"), 3, ctx(4));
assert(ing.length === 1 && ing[0].ending === "ing" && ing[0].label === "-ing", "optional -ing is the board ending");
assert(P.choices(P.byId("like_ing"), 3, ctx(3)).length === 0, "-ing stays off below Sentences");

const capped = labels("want", 2, ctx(5, { maxChoices: 2 }));
assert(capped.length === 2, "max choices 2 got " + capped.length + " " + capped);
assert(labels("open_close", 0, ctx(5, { maxChoices: 2 })).join("|") === "open|close", "fixed pair is not capped");

const prefer = { milk: 1, juice: 1, water: 1, apple: 1, banana: 1, snack: 1, cheese: 1 };
const recentCtx = ctx(5, {
  recent: { donut: 20, cracker: 10, bacon: 1 },
  hidden: function (w) { return !!(w && (w.hidden || w.page !== "food" || prefer[w.label])); }
});
const recent = labels("want", 2, recentCtx);
assert(recent[0] === "donut" && recent[1] === "cracker", "recent fringe " + recent);
const stable = labels("want", 2, ctx(5, { recent: { donut: 100 } }));
assert(stable[0] === "milk", "preferred core stays first, got " + stable);
assert(stable.indexOf("donut") < 0 || stable.indexOf("donut") > stable.indexOf("milk"), "donut does not pass milk");

const hiddenDont = ids(5, { hidden: function (w) { return !!(w && (w.hidden || w.label === "don't")); } });
assert(hiddenDont.indexOf("dont_want") < 0, "hiding don't hides that pattern");

const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert(/APP_VERSION = "1\.5\.2"/.test(app), "APP_VERSION");
assert(/wordboard-v23/.test(sw), "cache bump");
assert(html.indexOf("nav-stories") < 0, "stories tab stays off the bar");
assert(html.indexOf('id="set-pathsshow"') >= 0 && html.indexOf('id="set-pathstowords"') >= 0 && html.indexOf('id="set-pathsmax"') >= 0, "path settings");
assert(fs.existsSync(path.join(root, "stories.js")), "stories.js kept");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("paths-check ok:", P.patterns.length, "patterns; expanded", ids(3).length, "cards");
