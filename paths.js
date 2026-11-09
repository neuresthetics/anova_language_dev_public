/* =====================================================================
   paths.js  —  speech-pattern practice (Paths tab). Plain data + lookup.
   No DOM here, so the same rules run in the app and in a node check.

   A pattern is a short phrase tapped one step at a time. A step is either
   fixed words (usually one big button, or open|close) or a fringe of up to
   6 choices drawn from words.js. Fringe follows the current Words-shown
   level. Fitzgerald colour is the board word's type. Nothing is invented:
   labels, emoji and levels all come from the board.

   Menu order is the array order. minLevel follows Words shown: 1 starter,
   2 middle, 3 expanded, 4 sentences, 5 conversation. Auto uses that number,
   so Expanded keeps the shorter menu and Sentences / Full add longer frames.
   A pattern is hidden when every stem word is parent-hidden (setting).
   Open-slot length is ctx.maxChoices when the parent sets one (never above
   the step's own max). ctx.recent (label → score) floats non-preferred
   fringe words she has used; preferred core words keep their order.
   ===================================================================== */
(function (root) {
  var FITZ = { people: 1, verb: 1, descriptor: 1, noun: 1, social: 1, negation: 1, little: 1 };

  /* Food, things, and a few activity verbs. Preferred labels stay first so
     the same core words keep their place; other eligible words follow,
     higher board level first, then grid position. Round-robin across pools
     caps the row at 6. */
  var FOOD = { page: "food", types: ["noun"], prefer: ["milk", "juice", "water", "apple", "banana", "snack", "cheese"] };
  var THINGS = { page: "things", types: ["noun"], prefer: ["ball", "book", "shoes", "door", "box", "toy", "cup", "hat"] };
  /* Things you can see, find or ask for ("I see music." / "I want rain." are not sentences she needs). */
  var OBJECTS = { page: "things", types: ["noun"], not: ["music", "rain"], prefer: THINGS.prefer };
  /* Food you'd say you like in general ("I like bites." / "I like squeezes." read oddly). */
  var FOOD_LIKE = { page: "food", types: ["noun"], not: ["bite", "squeeze"], prefer: FOOD.prefer };
  /* Only verbs that make a real sentence after "I want to / I can / I like …ing" with nothing
     after them ("find" and "make" need an object, so they stay on the Words board only). */
  var ACTIVITY_VERBS = ["go", "jog", "stomp", "come", "read", "sleep", "wait", "hug", "walk", "run",
    "jump", "sit", "stand", "pretend", "write", "draw", "paint", "listen", "talk", "wash", "watch", "brush", "get dressed"];
  var ACTIVITIES = {
    any: [
      { page: "home", labels: ["eat", "drink", "play"] },
      { page: "actions", types: ["verb"], labels: ACTIVITY_VERBS }
    ],
    prefer: ["eat", "drink", "play", "read", "sleep", "hug", "walk", "run", "jump", "sit"]
  };
  var ANIMALS = { page: "animals", types: ["noun"], prefer: ["cat", "dog", "bird", "fish", "cow", "horse", "duck", "pig", "lion", "bear"] };
  var PEOPLE = { page: "people", types: ["people"], not: ["me", "everyone"], prefer: ["mom", "dad", "kid", "baby", "friend", "teacher"] };
  var VEHICLES = { page: "vehicles", types: ["noun"], prefer: ["car", "bus", "boat", "van", "jet"] };
  var PLACES = {
    page: "where",
    labels: ["home", "outside", "inside", "bed", "potty", "park", "school", "store", "playground", "bathroom"],
    prefer: ["home", "outside", "potty", "bed", "park", "school", "store", "playground", "bathroom", "inside"]
  };
  /* "Where is …?" — real places only ("where is outside?" is not a question she needs). */
  var WHERE_PLACES = { page: "where", labels: ["home", "bed", "potty", "park", "school", "store", "playground", "bathroom", "bath"],
    prefer: ["bed", "park", "school", "store", "playground", "bathroom", "bath", "potty", "home"] };
  /* Things you really open and close. */
  var OPEN_THINGS = { page: "things", types: ["noun"], labels: ["door", "book", "box", "bag"], prefer: ["door", "book", "box", "bag"] };
  /* Containers and surfaces only, so "put it on / in …" stays a real place to put something. */
  /* "on" takes surfaces, "in" takes containers, so every sentence is a real place to put something. */
  var PUT_ON = {
    any: [
      { page: "things", types: ["noun"], labels: ["box", "chair", "mat", "blanket"] },
      { page: "where", types: ["noun"], labels: ["bed"] }
    ],
    prefer: ["chair", "bed", "box", "mat", "blanket"]
  };
  var PUT_IN = {
    any: [
      { page: "things", types: ["noun"], labels: ["box", "bag", "cup", "pot"] },
      { page: "where", types: ["noun"], labels: ["bath"] },
      { page: "food", types: ["noun"], labels: ["cup"] }
    ],
    prefer: ["box", "bag", "cup", "bath", "pot"]
  };

  /* Titles and frames are the sentence a child is building. Fixed steps use board
     labels (lookup). "I'm" and "the" are on the board (little words / home). */
  /* group: menu sections. np: how a chosen noun joins the sentence (see nounPhrase).
     verb: how a chosen action joins ("to" → "I want to eat", "bare" → "I can eat").
     Small joining words ("a", "the", "to") are added for her and shown in grey, so
     every finished path is a correct sentence without extra taps. */
  var PATTERNS = [
    { id: "want", group: "wants", title: "I want …", frame: "I → want → …", minLevel: 1, stems: ["want"],
      steps: [{ words: ["I"] }, { words: ["want"] }, { fringe: { max: 6, pools: [FOOD, OBJECTS, ACTIVITIES] }, np: "a", verb: "to" }] },
    { id: "more", group: "wants", title: "I want more …", frame: "I → want → more → …", minLevel: 1, stems: ["more"],
      steps: [{ words: ["I"] }, { words: ["want"] }, { words: ["more"] }, { fringe: { max: 6, pools: [FOOD, OBJECTS] }, np: "more" }] },
    { id: "dont_want", group: "wants", title: "I don't want …", frame: "I → don't → want → …", minLevel: 2, stems: ["don't"],
      steps: [{ words: ["I"] }, { words: ["don't"] }, { words: ["want"] }, { fringe: { max: 6, pools: [FOOD, OBJECTS, ACTIVITIES] }, np: "a", verb: "to" }] },
    { id: "want_please", group: "polite", title: "I want …, please.", frame: "I → want → … → please", minLevel: 4, stems: ["please"],
      steps: [{ words: ["I"] }, { words: ["want"] }, { fringe: { max: 6, pools: [FOOD, OBJECTS, ACTIVITIES] }, np: "a", verb: "to" }, { words: ["please"], comma: true }] },
    /* "Thank you" thanks someone for something given; it is its own sentence, not a way to ask. */
    { id: "thank_you", group: "polite", title: "Thank you.", frame: "Thank you.", minLevel: 4, stems: ["thank you"],
      steps: [{ words: ["thank you"] }] },
    { id: "help", group: "quick", title: "Help me.", frame: "Help → me", minLevel: 1, stems: ["help"],
      steps: [{ words: ["help"] }, { words: ["me"] }] },
    { id: "see", group: "people", title: "I see …", frame: "I → see → …", minLevel: 1, stems: ["see"],
      steps: [{ words: ["I"] }, { words: ["see"] }, { fringe: { max: 6, pools: [ANIMALS, PEOPLE, VEHICLES, OBJECTS] }, np: "a" }] },
    { id: "who_what", group: "questions", title: "Who / what is it?", frame: "Who | What → is → it | that", minLevel: 3, stems: ["who", "what"], punct: "?",
      steps: [{ words: ["who", "what"], emoji: { who: "🧑", what: "❓" } }, { words: ["is"] }, { words: ["it", "that"] }] },
    { id: "where_is", group: "questions", title: "Where is …?", frame: "Where → is → …", minLevel: 3, stems: ["where?"], punct: "?",
      steps: [{ words: ["where?"] }, { words: ["is"], agree: true }, { fringe: { max: 6, pools: [WHERE_PLACES, PEOPLE, OBJECTS] }, np: "the" }] },
    { id: "go", group: "places", title: "I go …", frame: "I → go → …", minLevel: 2, stems: ["go"], emoji: "🚶",
      steps: [{ words: ["I"] }, { words: ["go"] }, { fringe: { max: 6, pools: [PLACES, PLACES, VEHICLES] }, np: "go" }] },
    { id: "can", group: "doing", title: "I can …", frame: "I → can → …", minLevel: 4, stems: ["can"],
      steps: [{ words: ["I"] }, { words: ["can"] }, { fringe: { max: 6, pools: [ACTIVITIES] }, verb: "bare" }] },
    { id: "like", group: "people", title: "I like …", frame: "I → like → …", minLevel: 2, stems: ["like"],
      steps: [{ words: ["I"] }, { words: ["like"] }, { fringe: { max: 6, pools: [FOOD_LIKE, ANIMALS, ACTIVITIES, THINGS] }, np: "plural", verb: "to" }] },
    { id: "like_ing", group: "doing", title: "I like …ing", frame: "I → like → … → -ing", minLevel: 4, stems: ["like"],
      steps: [{ words: ["I"] }, { words: ["like"] }, { fringe: { max: 6, pools: [ACTIVITIES] }, verb: "bare" }, { endings: ["ing"] }] },
    { id: "stop", group: "quick", title: "Stop.", frame: "Stop.", minLevel: 1, stems: ["stop"], punct: "!",
      steps: [{ words: ["stop"] }] },
    { id: "open_close", group: "doing", title: "Open / close the …", frame: "Open | Close → …", minLevel: 3, stems: ["open", "close"],
      steps: [{ words: ["open", "close"] }, { fringe: { max: 6, pools: [OPEN_THINGS] }, np: "the" }] },
    { id: "all_done", group: "quick", title: "I'm all done.", frame: "I'm → all done", minLevel: 1, stems: ["all done"],
      steps: [{ words: ["I'm"] }, { words: ["all done"] }] },
    { id: "put", group: "places", title: "Put it on / in …", frame: "Put → it → on | in → …", minLevel: 4, stems: ["put"],
      steps: [{ words: ["put"] }, { words: ["it"] }, { words: ["on", "in"] }, { fringeBy: { on: { max: 6, pools: [PUT_ON] }, "in": { max: 6, pools: [PUT_IN] } }, np: "the" }] }
  ];
  var GROUPS = [
    { id: "wants", label: "wants" }, { id: "people", label: "people and things" }, { id: "places", label: "places" },
    { id: "doing", label: "doing" }, { id: "questions", label: "questions" }, { id: "polite", label: "polite" }, { id: "quick", label: "quick" }
  ];

  /* ---------- grammar: small, explicit word lists; nothing guessed from outside ---------- */
  var MASS = { milk: 1, water: 1, juice: 1, cheese: 1, toast: 1, bacon: 1, chicken: 1, steak: 1, goldfish: 1, music: 1,
    paper: 1, glue: 1, rain: 1, food: 1, bread: 1, rice: 1, pasta: 1, cereal: 1, yogurt: 1, soup: 1, "ice cream": 1, candy: 1 };
  var ALREADY_PLURAL = { eggs: 1, pants: 1, shoes: 1, socks: 1, scissors: 1, hands: 1, feet: 1, teeth: 1, eyes: 1 };
  var NAMES = { mom: 1, dad: 1, grandma: 1, grandpa: 1, me: 1, everyone: 1, home: 1 };
  /* Mass only as food: the animal is "a chicken" / "chickens". */
  var MASS_AS_FOOD_ONLY = { chicken: 1 };
  /* People you'd call "my …" rather than "the …" / "a …". */
  var MY_PEOPLE = { friend: 1, teacher: 1 };
  function isMass(w) { var k = labelKey(w); return !!MASS[k] && !(MASS_AS_FOOD_ONLY[k] && w && w.page && w.page !== "food"); }
  function isPluralWord(w, text) { var k = labelKey(w); return !!ALREADY_PLURAL[k] || (text != null && text !== k && plural(k) === text && !isMass(w)); }
  var PLURAL = { child: "children", man: "men", woman: "women", mouse: "mice", foot: "feet", tooth: "teeth", person: "people",
    goose: "geese", sheep: "sheep", fish: "fish", deer: "deer", moose: "moose", bison: "bison", shrimp: "shrimp", squid: "squid",
    jellyfish: "jellyfish", mosquito: "mosquitoes", hero: "heroes", wolf: "wolves", leaf: "leaves", knife: "knives", calf: "calves", potato: "potatoes", tomato: "tomatoes" };
  var ING = { see: "seeing", lie: "lying", tie: "tying", begin: "beginning", forget: "forgetting", visit: "visiting",
    open: "opening", listen: "listening", happen: "happening" };
  /* go: words that take no "to", and vehicles you ride in or on */
  var GO_BARE = { home: 1, outside: 1, inside: 1 };
  var GO_TO = { bed: 1, school: 1 };
  var RIDE_IN = { car: 1, van: 1 };
  var RIDE_ON = { bus: 1, boat: 1, jet: 1, train: 1, bike: 1 };

  function plural(label, countable) {
    var w = String(label).toLowerCase();
    if (ALREADY_PLURAL[w] || (MASS[w] && !countable)) return w;
    var sp = w.lastIndexOf(" ");
    if (sp > 0) return w.slice(0, sp + 1) + plural(w.slice(sp + 1));
    if (PLURAL[w]) return PLURAL[w];
    if (/(s|x|z|sh|ch)$/.test(w)) return w + "es";
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ies";
    return w + "s";
  }
  function ing(label) {
    var w = String(label).toLowerCase(), sp = w.indexOf(" ");
    if (sp > 0) return ing(w.slice(0, sp)) + w.slice(sp);
    if (ING[w]) return ING[w];
    if (/ie$/.test(w)) return w.slice(0, -2) + "ying";
    if (/[^aeiouy]e$/.test(w) && w !== "be") return w.slice(0, -1) + "ing";
    if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(w)) return w + w.slice(-1) + "ing";
    return w + "ing";
  }
  function aOrAn(word) { return /^[aeiou]/i.test(word) && !/^(uni|use|one)/i.test(word) ? "an" : "a"; }
  function isVerb(w) { return w && w.type === "verb"; }
  function isName(w) { var k = labelKey(w); return !!NAMES[k] || (w && w.type === "people" && /^[A-Z]/.test(w.label)); }
  /* Returns { pre: "joining words", text: "word as said" } for a chosen fringe word. */
  function joinPick(step, w) {
    var k = labelKey(w), np = step.np || "bare";
    if (isVerb(w)) {
      if (step.verb === "to") return { pre: "to", text: k };
      return { pre: "", text: k };
    }
    if (np === "go") {
      if (GO_BARE[k]) return { pre: "", text: k };
      if (RIDE_IN[k]) return { pre: "in the", text: k };
      if (RIDE_ON[k]) return { pre: "on the", text: k };
      if (GO_TO[k]) return { pre: "to", text: k };
      return { pre: "to the", text: k };
    }
    if (isName(w) || np === "bare") return { pre: "", text: k };
    if (MY_PEOPLE[k] && w.type === "people" && np !== "more" && np !== "plural") return { pre: "my", text: k };
    if (np === "the") return { pre: "the", text: k };
    if (isMass(w) || ALREADY_PLURAL[k]) return { pre: "", text: k };
    if (np === "more" || np === "plural") return { pre: "", text: plural(k, true) };
    return { pre: aOrAn(k), text: k };   // np "a"
  }
  /* The sentence for the picks so far. parts[i] = { pre, text } for each step i that has a pick
     (an -ing ending changes the word before it). text = the full sentence, capitalized,
     with a final mark once every required step is done. */
  function sentence(pattern, picks) {
    var parts = [], last = -1, done = true;
    (pattern.steps || []).forEach(function (step, i) {
      var w = picks && picks[i];
      if (!w) { if (!step.optional) done = false; return; }
      if (w.ending) {
        if (last >= 0 && w.ending === "ing") { parts[last].text = ing(parts[last].text); parts[last].inflected = "ing"; }
        parts[i] = { pre: "", text: "", ending: true };
        return;
      }
      var p = step.fringe || step.fringeBy ? joinPick(step, w) : { pre: "", text: String(w.label).replace(/\?$/, "") };
      if (p.text !== String(w.label) && p.text !== labelKey(w)) p.changed = true;
      if (step.comma && last >= 0) parts[last].comma = true;
      parts[i] = p; last = i;
    });
    // "Where is the ball?" / "Where are the shoes?": an agree step follows the last word's number.
    (pattern.steps || []).forEach(function (step, i) {
      if (!step.agree || !parts[i]) return;
      var lastPick = picks[last], lp = parts[last];
      if (last > i && lastPick && isPluralWord(lastPick, lp.text) && parts[i].text === "is") { parts[i].text = "are"; parts[i].changed = true; }
    });
    var words = [];
    parts.forEach(function (p) { if (!p || p.ending) return; words.push((p.pre ? p.pre + " " : "") + p.text + (p.comma ? "," : "")); });
    var text = words.join(" ");
    if (text) text = text.charAt(0).toUpperCase() + text.slice(1);
    text = text.replace(/\bi\b/g, "I").replace(/\bi'm\b/g, "I'm");
    if (text && done) text += pattern.punct || ".";
    return { parts: parts, text: text, done: done };
  }

  /* The words that go to the Words bar and the voice, one entry per board token.
     pre: a joining word added for her; word: the tapped board word (null for pre);
     text: what is shown; changed: text differs from the board label (so its recorded
     voice clip can't be used). The first word gets a capital (opts.capital !== false)
     and the last gets the sentence's final mark once it is done. */
  function utterance(pattern, picks, opts) {
    opts = opts || {};
    var s = sentence(pattern, picks), out = [];
    (pattern.steps || []).forEach(function (step, i) {
      var w = picks && picks[i], part = s.parts[i];
      if (!w || !part || part.ending) return;
      if (part.pre) part.pre.split(" ").forEach(function (x) { out.push({ text: x, pre: true, word: null, step: i }); });
      var plain = String(w.label).replace(/\?$/, "");
      var text = part.text, changed = text.toLowerCase() !== String(w.label).toLowerCase();
      if (/^i\b/i.test(plain) && !changed) text = plain;
      out.push({ text: text, pre: false, word: w, step: i, changed: changed, inflected: part.inflected || null, punct: part.comma ? "," : "" });
    });
    if (out.length && opts.capital !== false) {
      var f = out[0];
      var cap = f.text.charAt(0).toUpperCase() + f.text.slice(1);
      if (cap !== f.text) { f.text = cap; f.capitalized = true; }
    }
    if (s.done && out.length) out[out.length - 1].punct = pattern.punct || ".";
    return { tokens: out, text: s.text, done: s.done };
  }

  function labelKey(w) { return String(w && w.label || "").toLowerCase(); }
  function fitzClass(w) { return w && FITZ[w.type] ? "t-" + w.type : ""; }
  function byId(id) {
    for (var i = 0; i < PATTERNS.length; i++) if (PATTERNS[i].id === id) return PATTERNS[i];
    return null;
  }
  function wordLevelOf(w, ctx) {
    if (ctx && ctx.wordLevel) return ctx.wordLevel(w);
    var n = +w.level;
    return n >= 1 ? Math.round(n) : 3;
  }
  function eligible(w, ctx) {
    if (!w || w.type === "folder" || w.ending) return false;
    if (ctx.hidden && ctx.hidden(w)) return false;
    if (ctx.forceShown && ctx.forceShown(w)) return true;
    return wordLevelOf(w, ctx) <= (+ctx.level || 1);
  }
  function betterLookup(a, b, ctx) {
    var ah = a.page === "home" ? 0 : 1, bh = b.page === "home" ? 0 : 1;
    if (ah !== bh) return ah - bh;
    var ae = a.emoji ? 0 : 1, be = b.emoji ? 0 : 1;
    if (ae !== be) return ae - be;
    var al = wordLevelOf(a, ctx), bl = wordLevelOf(b, ctx);
    if (al !== bl) return al - bl;
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  }
  function lookup(label, ctx) {
    var want = String(label || "").toLowerCase(), hits = [];
    (ctx.words || []).forEach(function (w) {
      if (!w || w.type === "folder" || w.ending) return;
      if (labelKey(w) === want) hits.push(w);
    });
    if (!hits.length) return null;
    hits.sort(function (a, b) { return betterLookup(a, b, ctx); });
    var vis = [];
    hits.forEach(function (w) { if (!ctx.hidden || !ctx.hidden(w)) vis.push(w); });
    return vis[0] || hits[0];
  }
  function patternCap(ctx) {
    var set = ctx.set || "auto";
    if (set === "starter") return 1;
    if (set === "middle") return 2;
    if (set === "expanded") return 3;
    if (set === "sentences") return 4;
    if (set === "all" || set === "full" || set === "conversation") return 99;
    var lv = +ctx.level || 1;
    return lv >= 1 ? lv : 1;
  }
  function stemsHidden(p, ctx) {
    var stems = p.stems || [], found = 0, hidden = 0;
    stems.forEach(function (lab) {
      var w = lookup(lab, ctx);
      if (!w) return;
      found++;
      if (ctx.hidden && ctx.hidden(w)) hidden++;
    });
    return found > 0 && hidden === found;
  }
  function visible(ctx) {
    ctx = ctx || {};
    var cap = patternCap(ctx);
    return PATTERNS.filter(function (p) {
      if (p.minLevel > cap) return false;
      if (ctx.hideHiddenStem !== false && stemsHidden(p, ctx)) return false;
      return completable(p, ctx);
    });
  }
  /* A pattern only shows when she can finish it: every required step has at least one
     choice at this level with these hidden words (no "I like stand" with no -ing to tap). */
  function completable(p, ctx) {
    for (var i = 0; i < p.steps.length; i++) {
      var st = p.steps[i];
      if (st.optional) continue;
      if (st.fringeBy) continue;            // checked through the step before it (see choices)
      if (!choices(p, i, ctx, []).length) return false;
    }
    return true;
  }
  function matchesPool(w, pool) {
    if (pool.any) {
      for (var i = 0; i < pool.any.length; i++) if (matchesPool(w, pool.any[i])) return true;
      return false;
    }
    if (pool.page && w.page !== pool.page) return false;
    if (pool.not && pool.not.indexOf(labelKey(w)) >= 0) return false;
    if (pool.types && pool.types.indexOf(w.type) < 0) return false;
    if (pool.labels) {
      var lab = labelKey(w), ok = false;
      for (var j = 0; j < pool.labels.length; j++) if (String(pool.labels[j]).toLowerCase() === lab) ok = true;
      if (!ok) return false;
    }
    return true;
  }
  function skipLabels(pattern) {
    var skip = {};
    (pattern.stems || []).forEach(function (s) { skip[String(s).toLowerCase()] = 1; });
    (pattern.steps || []).forEach(function (st) {
      (st.words || []).forEach(function (s) { skip[String(s).toLowerCase()] = 1; });
    });
    return skip;
  }
  function poolWords(pool, ctx, skip) {
    var best = {};
    (ctx.words || []).forEach(function (w) {
      if (!eligible(w, ctx) || !matchesPool(w, pool)) return;
      var k = labelKey(w);
      if (!k || skip[k]) return;
      var cur = best[k];
      if (!cur || betterLookup(w, cur, ctx) < 0) best[k] = w;
    });
    var prefer = {}, arr = [];
    (pool.prefer || []).forEach(function (lab, i) { prefer[String(lab).toLowerCase()] = i; });
    Object.keys(best).forEach(function (k) { arr.push(best[k]); });
    arr.sort(function (a, b) {
      var ka = labelKey(a), kb = labelKey(b);
      var ia = Object.prototype.hasOwnProperty.call(prefer, ka) ? prefer[ka] : null;
      var ib = Object.prototype.hasOwnProperty.call(prefer, kb) ? prefer[kb] : null;
      var ha = ia == null ? 1 : 0, hb = ib == null ? 1 : 0;
      if (ha !== hb) return ha - hb;
      if (ha === 0 && ia !== ib) return ia - ib;
      var recent = ctx.recent || null;
      if (recent) {
        var ra = +recent[ka] || 0, rb = +recent[kb] || 0;
        if (ra !== rb) return rb - ra;
      }
      var la = wordLevelOf(a, ctx), lb = wordLevelOf(b, ctx);
      if (la !== lb) return lb - la;
      if (a.row !== b.row) return a.row - b.row;
      if (a.col !== b.col) return a.col - b.col;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
    return arr;
  }
  function pickFringe(spec, ctx, pattern) {
    var skip = skipLabels(pattern);
    var pools = (spec.pools || []).map(function (pool) { return poolWords(pool, ctx, skip); });
    var out = [], seen = {}, max = spec.max || 6, guard = 0;
    var cap = +ctx.maxChoices;
    if (cap >= 2) max = Math.min(max, Math.round(cap));
    while (out.length < max && guard < 80) {
      var progressed = false;
      for (var p = 0; p < pools.length && out.length < max; p++) {
        while (pools[p].length && seen[labelKey(pools[p][0])]) pools[p].shift();
        if (!pools[p].length) continue;
        var w = pools[p].shift();
        seen[labelKey(w)] = 1;
        out.push(w);
        progressed = true;
      }
      if (!progressed) break;
      guard++;
    }
    return out;
  }
  function endingChoices(step, ctx) {
    var order = step.endings || [], byKind = {};
    (ctx.words || []).forEach(function (w) {
      if (!w || !w.ending || order.indexOf(w.ending) < 0 || w.type === "folder") return;
      if (ctx.hidden && ctx.hidden(w)) return;
      if (!(ctx.forceShown && ctx.forceShown(w)) && wordLevelOf(w, ctx) > (+ctx.level || 1)) return;
      if (!byKind[w.ending] || betterLookup(w, byKind[w.ending], ctx) < 0) byKind[w.ending] = w;
    });
    var out = [];
    order.forEach(function (k) { if (byKind[k]) out.push(byKind[k]); });
    return out;
  }
  function choices(pattern, stepIndex, ctx, picks) {
    var step = pattern && pattern.steps && pattern.steps[stepIndex];
    if (!step) return [];
    if (step.fringeBy) {
      var prev = picks && picks[stepIndex - 1], key = prev ? labelKey(prev) : "";
      var spec = step.fringeBy[key] || step.fringeBy[Object.keys(step.fringeBy)[0]];
      return pickFringe(spec, ctx, pattern);
    }
    if (step.words) {
      var multi = step.words.length > 1, out = [];
      step.words.forEach(function (lab) {
        var w = lookup(lab, ctx);
        if (!w || w._pathOnly) return;
        if (multi && ctx.hidden && ctx.hidden(w)) return;
        // Two words with the same picture can't be told apart in picture-only; a step can
        // give one its own picture here (Paths only; the main board is untouched).
        if (step.emoji && step.emoji[lab] && !w.image && w.emoji !== step.emoji[lab]) {
          var copy = {}; for (var k in w) copy[k] = w[k]; copy.emoji = step.emoji[lab]; w = copy;
        }
        out.push(w);
      });
      var next = pattern.steps[stepIndex + 1];
      if (next && next.fringeBy) {
        out = out.filter(function (w) {
          var spec = next.fringeBy[labelKey(w)];
          return !spec || pickFringe(spec, ctx, pattern).length > 0;
        });
      }
      return out;
    }
    if (step.endings) return endingChoices(step, ctx);
    if (step.fringe) return pickFringe(step.fringe, ctx, pattern);
    return [];
  }

  root.AAC_PATHS = {
    patterns: PATTERNS,
    visible: visible,
    choices: choices,
    lookup: lookup,
    fitzClass: fitzClass,
    byId: byId,
    groups: GROUPS,
    sentence: sentence,
    utterance: utterance,
    completable: completable,
    joinPick: joinPick,
    plural: plural,
    ing: ing
  };
})(typeof self !== "undefined" ? self : globalThis);
