/* =====================================================================
   words.js  —  the GENERIC starter board that ships with the app.
   =====================================================================
   Personal words, photos and recordings do NOT go in this file. They go in
   a "personal pack" (pack.json) that is imported on the device in parent
   mode and stored only there. A pack uses exactly the same format as the
   "pages" and "words" below, so you can copy this file's layout as a start.

   GOLDEN RULE (motor planning): once a word has a spot, never move it.
   Add new words only into EMPTY cells. To take a word away for a while,
   hide it (parent mode, or  hidden: true ). Its cell goes blank and
   nothing else moves.

   Each page is a fixed grid (rows x cols). Positions are 1-based:
   row 1 = top row, col 1 = left column.

   Word fields
     id      unique, lowercase, no spaces (used for hide/show + usage log)
     label   text shown on the button (always visible)
     page    which page it lives on ("home", "animals", ...)
     row,col its FIXED cell on that page
     type    colour group (modified Fitzgerald key):
               people      yellow
               verb        green
               descriptor  blue   (describing, colour, feeling, location words)
               noun        orange
               social      pink
               negation    red
               little      white  (little words: and, the, a ...)
               folder      opens another page (set  target: "<page id>")
     emoji   optional small symbol shown above the label
     image   optional photo (media name inside a pack, e.g. "photos/cup.jpg")
     say     optional: what the voice says, if different from the label.
             Example: "I" has  say: "eye"  because iOS reads a lone "I" as
             "capital I". Used for button taps, typed words, the message
             bar and story words alike.
     audio   optional recorded clip (media name inside a pack, e.g.
             "recordings/milk.m4a", or a URL next to the app). Played if it
             exists; otherwise the text-to-speech voice is used.
     hidden  optional: true = cell shows blank, position is kept
     level   optional priority for "Words shown" in parent settings:
               1 = starter, 2 = middle, 3 = full. Words above the chosen
               level are masked (blank cell, nothing moves). Without it a
               generic default is used (common core words 1–2, others 3).
               Folder buttons always show.
   Config field (optional): wordsShown: "starter" | "middle" | "full" =
   the default level for this board/pack until a parent picks one.
   ===================================================================== */

(function (root) {
  root.AAC_DEFAULT_CONFIG = {
    version: 1,
    name: "Starter board",

    pages: [
      { id: "home",     title: "Home",         rows: 5, cols: 8 },
      { id: "people",   title: "People",       rows: 5, cols: 8 },
      { id: "food",     title: "Food & drink", rows: 5, cols: 8 },
      { id: "animals",  title: "Animals",      rows: 5, cols: 8 },
      { id: "vehicles", title: "Vehicles",     rows: 5, cols: 8 },
      { id: "colors",   title: "Colors",       rows: 5, cols: 8 },
      { id: "feelings", title: "Feelings",     rows: 5, cols: 8 }
    ],

    words: [
      /* ---------------- HOME: core words (never move these) ---------------- */
      /* col 1: people / social */
      { id: "i",         label: "I",         page: "home", row: 1, col: 1, type: "people", emoji: "🙋", say: "eye" },
      { id: "you",       label: "you",       page: "home", row: 2, col: 1, type: "people", emoji: "👉" },
      { id: "my-turn",   label: "my turn",   page: "home", row: 3, col: 1, type: "social", emoji: "✋" },
      /* cols 2-3: verbs */
      { id: "want",      label: "want",      page: "home", row: 1, col: 2, type: "verb",   emoji: "🤲" },
      { id: "go",        label: "go",        page: "home", row: 2, col: 2, type: "verb",   emoji: "🟢" },
      { id: "eat",       label: "eat",       page: "home", row: 3, col: 2, type: "verb",   emoji: "🍽️" },
      { id: "drink",     label: "drink",     page: "home", row: 4, col: 2, type: "verb",   emoji: "🥤" },
      { id: "help",      label: "help",      page: "home", row: 1, col: 3, type: "verb",   emoji: "🆘" },
      { id: "open",      label: "open",      page: "home", row: 2, col: 3, type: "verb",   emoji: "📖" },
      { id: "play",      label: "play",      page: "home", row: 3, col: 3, type: "verb",   emoji: "🧸" },
      { id: "look",      label: "look",      page: "home", row: 4, col: 3, type: "verb",   emoji: "👀" },
      /* cols 4-5: describing + location words */
      { id: "more",      label: "more",      page: "home", row: 1, col: 4, type: "descriptor", emoji: "➕" },
      { id: "up",        label: "up",        page: "home", row: 2, col: 4, type: "descriptor", emoji: "⬆️" },
      { id: "down",      label: "down",      page: "home", row: 3, col: 4, type: "descriptor", emoji: "⬇️" },
      { id: "on",        label: "on",        page: "home", row: 2, col: 5, type: "descriptor", emoji: "🔛" },
      { id: "out",       label: "out",       page: "home", row: 3, col: 5, type: "descriptor", emoji: "🚪" },
      /* col 6: everyday nouns */
      { id: "milk",      label: "milk",      page: "home", row: 1, col: 6, type: "noun",   emoji: "🥛" },
      { id: "water",     label: "water",     page: "home", row: 2, col: 6, type: "noun",   emoji: "💧" },
      /* col 7: social */
      { id: "yes",       label: "yes",       page: "home", row: 1, col: 7, type: "social", emoji: "👍" },
      { id: "please",    label: "please",    page: "home", row: 2, col: 7, type: "social", emoji: "🙏" },
      { id: "thank-you", label: "thank you", page: "home", row: 3, col: 7, type: "social", emoji: "💗" },
      { id: "all-done",  label: "all done",  page: "home", row: 4, col: 7, type: "social", emoji: "🙌" },
      /* col 8: negation */
      { id: "no",        label: "no",        page: "home", row: 1, col: 8, type: "negation", emoji: "👎" },
      { id: "not",       label: "not",       page: "home", row: 2, col: 8, type: "negation", emoji: "🚫" },
      { id: "stop",      label: "stop",      page: "home", row: 3, col: 8, type: "negation", emoji: "🛑" },
      /* row 5: folders (category pages). The HOME tab is always top-left. */
      { id: "f-people",   label: "people",   page: "home", row: 5, col: 1, type: "folder", target: "people",   emoji: "👪" },
      { id: "f-food",     label: "food",     page: "home", row: 5, col: 2, type: "folder", target: "food",     emoji: "🍎" },
      { id: "f-animals",  label: "animals",  page: "home", row: 5, col: 3, type: "folder", target: "animals",  emoji: "🐾" },
      { id: "f-vehicles", label: "vehicles", page: "home", row: 5, col: 4, type: "folder", target: "vehicles", emoji: "🚗" },
      { id: "f-colors",   label: "colors",   page: "home", row: 5, col: 5, type: "folder", target: "colors",   emoji: "🎨" },
      { id: "f-feelings", label: "feelings", page: "home", row: 5, col: 6, type: "folder", target: "feelings", emoji: "😊" },
      /* EMPTY on home, free for new words: r1c5 r3c6 r4c1 r4c4 r4c5 r4c6 r4c8 r5c7 r5c8 */

      /* ---------------- PEOPLE ---------------- */
      { id: "mom",     label: "mom",     page: "people", row: 1, col: 1, type: "people", emoji: "👩" },
      { id: "dad",     label: "dad",     page: "people", row: 1, col: 2, type: "people", emoji: "👨" },
      { id: "me",      label: "me",      page: "people", row: 1, col: 3, type: "people", emoji: "🙋" },
      { id: "friend",  label: "friend",  page: "people", row: 1, col: 4, type: "people", emoji: "🧒" },
      { id: "teacher", label: "teacher", page: "people", row: 1, col: 5, type: "people", emoji: "🧑‍🏫" },

      /* ---------------- FOOD & DRINK ---------------- */
      { id: "food-milk",  label: "milk",   page: "food", row: 1, col: 1, type: "noun", emoji: "🥛" },
      { id: "food-water", label: "water",  page: "food", row: 1, col: 2, type: "noun", emoji: "💧" },
      { id: "cup",        label: "cup",    page: "food", row: 1, col: 3, type: "noun", emoji: "🥤" },
      { id: "snack",      label: "snack",  page: "food", row: 1, col: 4, type: "noun", emoji: "🍪" },
      { id: "apple",      label: "apple",  page: "food", row: 1, col: 5, type: "noun", emoji: "🍎" },
      { id: "banana",     label: "banana", page: "food", row: 1, col: 6, type: "noun", emoji: "🍌" },

      /* ---------------- ANIMALS ---------------- */
      { id: "cat",   label: "cat",   page: "animals", row: 1, col: 1, type: "noun", emoji: "🐱" },
      { id: "dog",   label: "dog",   page: "animals", row: 1, col: 2, type: "noun", emoji: "🐶" },
      { id: "bird",  label: "bird",  page: "animals", row: 1, col: 3, type: "noun", emoji: "🐦" },
      { id: "fish",  label: "fish",  page: "animals", row: 1, col: 4, type: "noun", emoji: "🐟" },
      { id: "cow",   label: "cow",   page: "animals", row: 1, col: 5, type: "noun", emoji: "🐮" },
      { id: "pig",   label: "pig",   page: "animals", row: 1, col: 6, type: "noun", emoji: "🐷" },
      { id: "duck",  label: "duck",  page: "animals", row: 1, col: 7, type: "noun", emoji: "🦆" },
      { id: "horse", label: "horse", page: "animals", row: 1, col: 8, type: "noun", emoji: "🐴" },

      /* ---------------- VEHICLES ---------------- */
      { id: "car",   label: "car",   page: "vehicles", row: 1, col: 1, type: "noun", emoji: "🚗" },
      { id: "bus",   label: "bus",   page: "vehicles", row: 1, col: 2, type: "noun", emoji: "🚌" },
      { id: "truck", label: "truck", page: "vehicles", row: 1, col: 3, type: "noun", emoji: "🚚" },
      { id: "train", label: "train", page: "vehicles", row: 1, col: 4, type: "noun", emoji: "🚆" },
      { id: "boat",  label: "boat",  page: "vehicles", row: 1, col: 5, type: "noun", emoji: "⛵" },
      { id: "plane", label: "plane", page: "vehicles", row: 1, col: 6, type: "noun", emoji: "✈️" },

      /* ---------------- COLORS ---------------- */
      { id: "red",    label: "red",    page: "colors", row: 1, col: 1, type: "descriptor", emoji: "🟥" },
      { id: "orange", label: "orange", page: "colors", row: 1, col: 2, type: "descriptor", emoji: "🟧" },
      { id: "yellow", label: "yellow", page: "colors", row: 1, col: 3, type: "descriptor", emoji: "🟨" },
      { id: "green",  label: "green",  page: "colors", row: 1, col: 4, type: "descriptor", emoji: "🟩" },
      { id: "blue",   label: "blue",   page: "colors", row: 1, col: 5, type: "descriptor", emoji: "🟦" },
      { id: "purple", label: "purple", page: "colors", row: 1, col: 6, type: "descriptor", emoji: "🟪" },
      { id: "pink",   label: "pink",   page: "colors", row: 1, col: 7, type: "descriptor", emoji: "🩷" },
      { id: "brown",  label: "brown",  page: "colors", row: 1, col: 8, type: "descriptor", emoji: "🟫" },
      { id: "black",  label: "black",  page: "colors", row: 2, col: 1, type: "descriptor", emoji: "⬛" },
      { id: "white",  label: "white",  page: "colors", row: 2, col: 2, type: "descriptor", emoji: "⬜" },

      /* ---------------- FEELINGS ---------------- */
      { id: "happy",  label: "happy",  page: "feelings", row: 1, col: 1, type: "descriptor", emoji: "😊" },
      { id: "sad",    label: "sad",    page: "feelings", row: 1, col: 2, type: "descriptor", emoji: "😢" },
      { id: "mad",    label: "mad",    page: "feelings", row: 1, col: 3, type: "descriptor", emoji: "😠" },
      { id: "tired",  label: "tired",  page: "feelings", row: 1, col: 4, type: "descriptor", emoji: "😴" },
      { id: "hurt",   label: "hurt",   page: "feelings", row: 1, col: 5, type: "descriptor", emoji: "🤕" },
      { id: "scared", label: "scared", page: "feelings", row: 1, col: 6, type: "descriptor", emoji: "😨" }
    ],

    /* Extra words for keyboard prediction (besides every visible button).
       Empty in the generic board; a personal pack can list known words. */
    knownWords: []
  };
})(typeof self !== "undefined" ? self : globalThis);
