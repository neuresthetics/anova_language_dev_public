/* Word endings for the Words board (-s, -ing, -ed, 's). No DOM; app.js and tools/endings-check.js use it.
   allowed(word, kind) says whether an ending makes a real English word for THIS board word
   (by its type and page), and form(word, kind) spells it. Words that take no ending
   (again, more, stop, help me, yes, I, the, in, …) get none, so the ending button dims. */
(function (root) {
  "use strict";
  var IRREGULAR_PAST = { go: "went", eat: "ate", see: "saw", run: "ran", come: "came", do: "did", make: "made",
    get: "got", give: "gave", take: "took", sit: "sat", stand: "stood", find: "found", sleep: "slept", read: "read",
    drink: "drank", have: "had", say: "said", think: "thought", know: "knew", feel: "felt", fall: "fell",
    break: "broke", throw: "threw", catch: "caught", buy: "bought", bring: "brought", build: "built", draw: "drew",
    write: "wrote", ride: "rode", swim: "swam", sing: "sang", tell: "told", hold: "held", put: "put", cut: "cut",
    hurt: "hurt", hit: "hit", win: "won", lose: "lost", wake: "woke", wear: "wore", fly: "flew", forget: "forgot",
    begin: "began", leave: "left", keep: "kept", teach: "taught", hide: "hid", bite: "bit", blow: "blew",
    grow: "grew", feed: "fed", meet: "met", send: "sent", spend: "spent", pay: "paid", lay: "laid" };
  var VERB_S = { go: "goes", do: "does", have: "has", be: "is" };
  var IRREGULAR_PLURAL = { child: "children", man: "men", woman: "women", mouse: "mice", foot: "feet",
    tooth: "teeth", person: "people", goose: "geese", leaf: "leaves", knife: "knives", wolf: "wolves",
    shelf: "shelves", half: "halves", wife: "wives", life: "lives", calf: "calves", ox: "oxen",
    potato: "potatoes", tomato: "tomatoes", hero: "heroes", mosquito: "mosquitoes", echo: "echoes", volcano: "volcanoes",
    octopus: "octopuses", bus: "buses" };
  /* the same word for one or many ("two fish") */
  var SAME_PLURAL = { sheep: 1, fish: 1, deer: 1, moose: 1, bison: 1, shrimp: 1, squid: 1, jellyfish: 1, goldfish: 1 };
  /* already plural or uncountable: no -s */
  var NO_PLURAL = { pants: 1, eggs: 1, scissors: 1, shoes: 1, socks: 1, hands: 1, feet: 1, teeth: 1, eyes: 1,
    milk: 1, water: 1, juice: 1, cheese: 1, toast: 1, bacon: 1, steak: 1, paper: 1, glue: 1, rain: 1, music: 1 };
  /* mass only as food ("chicken" the animal counts: "chickens") */
  var MASS_AS_FOOD = { chicken: 1 };
  var IRREGULAR_ING = { be: "being", see: "seeing", lie: "lying", die: "dying", tie: "tying", begin: "beginning",
    forget: "forgetting", visit: "visiting", open: "opening", happen: "happening", listen: "listening", ski: "skiing" };
  var DOUBLE_LONG = { begin: 1, forget: 1, regret: 1, prefer: 1, admit: 1, permit: 1, upset: 1 };
  /* verbs on the board that take no ending: modals, forms of be/do/have that are already inflected,
     and "help" (on this board it is a call for help, so Jason wants it to stay as it is) */
  var VERB_NO_ENDING = { can: 1, "can't": 1, will: 1, "won't": 1, would: 1, could: 1, should: 1, must: 1, may: 1, might: 1,
    am: 1, is: 1, are: 1, help: 1, was: 1, were: 1, did: 1, does: 1, has: 1, had: 1, cares: 1, "don't": 1, "doesn't": 1 };
  /* people words that are names or pronouns (only "'s": mom's, dad's) vs people you can count */
  var NAME_PEOPLE = { mom: 1, dad: 1, grandma: 1, grandpa: 1, everyone: 1 };
  var COUNT_PEOPLE = { kid: 1, man: 1, woman: 1, vet: 1, teacher: 1, friend: 1, baby: 1, boy: 1, girl: 1, brother: 1, sister: 1,
    tummy: 1, head: 1, mouth: 1, nose: 1, hand: 1, foot: 1, eye: 1, ear: 1, arm: 1, leg: 1 };
  var BODY = { tummy: 1, head: 1, mouth: 1, nose: 1, hand: 1, foot: 1, eye: 1, ear: 1, arm: 1, leg: 1 };
  /* who can own something ("dog's", "mom's"); not body parts ("nose's") */
  var POSS_PAGES = { people: 1, animals: 1 };

  function low(w) { return String(w && (w.label != null ? w.label : w) || "").toLowerCase(); }
  function lastWord(s) { var i = s.lastIndexOf(" "); return i < 0 ? s : s.slice(i + 1); }
  function cvc(w) { return /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(w) || !!DOUBLE_LONG[w]; }

  function ing(w) {
    if (IRREGULAR_ING[w]) return IRREGULAR_ING[w];
    if (/ie$/.test(w)) return w.slice(0, -2) + "ying";
    if (/ee$/.test(w)) return w + "ing";
    if (/[^aeiouy]e$/.test(w) || (/[aiu]e$/.test(w) && w.length > 3)) return w.slice(0, -1) + "ing";
    if (cvc(w)) return w + w.slice(-1) + "ing";
    return w + "ing";
  }
  function past(w) {
    if (IRREGULAR_PAST[w]) return IRREGULAR_PAST[w];
    if (/e$/.test(w)) return w + "d";
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ied";
    if (cvc(w)) return w + w.slice(-1) + "ed";
    return w + "ed";
  }
  function verbS(w) {
    if (VERB_S[w]) return VERB_S[w];
    if (/(s|x|z|sh|ch)$/.test(w)) return w + "es";
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ies";
    return w + "s";
  }
  function plural(w) {
    if (IRREGULAR_PLURAL[w]) return IRREGULAR_PLURAL[w];
    if (SAME_PLURAL[w]) return w;
    if (/(s|x|z|sh|ch)$/.test(w)) return w + "es";
    if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ies";
    return w + "s";
  }
  function poss(w) { return w + "'s"; }   // singular owner: "the octopus's", "mom's"

  /* What kind of word this is for endings: "verb", "noun", "name", or "" (takes none). */
  function wordClass(word) {
    if (!word || word.ending || word.type === "folder") return "";
    var k = low(word);
    if (!/^[a-z' ]+$/.test(k)) return "";
    if (word.type === "verb") return VERB_NO_ENDING[k] ? "" : "verb";
    if (word.type === "noun") return "noun";
    if (word.type === "people") {
      if (NAME_PEOPLE[k]) return "name";
      if (COUNT_PEOPLE[k]) return "noun";
      return "";        // I, you, me, it, he, she, my, …
    }
    return "";          // descriptors, little words, social, negation, questions
  }
  function allowed(word, kind) { return !!form(word, kind); }
  /* The inflected text, or null when this word can't take this ending. */
  function form(word, kind) {
    var cls = wordClass(word);
    if (!cls) return null;
    var k = low(word);
    if (cls === "verb") {
      // phrasal verbs change their first word ("get dressed" → "getting dressed")
      var sp = k.indexOf(" "), head = sp > 0 ? k.slice(0, sp) : k, tail = sp > 0 ? k.slice(sp) : "";
      if (kind === "ing") return ing(head) + tail;
      if (kind === "ed") return past(head) + tail;
      if (kind === "s") return verbS(head) + tail;
      return null;      // no "'s" on a verb
    }
    if (cls === "name") return kind === "poss" ? poss(k) : null;
    // nouns
    var last = lastWord(k), mass = NO_PLURAL[last] || (MASS_AS_FOOD[last] && word.page === "food");
    if (kind === "s") return mass ? null : k.slice(0, k.length - last.length) + plural(last);
    if (kind === "poss") return POSS_PAGES[word.page] && !mass && !BODY[last] ? poss(k) : null;
    return null;        // nouns take no -ing / -ed
  }
  root.AAC_ENDINGS = { form: form, allowed: allowed, wordClass: wordClass, plural: plural, ing: ing, past: past, verbS: verbS };
})(typeof self !== "undefined" ? self : globalThis);
