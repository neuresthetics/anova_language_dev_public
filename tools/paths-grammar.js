/* Grammar audit for Paths sentences. Plain string rules, written separately from the
   sentence builder in paths.js so each checks the other. Used by tools/paths-check.js.
   check(sentence, info) -> list of problems. info: { words } (board words, for word classes). */
"use strict";
const MASS = new Set(["milk", "water", "juice", "cheese", "toast", "bacon", "chicken", "steak", "goldfish", "music", "paper", "glue", "rain"]);
const PLURALISH = new Set(["eggs", "pants", "shoes", "socks", "scissors", "hands", "feet", "teeth", "eyes", "sheep", "fish", "deer", "moose", "bison", "shrimp", "squid", "jellyfish"]);
const NAMES = new Set(["mom", "dad", "grandma", "grandpa", "me", "everyone", "home", "you", "it", "that", "bed", "school"]);
const DETS = new Set(["a", "an", "the", "my", "your", "more", "some", "to"]);
const AWKWARD = [/\bon the (cup|bath|bag|pot)\b/, /\bin the (chair|mat)\b/, /\b(open|close) the (cup|toy|ball|hat)\b/,
  /\bgo to (home|outside|inside)\b/, /\bgo to (the )?(car|bus|van|boat|jet)\b/, /\bwhere is (outside|inside|me)\b/i,
  /\b(want|like|can) to (can|cares|know|think|remember|forget)\b/, /\bsee me\b/];
/* Grammatical, but not what a parent would say. */
const ODD = [/\bsee (music|rain|chicken)\b/, /\bwhere is the (music|rain)\b/, /\bwant (more |to )?rain\b/, /\bwant (more )?music\b/,
  /\blike (bites|squeezes)\b/, /\bthe (friend|teacher)\b/, /\ba (friend|teacher)\b/];
const SPELL = [/\bmosquitos\b/, /\bpotatos\b/, /\btomatos\b/, /\bheros\b/];
const SAME_PLURAL = new Set(["sheep", "fish", "deer", "moose", "bison", "shrimp", "squid", "jellyfish", "goldfish"]);
const ALWAYS_PLURAL = new Set(["eggs", "pants", "shoes", "socks", "scissors", "hands", "feet", "teeth", "eyes", "children", "people", "mice", "geese"]);
function isPluralNoun(word, c) {
  if (!word) return false;
  if (ALWAYS_PLURAL.has(word)) return true;
  if (SAME_PLURAL.has(word) || c.nouns.has(word) || MASS.has(word)) return false;
  if (/ies$/.test(word) && c.nouns.has(word.slice(0, -3) + "y")) return true;
  if (/es$/.test(word) && c.nouns.has(word.slice(0, -2))) return true;
  if (/s$/.test(word) && c.nouns.has(word.slice(0, -1))) return true;
  return false;
}
function classes(words) {
  const verbs = new Set(), nouns = new Set();
  (words || []).forEach(function (w) {
    if (!w || w.ending || w.type === "folder") return;
    const k = String(w.label).toLowerCase();
    if (w.type === "verb") verbs.add(k);
    if (w.type === "noun" || w.type === "people") nouns.add(k);
  });
  ["eat", "drink", "play"].forEach(function (v) { verbs.add(v); });
  return { verbs: verbs, nouns: nouns };
}
function check(sentence, info) {
  const out = [], s = String(sentence || "");
  const c = info._cls || (info._cls = classes(info.words));
  if (!/^[A-Z]/.test(s)) out.push("no capital at start");
  if (!/[.?!]$/.test(s)) out.push("no full stop or question mark");
  if (/[?!.][^$]/.test(s.slice(0, -1).replace(/\.\.\./g, ""))) out.push("punctuation inside the sentence");
  const low = s.toLowerCase().replace(/[.?!,]/g, "");
  const t = low.split(/\s+/);
  for (let i = 0; i < t.length - 1; i++) {
    if (t[i] === "a" && /^[aeiou]/.test(t[i + 1])) out.push("'a' before a vowel: a " + t[i + 1]);
    if (t[i] === "an" && !/^[aeiou]/.test(t[i + 1])) out.push("'an' before a consonant: an " + t[i + 1]);
    if (t[i] === t[i + 1]) out.push("doubled word: " + t[i]);
  }
  // bare verb after want / like / don't want ("I want eat")
  const m = low.match(/\b(want|like)\s+(\w+(?: dressed)?)$/);
  if (m && c.verbs.has(m[2]) && !c.nouns.has(m[2])) out.push("verb needs 'to' or -ing: " + m[1] + " " + m[2]);
  // last word is a singular count noun with no a/an/the/more before it
  const last = t[t.length - 1], prev = t[t.length - 2] || "";
  const prev2 = t.slice(-3, -1).join(" ");
  if (c.nouns.has(last) && !MASS.has(last) && !PLURALISH.has(last) && !NAMES.has(last) && !DETS.has(prev) && !/(polar)$/.test(prev)) {
    if (!(/^(open|close) the$/.test(prev2))) out.push("noun needs a/an/the or a plural: " + prev + " " + last);
  }
  if (prev === "more" && c.nouns.has(last) && !MASS.has(last) && !PLURALISH.has(last)) out.push("'more' + singular: more " + last);
  // -ing spelling: a short verb that should double its last letter
  low.split(/\s+/).forEach(function (w) {
    const mm = w.match(/^([^aeiou]*[aeiou])([bdgmnpt])ing$/);
    if (mm && c.verbs.has(mm[1] + mm[2])) out.push("-ing spelling: " + w);
  });
  // please / thank you wrapper
  if (/\w (please|thank you)[.?!]$/i.test(s)) out.push("needs a comma before " + (s.match(/(please|thank you)/i) || [""])[0]);
  // "Where is the shoes?" -> "Where are the shoes?"
  if (/\b(is|was)\b/.test(low) && isPluralNoun(last, c)) out.push("'is' with a plural: " + last);
  if (/\bare\b/.test(low) && !isPluralNoun(last, c) && !/\byou\b/.test(low)) out.push("'are' with a singular: " + last);
  // "thank you" thanks someone; it does not ask for something
  if (/\bwant\b.*\bthank you\b/.test(low)) out.push("'thank you' used to ask for something");
  // verbs that need an object ("I want to find." / "I can make.")
  if (/\b(find|make|take|give|put|finding|making|taking|giving)( please)?$/.test(low) && !/^(put|take|give) /.test(low)) out.push("verb needs an object: " + last);
  ODD.forEach(function (re) { if (re.test(low)) out.push("odd for this sentence: " + (low.match(re) || [""])[0]); });
  SPELL.forEach(function (re) { if (re.test(low)) out.push("spelling: " + (low.match(re) || [""])[0]); });
  AWKWARD.forEach(function (re) { if (re.test(low)) out.push("awkward: " + (low.match(re) || [""])[0]); });
  return out;
}
module.exports = { check: check };
