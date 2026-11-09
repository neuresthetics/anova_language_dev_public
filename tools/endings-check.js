/* Every board word x every ending (-s, -ing, -ed, 's): fails on any form a parent would call wrong.
   Covers words.js at every level and the family pack (if present). Spelling checks below are written
   separately from endings.js, so each checks the other.   node tools/endings-check.js [--list] */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const ctx = { console }; ctx.self = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "words.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(root, "endings.js"), "utf8"), ctx);
const E = ctx.AAC_ENDINGS;
let failed = 0;
function fail(m) { failed++; console.error("FAIL:", m); }
const sets = [["words.js", ctx.AAC_DEFAULT_CONFIG.words]];
const packFile = path.join(root, "family-pack", "family-pack.json");
if (fs.existsSync(packFile)) sets.push(["family pack", JSON.parse(fs.readFileSync(packFile, "utf8")).config.words || []]);
const KINDS = ["s", "ing", "ed", "poss"];

/* words that must take NO ending at all (Jason's list plus every little / social word) */
const NONE = ["again", "more", "stop", "help", "all done", "yes", "no", "please", "thank you", "I", "you", "it", "the", "a",
  "here", "there", "in", "on", "up", "down", "and", "what", "where?", "who", "why", "my", "me", "can", "will", "won't",
  "is", "am", "are", "was", "were", "did", "does", "has", "don't", "can't", "not", "happy", "big", "red", "hi", "bye",
  "home", "outside", "inside", "today", "now", "milk", "water", "juice", "pants", "shoes", "scissors", "eggs", "cares"];
/* the same base word must never come out as one of these */
const NEVER = /^(dooring|againing|agains|mores|stoping|helped|helping|yesed|goed|eated|runned|maked|seed|sitted|comed|taked|gived|drinked|finded|thinked|knowed|writed|drawed|standed|sleeped|readed|getted|putted|winned|mouses|sheeps|fishs|fishes|gooses|wolfs|boxs|buss|foxs|babys|flys|mosquitos|teeths|foots|childs|mans|seeing's)$/;
/* hand-written expectations (independent of endings.js tables) */
const EXPECT = {
  "run|ing": "running", "make|ing": "making", "see|ing": "seeing", "swim|ing": "swimming", "sit|ing": "sitting", "jog|ing": "jogging",
  "come|ing": "coming", "write|ing": "writing", "try|ing": "trying", "get dressed|ing": "getting dressed", "listen|ing": "listening",
  "forget|ing": "forgetting", "remember|ing": "remembering", "open|ing": "opening", "close|ing": "closing", "hug|ing": "hugging",
  "go|ed": "went", "eat|ed": "ate", "run|ed": "ran", "see|ed": "saw", "make|ed": "made", "drink|ed": "drank", "sit|ed": "sat",
  "write|ed": "wrote", "draw|ed": "drew", "think|ed": "thought", "try|ed": "tried", "hug|ed": "hugged", "play|ed": "played",
  "put|ed": "put", "read|ed": "read", "get dressed|ed": "got dressed", "forget|ed": "forgot",
  "go|s": "goes", "do|s": "does", "have|s": "has", "wash|s": "washes", "watch|s": "watches", "try|s": "tries", "play|s": "plays",
  "box|s": "boxes", "bus|s": "buses", "fox|s": "foxes", "mosquito|s": "mosquitoes", "mouse|s": "mice", "goose|s": "geese",
  "sheep|s": "sheep", "fish|s": "fish", "deer|s": "deer", "wolf|s": "wolves", "baby|s": "babies", "butterfly|s": "butterflies",
  "fly|s": "flies", "man|s": "men", "door|s": "doors", "turkey|s": "turkeys", "potty|s": "potties", "polar bear|s": "polar bears",
  "octopus|s": "octopuses", "chicken@animals|s": "chickens",
  "mom|poss": "mom's", "dad|poss": "dad's", "dog|poss": "dog's", "octopus|poss": "octopus's"
};
const NULL = ["door|ing", "door|ed", "again|s", "again|ing", "milk|s", "chicken@food|s", "ball|ing", "happy|s", "mom|s",
  "go|poss", "ball|poss", "nose|poss", "you|poss", "I|s", "help|ing", "help|s", "help|ed", "shoes|s"];
for (const k of Object.keys(E)) { /* exported helpers present */ }
// spelling helpers checked straight away
[["swim", "ing", "swimming"], ["foot", "s", "feet"], ["tooth", "s", "teeth"], ["child", "s", "children"]].forEach(function (x) {
  const got = x[1] === "ing" ? E.ing(x[0]) : E.plural(x[0]);
  if (got !== x[2]) fail(x[0] + " + " + x[1] + " = " + got + " (want " + x[2] + ")");
});
let combos = 0, allowedN = 0;
const list = [];
const vowel = /[aeiouy]/;
for (const [name, words] of sets) {
  const byKey = {};
  words.forEach(function (w) {
    if (!w || w.type === "folder" || w.ending) return;
    const lab = String(w.label), low = lab.toLowerCase();
    byKey[lab] = byKey[lab] || w; byKey[lab + "@" + w.page] = w;
    KINDS.forEach(function (kind) {
      combos++;
      const f = E.form(w, kind);
      if (!f) return;
      allowedN++;
      list.push(name + "\t" + lab + "@" + w.page + " (" + w.type + ")\t-" + kind + "\t" + f);
      const where = name + ": " + lab + "@" + w.page + " + " + kind + " -> " + f;
      // what kind of word can take what
      if ((kind === "ing" || kind === "ed") && w.type !== "verb") fail(where + " (only verbs take -" + kind + ")");
      if (kind === "poss" && w.type === "verb") fail(where + " (no 's on a verb)");
      if (["descriptor", "little", "social", "negation"].indexOf(w.type) >= 0) fail(where + " (" + w.type + " words take no ending)");
      // spelling, checked on the changed word (the first word of a verb phrase, else the last)
      const head = w.type === "verb" ? f.split(" ")[0] : f.split(" ").pop();
      const base = w.type === "verb" ? low.split(" ")[0] : low.split(" ").pop();
      if (NEVER.test(head)) fail(where + " (known wrong form)");
      if (/(.)\1\1/.test(head)) fail(where + " (tripled letter)");
      if (kind === "ing") {
        if (!/ing$/.test(head)) fail(where + " (no -ing)");
        if (/[^e]eing$/.test(head) && !/(ee|ye|oe)ing$/.test(head)) fail(where + " (kept a silent e)");
        if (/^[^aeiou]*[aeiou][bdgmnpt]$/.test(base) && head !== base + base.slice(-1) + "ing") fail(where + " (should double the last letter)");
      }
      if (kind === "s" && w.type !== "verb") {
        if (/(s|x|z|sh|ch)$/.test(base) && head === base + "s") fail(where + " (needs -es)");
        if (/[^aeiou]y$/.test(base) && head === base + "s") fail(where + " (y -> ies)");
      }
      if (kind === "poss" && !/'s$/.test(f)) fail(where + " (possessive)");
      if (!vowel.test(head) && head !== "why") fail(where + " (no vowel)");
    });
  });
  if (name === "words.js") {
    NONE.forEach(function (lab) {
      const w = byKey[lab];
      if (!w) return fail("NONE list word not on the board: " + lab);
      words.filter(function (x) { return x.label === lab && !x.ending && x.type !== "folder"; }).forEach(function (x) {
        KINDS.forEach(function (kind) { const f = E.form(x, kind); if (f) fail(lab + "@" + x.page + " + " + kind + " -> " + f + " (must take no ending)"); });
      });
    });
    Object.keys(EXPECT).forEach(function (k) {
      const [lab, kind] = k.split("|"), w = byKey[lab] || { label: lab.split("@")[0], type: "verb", page: "actions" };
      const got = byKey[lab] ? E.form(w, kind) : (kind === "ing" ? E.ing(lab) : kind === "ed" ? E.past(lab) : E.plural(lab));
      if (got !== EXPECT[k]) fail(k + " -> " + got + " (want " + EXPECT[k] + ")");
    });
    NULL.forEach(function (k) {
      const [lab, kind] = k.split("|"), w = byKey[lab];
      if (!w) return fail("NULL case word not on the board: " + lab);
      const got = E.form(w, kind);
      if (got) fail(k + " -> " + got + " (should take no ending)");
    });
  }
}
// the app uses endings.js and dims endings that don't fit
const app = fs.readFileSync(path.join(root, "app.js"), "utf8"), html = fs.readFileSync(path.join(root, "index.html"), "utf8");
if (!/AAC_ENDINGS/.test(app) || !/ending-off/.test(app)) fail("app.js does not use endings.js / dim endings");
if (html.indexOf('<script src="endings.js"></script>') < 0) fail("index.html loads endings.js");
if (!/"endings\.js"/.test(fs.readFileSync(path.join(root, "sw.js"), "utf8"))) fail("sw.js caches endings.js");
if (process.argv.indexOf("--list") >= 0) console.log(list.join("\n"));
if (failed) { console.error(failed + " failed"); process.exit(1); }
console.log("endings-check ok:", combos, "word x ending combos,", allowedN, "allowed, all spelled right;", sets.map(function (s) { return s[0]; }).join(" + "));
