/* =====================================================================
   paths.js  —  speech-pattern practice (Paths tab). Plain data + lookup.
   No DOM here, so the same rules run in the app and in a node check.

   A pattern is a short phrase tapped one step at a time. A step is either
   fixed words (usually one big button, or open|close) or a fringe of up to
   6 choices drawn from words.js. Fringe follows the current Words-shown
   level. Fitzgerald colour is the board word's type. Nothing is invented:
   labels, emoji and levels all come from the board.

   Menu order is the array order. minLevel: 1 starter, 2 middle, 3 expanded.
   A pattern is hidden when every stem word is parent-hidden (setting).
   ===================================================================== */
(function (root) {
  var FITZ = { people: 1, verb: 1, descriptor: 1, noun: 1, social: 1, negation: 1, little: 1 };

  /* Food, things, and a few activity verbs. Preferred labels stay first so
     the same core words keep their place; other eligible words follow,
     higher board level first, then grid position. Round-robin across pools
     caps the row at 6. */
  var FOOD = { page: "food", types: ["noun"], prefer: ["milk", "juice", "water", "apple", "banana", "snack", "cheese"] };
  var THINGS = { page: "things", types: ["noun"], prefer: ["ball", "book", "shoes", "door", "box", "toy", "cup", "hat"] };
  var ACTIVITIES = {
    any: [
      { page: "home", labels: ["eat", "drink", "play"] },
      { page: "actions", types: ["verb"] }
    ],
    prefer: ["eat", "drink", "play", "read", "sleep", "hug", "walk", "run", "jump", "sit"]
  };
  var ANIMALS = { page: "animals", types: ["noun"], prefer: ["cat", "dog", "bird", "fish", "cow", "horse", "duck", "pig", "lion", "bear"] };
  var PEOPLE = { page: "people", types: ["people"], prefer: ["mom", "dad", "kid", "baby", "friend", "teacher"] };
  var VEHICLES = { page: "vehicles", types: ["noun"], prefer: ["car", "bus", "boat", "van", "jet"] };
  var PLACES = {
    page: "where",
    labels: ["home", "outside", "inside", "bath", "bed", "potty", "park", "school", "store", "playground", "bathroom"],
    prefer: ["bed", "school", "park", "store", "playground", "bathroom", "bath", "potty", "home", "outside", "inside"]
  };
  var OPEN_THINGS = { page: "things", types: ["noun"], prefer: ["door", "book", "box", "bag", "cup", "toy"] };

  /* Titles and frames are the sentence a child is building. Fixed steps use board
     labels (lookup). "I'm" and "the" are on the board (little words / home). */
  var PATTERNS = [
    { id: "want", title: "I want …", frame: "I → want → …", minLevel: 1, stems: ["want"],
      steps: [{ words: ["I"] }, { words: ["want"] }, { fringe: { max: 6, pools: [FOOD, THINGS, ACTIVITIES] } }] },
    { id: "more", title: "I want more …", frame: "I → want → more → …", minLevel: 1, stems: ["more"],
      steps: [{ words: ["I"] }, { words: ["want"] }, { words: ["more"] }, { fringe: { max: 6, pools: [FOOD, THINGS] } }] },
    { id: "help", title: "Help me", frame: "Help → me", minLevel: 1, stems: ["help"],
      steps: [{ words: ["help"] }, { words: ["me"] }] },
    { id: "see", title: "I see …", frame: "I → see → …", minLevel: 1, stems: ["see"],
      steps: [{ words: ["I"] }, { words: ["see"] }, { fringe: { max: 6, pools: [ANIMALS, PEOPLE, VEHICLES, THINGS] } }] },
    { id: "go", title: "I go to …", frame: "I → go → to → …", minLevel: 2, stems: ["go"],
      steps: [{ words: ["I"] }, { words: ["go"] }, { words: ["to"] }, { fringe: { max: 6, pools: [PLACES, VEHICLES] } }] },
    { id: "like", title: "I like …", frame: "I → like → …", minLevel: 2, stems: ["like"],
      steps: [{ words: ["I"] }, { words: ["like"] }, { fringe: { max: 6, pools: [FOOD, ANIMALS, ACTIVITIES, THINGS] } }] },
    { id: "stop", title: "Stop.", frame: "Stop.", minLevel: 1, stems: ["stop"],
      steps: [{ words: ["stop"] }] },
    { id: "open_close", title: "Open the … / Close the …", frame: "Open | Close → the → …", minLevel: 3, stems: ["open", "close"],
      steps: [{ words: ["open", "close"] }, { words: ["the"] }, { fringe: { max: 6, pools: [OPEN_THINGS] } }] },
    { id: "all_done", title: "I'm all done.", frame: "I'm → all done", minLevel: 1, stems: ["all done"],
      steps: [{ words: ["I'm"] }, { words: ["all done"] }] }
  ];

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
  function synthetic(label) {
    return { id: "path:" + String(label).toLowerCase().replace(/\s+/g, "-"), label: label, type: "", emoji: "", _pathOnly: true };
  }
  function patternCap(ctx) {
    var set = ctx.set || "auto";
    if (set === "starter") return 1;
    if (set === "middle") return 2;
    if (set === "expanded" || set === "all") return 99;
    var lv = +ctx.level || 1;
    if (lv <= 1) return 1;
    if (lv === 2) return 2;
    return 99;
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
      return true;
    });
  }
  function matchesPool(w, pool) {
    if (pool.any) {
      for (var i = 0; i < pool.any.length; i++) if (matchesPool(w, pool.any[i])) return true;
      return false;
    }
    if (pool.page && w.page !== pool.page) return false;
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
  function choices(pattern, stepIndex, ctx) {
    var step = pattern && pattern.steps && pattern.steps[stepIndex];
    if (!step) return [];
    if (step.words) {
      var multi = step.words.length > 1, out = [];
      step.words.forEach(function (lab) {
        var w = lookup(lab, ctx);
        if (!w) { out.push(synthetic(lab)); return; }
        if (multi && ctx.hidden && ctx.hidden(w)) return;
        out.push(w);
      });
      return out;
    }
    if (step.fringe) return pickFringe(step.fringe, ctx, pattern);
    return [];
  }

  root.AAC_PATHS = {
    patterns: PATTERNS,
    visible: visible,
    choices: choices,
    lookup: lookup,
    fitzClass: fitzClass,
    byId: byId
  };
})(typeof self !== "undefined" ? self : globalThis);
