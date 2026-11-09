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
assert(ids(4).length === 17, "sentences menu " + ids(4).length + " " + ids(4).join(","));
["dont_want", "who_what", "where_is"].forEach(function (id) { assert(ids(3).indexOf(id) >= 0, "expanded missing " + id); });
["can", "put", "want_please", "like_ing"].forEach(function (id) {
  assert(ids(3).indexOf(id) < 0, id + " should wait for Sentences");
  assert(ids(4).indexOf(id) >= 0, "sentences missing " + id);
});
assert(ids(2).indexOf("who_what") < 0 && ids(2).indexOf("dont_want") >= 0, "middle gating");
assert(ids(5, { set: "expanded" }).indexOf("can") < 0, "pattern set Expanded stops at expanded frames");
assert(ids(5, { set: "expanded" }).length === 12, "pattern set Expanded count");
assert(ids(5, { set: "all" }).length === P.patterns.length, "All patterns shows every pattern at the top level");
assert(ids(1, { set: "all" }).length > ids(1).length, "All patterns shows more than Starter at level 1");
assert(ids(1, { set: "all" }).every(function (id) { return P.completable(P.byId(id), ctx(1, { set: "all" })); }), "All patterns at level 1 only shows patterns she can finish");

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
function putSpots(prep) {
  const c4 = ctx(4), put = P.byId("put");
  const picks = [P.choices(put, 0, c4)[0], P.choices(put, 1, c4)[0], P.choices(put, 2, c4).filter(function (w) { return w.label === prep; })[0]];
  return P.choices(put, 3, c4, picks).map(function (w) { return w.label; });
}
const spotsOn = putSpots("on"), spotsIn = putSpots("in");
["box", "chair", "bed"].forEach(function (lab) { assert(spotsOn.indexOf(lab) >= 0, "put on missing " + lab + " in " + spotsOn); });
assert(spotsOn.indexOf("cup") < 0 && spotsOn.indexOf("bath") < 0, "no 'on the cup/bath'");
["box", "bag", "cup", "bath"].forEach(function (lab) {
  assert(spotsIn.indexOf(lab) >= 0, "put in missing " + lab + " in " + spotsIn);
});
assert(spotsOn.concat(spotsIn).indexOf("park") < 0, "put fringe is surfaces");
assert(labels("want_please", 3, ctx(4)).join("|") === "please", "polite slot is please only");
assert(ids(4).indexOf("thank_you") >= 0 && P.sentence(P.byId("thank_you"), P.choices(P.byId("thank_you"), 0, ctx(4))).text === "Thank you.", "Thank you. is its own sentence");
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
assert(/APP_VERSION = "1\.5\.6"/.test(app), "APP_VERSION");
assert(/wordboard-v31/.test(sw), "cache bump");
assert(html.indexOf("nav-stories") < 0, "stories tab stays off the bar");
assert(html.indexOf('id="set-pathsshow"') >= 0 && html.indexOf('id="set-pathstowords"') >= 0 && html.indexOf('id="set-pathsmax"') >= 0, "path settings");
assert(fs.existsSync(path.join(root, "stories.js")), "stories.js kept");

/* ---- passes: core words in stable spots, pictures tell words apart ---- */
const goL5 = labels("go", 2, ctx(5));
assert(goL5.slice(0, 2).join("|") === "home|outside", "go starts with home, outside: " + goL5);
const ww = P.choices(P.byId("who_what"), 0, ctx(5));
assert(ww.length === 2 && ww[0].emoji !== ww[1].emoji, "who and what have different pictures");
P.patterns.forEach(function (p) {
  p.steps.forEach(function (st, i) {
    if (!st.words || st.words.length < 2) return;
    const em = P.choices(p, i, ctx(5)).map(function (w) { return w.emoji || w.image || w.label; });
    assert(em.length === new Set(em).size, p.id + " step " + i + " pictures repeat: " + em);
  });
});
/* ---- grammar audit: EVERY reachable sentence ----
   For each level 1-5 (and a custom level that shows every word), with pattern set "all"
   and "auto", each step is asked for its choices, then asked again with those words hidden,
   until nothing new comes back. That covers any choice limit, recent-word order and
   parent-hidden words. Each finished path is checked three ways: the finished-view
   sentence, the Words-bar text, and the spoken text. Any flag fails the check. */
const G = require("./paths-grammar.js");
const info = { words: words };
const sentences = {};
let deadEnds = 0, walked = 0;
function superCtx(level, force, set, seen) {
  return { words: words, level: level, set: set, hideHiddenStem: true, maxChoices: 6, recent: {},
    hidden: function (w) { return !!(w && (w.hidden || (seen && seen.has(w)))); },
    forceShown: function () { return !!force; } };
}
function everyChoice(p, i, level, force, set, picks) {
  const seen = new Set(), out = [];
  for (let g = 0; g < 80; g++) {
    const ch = P.choices(p, i, superCtx(level, force, set, seen), picks).filter(function (w) { return !seen.has(w); });
    if (!ch.length) break;
    ch.forEach(function (w) { seen.add(w); out.push(w); });
  }
  return out;
}
function barText(u) { return u.tokens.map(function (t) { return t.text + (t.punct || ""); }).join(" "); }
function spokenText(u) {
  return u.tokens.map(function (t) {
    const say = !t.pre && !t.changed && t.word && t.word.say ? t.word.say : t.text;
    return say + (t.punct || "");
  }).join(" ");
}
[[1, false], [2, false], [3, false], [4, false], [5, false], [5, true]].forEach(function (lv) {
  ["all", "auto"].forEach(function (set) {
    const level = lv[0], force = lv[1], tag = (force ? "any" : "L" + level) + "/" + set;
    const c0 = superCtx(level, force, set, null);
    P.visible(c0).forEach(function (p) {
      (function walk(i, picks) {
        if (i >= p.steps.length) {
          walked++;
          const s = P.sentence(p, picks);
          const u = P.utterance(p, picks), ul = P.utterance(p, picks, { capital: false });
          const key = s.text;
          if (!sentences[key]) sentences[key] = { id: p.id, tag: tag, path: picks.map(function (w) { return w ? w.label : "(skip)"; }).join(" > "), bar: barText(u), barLower: barText(ul), said: spokenText(u), done: s.done };
          return;
        }
        const ch = everyChoice(p, i, level, force, set, picks);
        if (!ch.length) {
          if (p.steps[i].optional) return walk(i + 1, picks.concat([null]));
          deadEnds++; assert(false, "dead end: " + p.id + " after " + picks.map(function (w) { return w && w.label; }).join(" > ") + " (" + tag + ")"); return;
        }
        ch.forEach(function (w) { walk(i + 1, picks.concat([w])); });
        if (p.steps[i].optional) walk(i + 1, picks.concat([null]));
      })(0, []);
    });
  });
});
let grammarBad = 0;
Object.keys(sentences).forEach(function (t) {
  const r = sentences[t], probs = G.check(t, info);
  if (!r.done) probs.push("finished path is not a finished sentence");
  if (r.bar !== t) probs.push("Words bar differs: \"" + r.bar + "\"");
  const lowerWant = /^I\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
  if (r.barLower !== lowerWant) probs.push("lowercase-setting Words bar differs: \"" + r.barLower + "\"");
  if (r.said.replace(/\beye\b/gi, "I").toLowerCase() !== t.toLowerCase()) probs.push("spoken text differs: \"" + r.said + "\"");
  if (probs.length) { grammarBad++; assert(false, "grammar: \"" + t + "\" [" + r.path + "] (" + r.tag + "): " + probs.join("; ")); }
});
const all = Object.keys(sentences);
assert(all.length >= 500, "superset walk found only " + all.length + " sentences");
/* regression cases: every class the 2026-11-08 audit found */
[
  "Where is the shoes?", "Where is the pants?", "Where is the socks?", "Where is the scissors?",
  "I want a ball, thank you.", "I want to eat, thank you.",
  "I can find.", "I want to make.", "I like finding.", "I want to make, please.",
  "I see chicken.", "I see music.", "Where is the music?", "Where is the rain?", "Where is the friend?", "I want rain.", "I want more rain.",
  "I like bites.", "I like squeezes.", "I like mosquitos."
].forEach(function (b) {
  assert(all.indexOf(b) < 0, "regression: \"" + b + "\" is reachable again");
  assert(G.check(b, info).length > 0, "checker should flag: " + b);
});
["Where are the shoes?", "Where is the ball?", "I see a chicken.", "I want chicken.", "Where is my friend?", "I like mosquitoes.", "Thank you.", "I want milk, please.", "Help me.", "Who is it?"].forEach(function (g) {
  assert(all.indexOf(g) >= 0, "expected sentence missing: " + g);
});
assert(sentences["Help me."] && sentences["Help me."].bar === "Help me." && sentences["Help me."].barLower === "help me.", "Words bar capital for Help me.");
// the older mistakes stay caught
["I want eat.", "I see cat.", "I want more ball.", "I go to outside.", "Where? is bed?", "I want an milk.", "I like huging.", "I want milk please."].forEach(function (b) {
  assert(G.check(b, info).length > 0, "checker should flag: " + b);
});
// no dead ends when patterns above the Words level are shown
[1, 2, 3].forEach(function (lv) {
  const c = superCtx(lv, false, "all", null);
  P.visible(c).forEach(function (p) { assert(P.completable(p, c), p.id + " shown but not completable at L" + lv); });
  assert(P.visible(c).map(function (p) { return p.id; }).indexOf("like_ing") < 0 || P.choices(P.byId("like_ing"), 3, c).length > 0, "like_ing at L" + lv + " has its -ing");
});
if (process.argv.indexOf("--list") >= 0) all.sort().forEach(function (t) { const r = sentences[t]; console.log(r.tag + "\t" + r.id + "\t" + r.path + "\t" + t + "\t" + r.bar); });
console.log("grammar audit:", all.length, "sentences from", walked, "paths,", grammarBad, "flagged,", deadEnds, "dead ends");

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("paths-check ok:", P.patterns.length, "patterns; expanded", ids(3).length, "cards");
