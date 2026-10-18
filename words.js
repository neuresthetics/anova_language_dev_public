/* =====================================================================
   words.js  —  the built-in board that ships with the app.
   =====================================================================
   Since 1.3.0 this is Anova's full board (all tiers), built into the app, so
   no pack import is needed and new words arrive with app updates.
   GENERATED from aac-private/pack/pack.json by aac-private/make-builtin.py.
   Family photos and recordings do NOT go here: they live in private/overlay.js
   (private copy only, never in the public repo). Parent setting "Words shown"
   (starter / middle / expanded / sentences / full, from "levels" below) masks
   words above the chosen level.

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
     level   optional priority for "Words shown" in parent settings, 1..N as
               defined in "levels" (1 = starter, 2 = middle, 3 = expanded,
               4 = sentences, 5 = conversation). Words above the chosen level
               are masked (blank cell, nothing moves). Without it a generic
               default is used (common core words 1–2, others 3). A folder
               button with a level shows from that level on.
     sayAlone optional: what the voice says when the word is said on its own
               (e.g. "a" -> "uh", so it isn't read as the letter A). Inside a
               sentence the plain text is used.
     ending  optional: "s" | "ing" | "ed" | "poss". The button doesn't add a
               word; it changes the last word in the message bar (jump ->
               jumping, cry -> cries, go -> went, dog -> dog's). delete undoes it.
   Config fields (optional):
     levels      [{ id, n, label, hint, gate }] in order. The top level is
                 shown as "Full" (every word). gate: true = these words stay
                 masked inside folders even when "also use this level inside
                 folders" is off. Without "levels" (old packs) the classic
                 three are used: starter / middle / full.
     wordsShown  default level id for this board/pack until a parent picks one.
   ===================================================================== */

(function (root) {
  root.AAC_DEFAULT_CONFIG = {
    "version": 2,
    "name": "Anova board",
    "wordsShown": "starter",
    "levels": [
      {
        "id": "starter",
        "n": 1,
        "label": "Starter"
      },
      {
        "id": "middle",
        "n": 2,
        "label": "Middle"
      },
      {
        "id": "expanded",
        "n": 3,
        "label": "Expanded"
      },
      {
        "id": "sentences",
        "n": 4,
        "label": "Sentences",
        "hint": "adds a, the, word endings, little words",
        "gate": true
      },
      {
        "id": "conversation",
        "n": 5,
        "label": "Conversation",
        "hint": "time, thinking, school, social phrases",
        "gate": true
      }
    ],
    "pages": [
      {
        "id": "home",
        "title": "Home",
        "rows": 9,
        "cols": 10
      },
      {
        "id": "people",
        "title": "People",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "food",
        "title": "Food & drink",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "animals",
        "title": "Animals",
        "rows": 9,
        "cols": 10
      },
      {
        "id": "vehicles",
        "title": "Vehicles",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "colors",
        "title": "Colors",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "feelings",
        "title": "Feelings",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "things",
        "title": "Things",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "actions",
        "title": "Actions",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "where",
        "title": "Places",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "describe",
        "title": "Describing words",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "little",
        "title": "Little words",
        "rows": 5,
        "cols": 8
      },
      {
        "id": "time",
        "title": "Time",
        "rows": 5,
        "cols": 8
      }
    ],
    "words": [
      {
        "id": "i",
        "label": "I",
        "page": "home",
        "row": 1,
        "col": 1,
        "type": "people",
        "level": 1,
        "emoji": "🙋",
        "say": "eye"
      },
      {
        "id": "you",
        "label": "you",
        "page": "home",
        "row": 2,
        "col": 1,
        "type": "people",
        "level": 1,
        "emoji": "👉"
      },
      {
        "id": "my-turn",
        "label": "my turn",
        "page": "home",
        "row": 5,
        "col": 7,
        "type": "social",
        "level": 1,
        "emoji": "✋"
      },
      {
        "id": "want",
        "label": "want",
        "page": "home",
        "row": 1,
        "col": 2,
        "type": "verb",
        "level": 1,
        "emoji": "🤲"
      },
      {
        "id": "go",
        "label": "go",
        "page": "home",
        "row": 2,
        "col": 2,
        "type": "verb",
        "level": 1,
        "emoji": "🟢"
      },
      {
        "id": "eat",
        "label": "eat",
        "page": "home",
        "row": 5,
        "col": 2,
        "type": "verb",
        "level": 1,
        "emoji": "🍽️"
      },
      {
        "id": "drink",
        "label": "drink",
        "page": "home",
        "row": 6,
        "col": 2,
        "type": "verb",
        "level": 1,
        "emoji": "🥤"
      },
      {
        "id": "help",
        "label": "help",
        "page": "home",
        "row": 1,
        "col": 3,
        "type": "verb",
        "level": 1,
        "emoji": "🆘",
        "sign": true
      },
      {
        "id": "open",
        "label": "open",
        "page": "home",
        "row": 2,
        "col": 3,
        "type": "verb",
        "level": 1,
        "emoji": "📖"
      },
      {
        "id": "play",
        "label": "play",
        "page": "home",
        "row": 3,
        "col": 3,
        "type": "verb",
        "level": 1,
        "emoji": "🧸"
      },
      {
        "id": "look",
        "label": "look",
        "page": "home",
        "row": 4,
        "col": 3,
        "type": "verb",
        "level": 1,
        "emoji": "👀"
      },
      {
        "id": "more",
        "label": "more",
        "page": "home",
        "row": 1,
        "col": 5,
        "type": "descriptor",
        "level": 1,
        "emoji": "➕",
        "sign": true
      },
      {
        "id": "up",
        "label": "up",
        "page": "home",
        "row": 1,
        "col": 6,
        "type": "descriptor",
        "level": 1,
        "emoji": "⬆️"
      },
      {
        "id": "down",
        "label": "down",
        "page": "home",
        "row": 2,
        "col": 6,
        "type": "descriptor",
        "level": 1,
        "emoji": "⬇️"
      },
      {
        "id": "on",
        "label": "on",
        "page": "home",
        "row": 3,
        "col": 6,
        "type": "descriptor",
        "level": 2,
        "emoji": "🔛"
      },
      {
        "id": "out",
        "label": "out",
        "page": "home",
        "row": 6,
        "col": 6,
        "type": "descriptor",
        "level": 2,
        "emoji": "🚪"
      },
      {
        "id": "milk",
        "label": "milk",
        "page": "home",
        "row": 5,
        "col": 4,
        "type": "noun",
        "level": 1,
        "emoji": "🥛",
        "sign": true
      },
      {
        "id": "water",
        "label": "water",
        "page": "home",
        "row": 6,
        "col": 4,
        "type": "noun",
        "level": 1,
        "emoji": "💧",
        "sign": true
      },
      {
        "id": "yes",
        "label": "yes",
        "page": "home",
        "row": 1,
        "col": 7,
        "type": "social",
        "level": 1,
        "emoji": "👍",
        "sign": true
      },
      {
        "id": "please",
        "label": "please",
        "page": "home",
        "row": 2,
        "col": 7,
        "type": "social",
        "level": 1,
        "emoji": "🙏",
        "sign": true
      },
      {
        "id": "thank-you",
        "label": "thank you",
        "page": "home",
        "row": 3,
        "col": 7,
        "type": "social",
        "level": 1,
        "emoji": "💗",
        "sign": true
      },
      {
        "id": "all-done",
        "label": "all done",
        "page": "home",
        "row": 4,
        "col": 7,
        "type": "social",
        "level": 1,
        "emoji": "🙌",
        "sign": true
      },
      {
        "id": "no",
        "label": "no",
        "page": "home",
        "row": 1,
        "col": 8,
        "type": "negation",
        "level": 1,
        "emoji": "👎",
        "sign": true
      },
      {
        "id": "not",
        "label": "not",
        "page": "home",
        "row": 2,
        "col": 8,
        "type": "negation",
        "level": 1,
        "emoji": "🚫"
      },
      {
        "id": "stop",
        "label": "stop",
        "page": "home",
        "row": 4,
        "col": 8,
        "type": "negation",
        "level": 1,
        "emoji": "🛑"
      },
      {
        "id": "f-people",
        "label": "people",
        "page": "home",
        "row": 9,
        "col": 1,
        "type": "folder",
        "level": 1,
        "target": "people",
        "emoji": "👪"
      },
      {
        "id": "f-food",
        "label": "food",
        "page": "home",
        "row": 9,
        "col": 2,
        "type": "folder",
        "level": 1,
        "target": "food",
        "emoji": "🍎"
      },
      {
        "id": "f-animals",
        "label": "animals",
        "page": "home",
        "row": 9,
        "col": 3,
        "type": "folder",
        "level": 1,
        "target": "animals",
        "emoji": "🐾"
      },
      {
        "id": "f-vehicles",
        "label": "vehicles",
        "page": "home",
        "row": 9,
        "col": 4,
        "type": "folder",
        "level": 1,
        "target": "vehicles",
        "emoji": "🚗"
      },
      {
        "id": "f-colors",
        "label": "colors",
        "page": "home",
        "row": 9,
        "col": 5,
        "type": "folder",
        "level": 1,
        "target": "colors",
        "emoji": "🎨"
      },
      {
        "id": "f-feelings",
        "label": "feelings",
        "page": "home",
        "row": 9,
        "col": 6,
        "type": "folder",
        "level": 1,
        "target": "feelings",
        "emoji": "😊"
      },
      {
        "id": "bite",
        "label": "bite",
        "page": "food",
        "row": 2,
        "col": 4,
        "type": "noun",
        "level": 3,
        "emoji": "🍪",
        "sign": true
      },
      {
        "id": "mom",
        "label": "mom",
        "page": "people",
        "row": 1,
        "col": 1,
        "type": "people",
        "level": 3,
        "emoji": "👩"
      },
      {
        "id": "dad",
        "label": "dad",
        "page": "people",
        "row": 1,
        "col": 2,
        "type": "people",
        "level": 3,
        "emoji": "👨"
      },
      {
        "id": "me",
        "label": "me",
        "page": "people",
        "row": 1,
        "col": 3,
        "type": "people",
        "level": 3,
        "emoji": "🙋"
      },
      {
        "id": "food-milk",
        "label": "milk",
        "page": "food",
        "row": 1,
        "col": 1,
        "type": "noun",
        "level": 1,
        "emoji": "🥛"
      },
      {
        "id": "food-water",
        "label": "water",
        "page": "food",
        "row": 1,
        "col": 2,
        "type": "noun",
        "level": 1,
        "emoji": "💧"
      },
      {
        "id": "cup",
        "label": "cup",
        "page": "food",
        "row": 1,
        "col": 3,
        "type": "noun",
        "level": 3,
        "emoji": "🥤"
      },
      {
        "id": "donut",
        "label": "donut",
        "page": "food",
        "row": 1,
        "col": 4,
        "type": "noun",
        "level": 3,
        "emoji": "🍩"
      },
      {
        "id": "ant",
        "label": "ant",
        "page": "animals",
        "row": 1,
        "col": 1,
        "type": "noun",
        "level": 1,
        "emoji": "🐜"
      },
      {
        "id": "bat",
        "label": "bat",
        "page": "animals",
        "row": 1,
        "col": 3,
        "type": "noun",
        "level": 1,
        "emoji": "🦇"
      },
      {
        "id": "cat",
        "label": "cat",
        "page": "animals",
        "row": 2,
        "col": 2,
        "type": "noun",
        "level": 1,
        "emoji": "🐱"
      },
      {
        "id": "cow",
        "label": "cow",
        "page": "animals",
        "row": 2,
        "col": 7,
        "type": "noun",
        "level": 1,
        "emoji": "🐮"
      },
      {
        "id": "dog",
        "label": "dog",
        "page": "animals",
        "row": 3,
        "col": 3,
        "type": "noun",
        "level": 1,
        "emoji": "🐶"
      },
      {
        "id": "fox",
        "label": "fox",
        "page": "animals",
        "row": 4,
        "col": 3,
        "type": "noun",
        "level": 1,
        "emoji": "🦊"
      },
      {
        "id": "owl",
        "label": "owl",
        "page": "animals",
        "row": 6,
        "col": 8,
        "type": "noun",
        "level": 1,
        "emoji": "🦉"
      },
      {
        "id": "pig",
        "label": "pig",
        "page": "animals",
        "row": 7,
        "col": 3,
        "type": "noun",
        "level": 1,
        "emoji": "🐷"
      },
      {
        "id": "rat",
        "label": "rat",
        "page": "animals",
        "row": 7,
        "col": 7,
        "type": "noun",
        "level": 1,
        "emoji": "🐀"
      },
      {
        "id": "yak",
        "label": "yak",
        "page": "animals",
        "row": 9,
        "col": 8,
        "type": "noun",
        "level": 1,
        "emoji": "🐂"
      },
      {
        "id": "bird",
        "label": "bird",
        "page": "animals",
        "row": 1,
        "col": 8,
        "type": "noun",
        "level": 1,
        "emoji": "🐦"
      },
      {
        "id": "duck",
        "label": "duck",
        "page": "animals",
        "row": 3,
        "col": 7,
        "type": "noun",
        "level": 1,
        "emoji": "🦆"
      },
      {
        "id": "fish",
        "label": "fish",
        "page": "animals",
        "row": 3,
        "col": 10,
        "type": "noun",
        "level": 1,
        "emoji": "🐟"
      },
      {
        "id": "frog",
        "label": "frog",
        "page": "animals",
        "row": 4,
        "col": 4,
        "type": "noun",
        "level": 1,
        "emoji": "🐸"
      },
      {
        "id": "horse",
        "label": "horse",
        "page": "animals",
        "row": 5,
        "col": 2,
        "type": "noun",
        "level": 1,
        "emoji": "🐴"
      },
      {
        "id": "bus",
        "label": "bus",
        "page": "vehicles",
        "row": 1,
        "col": 1,
        "type": "noun",
        "level": 3,
        "emoji": "🚌"
      },
      {
        "id": "car",
        "label": "car",
        "page": "vehicles",
        "row": 1,
        "col": 2,
        "type": "noun",
        "level": 3,
        "emoji": "🚗"
      },
      {
        "id": "jet",
        "label": "jet",
        "page": "vehicles",
        "row": 1,
        "col": 3,
        "type": "noun",
        "level": 3,
        "emoji": "✈️"
      },
      {
        "id": "van",
        "label": "van",
        "page": "vehicles",
        "row": 1,
        "col": 4,
        "type": "noun",
        "level": 3,
        "emoji": "🚐"
      },
      {
        "id": "boat",
        "label": "boat",
        "page": "vehicles",
        "row": 1,
        "col": 5,
        "type": "noun",
        "level": 3,
        "emoji": "⛵"
      },
      {
        "id": "red",
        "label": "red",
        "page": "colors",
        "row": 1,
        "col": 1,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟥"
      },
      {
        "id": "pink",
        "label": "pink",
        "page": "colors",
        "row": 1,
        "col": 2,
        "type": "descriptor",
        "level": 3,
        "emoji": "🩷"
      },
      {
        "id": "brown",
        "label": "brown",
        "page": "colors",
        "row": 1,
        "col": 3,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟫"
      },
      {
        "id": "happy",
        "label": "happy",
        "page": "feelings",
        "row": 1,
        "col": 1,
        "type": "descriptor",
        "level": 3,
        "emoji": "😊"
      },
      {
        "id": "sad",
        "label": "sad",
        "page": "feelings",
        "row": 1,
        "col": 2,
        "type": "descriptor",
        "level": 3,
        "emoji": "😢"
      },
      {
        "id": "mad",
        "label": "mad",
        "page": "feelings",
        "row": 1,
        "col": 3,
        "type": "descriptor",
        "level": 3,
        "emoji": "😠"
      },
      {
        "id": "tired",
        "label": "tired",
        "page": "feelings",
        "row": 1,
        "col": 4,
        "type": "descriptor",
        "level": 3,
        "emoji": "😴"
      },
      {
        "id": "hurt",
        "label": "hurt",
        "page": "feelings",
        "row": 1,
        "col": 5,
        "type": "descriptor",
        "level": 3,
        "emoji": "🤕"
      },
      {
        "id": "and",
        "label": "and",
        "page": "home",
        "row": 3,
        "col": 4,
        "type": "little",
        "level": 2
      },
      {
        "id": "f-describe",
        "label": "describe",
        "page": "home",
        "row": 7,
        "col": 7,
        "type": "folder",
        "level": 1,
        "emoji": "✨",
        "target": "describe"
      },
      {
        "id": "f-where",
        "label": "places",
        "page": "home",
        "row": 7,
        "col": 4,
        "type": "folder",
        "level": 1,
        "emoji": "📍",
        "target": "where"
      },
      {
        "id": "f-things",
        "label": "things",
        "page": "home",
        "row": 9,
        "col": 7,
        "type": "folder",
        "level": 1,
        "emoji": "🧺",
        "target": "things"
      },
      {
        "id": "f-actions",
        "label": "actions",
        "page": "home",
        "row": 9,
        "col": 8,
        "type": "folder",
        "level": 1,
        "emoji": "🤸",
        "target": "actions"
      },
      {
        "id": "kid",
        "label": "kid",
        "page": "people",
        "row": 1,
        "col": 4,
        "type": "people",
        "level": 3,
        "emoji": "🧒"
      },
      {
        "id": "man",
        "label": "man",
        "page": "people",
        "row": 1,
        "col": 5,
        "type": "people",
        "level": 3,
        "emoji": "👨‍🦱"
      },
      {
        "id": "vet",
        "label": "vet",
        "page": "people",
        "row": 1,
        "col": 6,
        "type": "people",
        "level": 3,
        "emoji": "🧑‍⚕️"
      },
      {
        "id": "bacon",
        "label": "bacon",
        "page": "food",
        "row": 1,
        "col": 5,
        "type": "noun",
        "level": 3,
        "emoji": "🥓"
      },
      {
        "id": "eggs",
        "label": "eggs",
        "page": "food",
        "row": 1,
        "col": 6,
        "type": "noun",
        "level": 3,
        "emoji": "🍳"
      },
      {
        "id": "toast",
        "label": "toast",
        "page": "food",
        "row": 1,
        "col": 7,
        "type": "noun",
        "level": 3,
        "emoji": "🍞"
      },
      {
        "id": "squeeze",
        "label": "squeeze",
        "page": "food",
        "row": 1,
        "col": 8,
        "type": "noun",
        "level": 3,
        "emoji": "🧃",
        "say": "squeeze"
      },
      {
        "id": "goldfish-cracker",
        "label": "goldfish",
        "page": "food",
        "row": 2,
        "col": 1,
        "type": "noun",
        "level": 3,
        "emoji": "🐠"
      },
      {
        "id": "chicken",
        "label": "chicken",
        "page": "food",
        "row": 2,
        "col": 2,
        "type": "noun",
        "level": 3,
        "emoji": "🍗"
      },
      {
        "id": "steak",
        "label": "steak",
        "page": "food",
        "row": 2,
        "col": 3,
        "type": "noun",
        "level": 3,
        "emoji": "🥩"
      },
      {
        "id": "orange",
        "label": "orange",
        "page": "colors",
        "row": 1,
        "col": 4,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟧"
      },
      {
        "id": "yellow",
        "label": "yellow",
        "page": "colors",
        "row": 1,
        "col": 5,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟨"
      },
      {
        "id": "green",
        "label": "green",
        "page": "colors",
        "row": 1,
        "col": 6,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟩"
      },
      {
        "id": "blue",
        "label": "blue",
        "page": "colors",
        "row": 1,
        "col": 7,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟦"
      },
      {
        "id": "purple",
        "label": "purple",
        "page": "colors",
        "row": 1,
        "col": 8,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟪"
      },
      {
        "id": "black",
        "label": "black",
        "page": "colors",
        "row": 2,
        "col": 1,
        "type": "descriptor",
        "level": 3,
        "emoji": "⬛"
      },
      {
        "id": "white",
        "label": "white",
        "page": "colors",
        "row": 2,
        "col": 2,
        "type": "descriptor",
        "level": 3,
        "emoji": "⬜"
      },
      {
        "id": "gray",
        "label": "gray",
        "page": "colors",
        "row": 2,
        "col": 3,
        "type": "descriptor",
        "level": 3,
        "emoji": "🩶"
      },
      {
        "id": "box",
        "label": "box",
        "page": "things",
        "row": 1,
        "col": 1,
        "type": "noun",
        "level": 3,
        "emoji": "📦"
      },
      {
        "id": "bag",
        "label": "bag",
        "page": "things",
        "row": 1,
        "col": 2,
        "type": "noun",
        "level": 3,
        "emoji": "🎒"
      },
      {
        "id": "hat",
        "label": "hat",
        "page": "things",
        "row": 1,
        "col": 3,
        "type": "noun",
        "level": 3,
        "emoji": "🧢"
      },
      {
        "id": "things-cup",
        "label": "cup",
        "page": "things",
        "row": 1,
        "col": 4,
        "type": "noun",
        "level": 3,
        "emoji": "🥤"
      },
      {
        "id": "pen",
        "label": "pen",
        "page": "things",
        "row": 1,
        "col": 5,
        "type": "noun",
        "level": 3,
        "emoji": "🖊️"
      },
      {
        "id": "pot",
        "label": "pot",
        "page": "things",
        "row": 1,
        "col": 6,
        "type": "noun",
        "level": 3,
        "emoji": "🍲"
      },
      {
        "id": "mat",
        "label": "mat",
        "page": "things",
        "row": 1,
        "col": 7,
        "type": "noun",
        "level": 3
      },
      {
        "id": "toy",
        "label": "toy",
        "page": "things",
        "row": 1,
        "col": 8,
        "type": "noun",
        "level": 3,
        "emoji": "🪀"
      },
      {
        "id": "star",
        "label": "star",
        "page": "things",
        "row": 2,
        "col": 1,
        "type": "noun",
        "level": 3,
        "emoji": "⭐"
      },
      {
        "id": "hose",
        "label": "hose",
        "page": "things",
        "row": 2,
        "col": 2,
        "type": "noun",
        "level": 3
      },
      {
        "id": "pants",
        "label": "pants",
        "page": "things",
        "row": 2,
        "col": 3,
        "type": "noun",
        "level": 3,
        "emoji": "👖"
      },
      {
        "id": "things-boat",
        "label": "boat",
        "page": "things",
        "row": 2,
        "col": 4,
        "type": "noun",
        "level": 3,
        "emoji": "⛵"
      },
      {
        "id": "dot",
        "label": "dot",
        "page": "things",
        "row": 2,
        "col": 5,
        "type": "noun",
        "level": 3,
        "emoji": "⚫"
      },
      {
        "id": "rain",
        "label": "rain",
        "page": "things",
        "row": 2,
        "col": 6,
        "type": "noun",
        "level": 3,
        "emoji": "🌧️"
      },
      {
        "id": "actions-go",
        "label": "go",
        "page": "actions",
        "row": 1,
        "col": 1,
        "type": "verb",
        "level": 1,
        "emoji": "🟢"
      },
      {
        "id": "jog",
        "label": "jog",
        "page": "actions",
        "row": 1,
        "col": 2,
        "type": "verb",
        "level": 3,
        "emoji": "🏃"
      },
      {
        "id": "tap",
        "label": "tap",
        "page": "actions",
        "row": 1,
        "col": 3,
        "type": "verb",
        "level": 3,
        "emoji": "👆"
      },
      {
        "id": "pop",
        "label": "pop",
        "page": "actions",
        "row": 1,
        "col": 4,
        "type": "verb",
        "level": 3,
        "emoji": "🫧"
      },
      {
        "id": "win",
        "label": "win",
        "page": "actions",
        "row": 1,
        "col": 5,
        "type": "verb",
        "level": 3,
        "emoji": "🏆"
      },
      {
        "id": "stomp",
        "label": "stomp",
        "page": "actions",
        "row": 1,
        "col": 6,
        "type": "verb",
        "level": 3,
        "emoji": "🦶"
      },
      {
        "id": "can",
        "label": "can",
        "page": "actions",
        "row": 1,
        "col": 7,
        "type": "verb",
        "level": 3,
        "emoji": "💪"
      },
      {
        "id": "cant",
        "label": "can't",
        "page": "actions",
        "row": 2,
        "col": 1,
        "type": "negation",
        "level": 3,
        "emoji": "🚫",
        "hidden": true,
        "note": "uncertain spelling (Cant) - recheck"
      },
      {
        "id": "cares",
        "label": "cares",
        "page": "actions",
        "row": 2,
        "col": 2,
        "type": "verb",
        "level": 3,
        "emoji": "💞",
        "hidden": true,
        "note": "uncertain spelling (Cares) - recheck"
      },
      {
        "id": "where-up",
        "label": "up",
        "page": "where",
        "row": 1,
        "col": 1,
        "type": "descriptor",
        "level": 1,
        "emoji": "⬆️"
      },
      {
        "id": "where-down",
        "label": "down",
        "page": "where",
        "row": 1,
        "col": 2,
        "type": "descriptor",
        "level": 1,
        "emoji": "⬇️"
      },
      {
        "id": "where-on",
        "label": "on",
        "page": "where",
        "row": 1,
        "col": 3,
        "type": "descriptor",
        "level": 2,
        "emoji": "🔛"
      },
      {
        "id": "where-out",
        "label": "out",
        "page": "where",
        "row": 1,
        "col": 4,
        "type": "descriptor",
        "level": 2,
        "emoji": "🚪"
      },
      {
        "id": "top",
        "label": "top",
        "page": "where",
        "row": 1,
        "col": 5,
        "type": "descriptor",
        "level": 3,
        "emoji": "🔝"
      },
      {
        "id": "bad",
        "label": "bad",
        "page": "describe",
        "row": 1,
        "col": 1,
        "type": "descriptor",
        "level": 3,
        "emoji": "😖"
      },
      {
        "id": "wet",
        "label": "wet",
        "page": "describe",
        "row": 1,
        "col": 2,
        "type": "descriptor",
        "level": 3,
        "emoji": "💦"
      },
      {
        "id": "describe-red",
        "label": "red",
        "page": "describe",
        "row": 1,
        "col": 3,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟥"
      },
      {
        "id": "describe-pink",
        "label": "pink",
        "page": "describe",
        "row": 1,
        "col": 4,
        "type": "descriptor",
        "level": 3,
        "emoji": "🩷"
      },
      {
        "id": "it",
        "label": "it",
        "page": "home",
        "row": 3,
        "col": 1,
        "type": "people",
        "level": 2,
        "emoji": "🔘",
        "hidden": false
      },
      {
        "id": "that",
        "label": "that",
        "page": "home",
        "row": 4,
        "col": 1,
        "type": "people",
        "level": 2,
        "emoji": "☝️",
        "hidden": false
      },
      {
        "id": "my",
        "label": "my",
        "page": "home",
        "row": 5,
        "col": 1,
        "type": "people",
        "level": 2,
        "emoji": "💛",
        "hidden": false
      },
      {
        "id": "mine",
        "label": "mine",
        "page": "home",
        "row": 6,
        "col": 1,
        "type": "people",
        "level": 2,
        "emoji": "✊",
        "hidden": false
      },
      {
        "id": "your",
        "label": "your",
        "page": "home",
        "row": 7,
        "col": 1,
        "type": "people",
        "level": 3,
        "emoji": "🫵",
        "hidden": false
      },
      {
        "id": "get",
        "label": "get",
        "page": "home",
        "row": 8,
        "col": 2,
        "type": "verb",
        "level": 2,
        "emoji": "🫴",
        "hidden": false
      },
      {
        "id": "put",
        "label": "put",
        "page": "home",
        "row": 4,
        "col": 2,
        "type": "verb",
        "level": 3,
        "emoji": "⤵️",
        "hidden": false
      },
      {
        "id": "see",
        "label": "see",
        "page": "home",
        "row": 5,
        "col": 3,
        "type": "verb",
        "level": 2,
        "emoji": "👁️",
        "hidden": false
      },
      {
        "id": "like",
        "label": "like",
        "page": "home",
        "row": 6,
        "col": 3,
        "type": "verb",
        "level": 2,
        "emoji": "🥰",
        "hidden": false
      },
      {
        "id": "do",
        "label": "do",
        "page": "home",
        "row": 7,
        "col": 3,
        "type": "verb",
        "level": 3,
        "emoji": "🛠️",
        "hidden": false
      },
      {
        "id": "what",
        "label": "what",
        "page": "home",
        "row": 1,
        "col": 4,
        "type": "little",
        "level": 2,
        "emoji": "❓",
        "hidden": false
      },
      {
        "id": "all",
        "label": "all",
        "page": "home",
        "row": 8,
        "col": 5,
        "type": "descriptor",
        "level": 2,
        "emoji": "💯",
        "hidden": false
      },
      {
        "id": "some",
        "label": "some",
        "page": "home",
        "row": 3,
        "col": 5,
        "type": "descriptor",
        "level": 2,
        "emoji": "🤏",
        "hidden": false
      },
      {
        "id": "again",
        "label": "again",
        "page": "home",
        "row": 4,
        "col": 5,
        "type": "descriptor",
        "level": 2,
        "emoji": "🔁",
        "hidden": false
      },
      {
        "id": "good",
        "label": "good",
        "page": "home",
        "row": 5,
        "col": 5,
        "type": "descriptor",
        "level": 3,
        "emoji": "🌟",
        "hidden": false
      },
      {
        "id": "big",
        "label": "big",
        "page": "home",
        "row": 6,
        "col": 5,
        "type": "descriptor",
        "level": 3,
        "emoji": "🐘",
        "hidden": false
      },
      {
        "id": "off",
        "label": "off",
        "page": "home",
        "row": 4,
        "col": 6,
        "type": "descriptor",
        "level": 2,
        "emoji": "📴",
        "hidden": false
      },
      {
        "id": "in",
        "label": "in",
        "page": "home",
        "row": 5,
        "col": 6,
        "type": "descriptor",
        "level": 2,
        "emoji": "📥",
        "hidden": false
      },
      {
        "id": "here",
        "label": "here",
        "page": "home",
        "row": 7,
        "col": 6,
        "type": "descriptor",
        "level": 3,
        "emoji": "🔽",
        "hidden": false
      },
      {
        "id": "dont",
        "label": "don't",
        "page": "home",
        "row": 3,
        "col": 8,
        "type": "negation",
        "level": 2,
        "emoji": "⛔",
        "hidden": false
      },
      {
        "id": "hi",
        "label": "hi",
        "page": "people",
        "row": 1,
        "col": 7,
        "type": "social",
        "level": 3,
        "emoji": "👋",
        "hidden": false
      },
      {
        "id": "bye",
        "label": "bye",
        "page": "people",
        "row": 1,
        "col": 8,
        "type": "social",
        "level": 3,
        "emoji": "🚶",
        "hidden": false
      },
      {
        "id": "there",
        "label": "there",
        "page": "where",
        "row": 1,
        "col": 6,
        "type": "descriptor",
        "level": 3,
        "emoji": "↗️",
        "hidden": false
      },
      {
        "id": "where-q",
        "label": "where?",
        "page": "where",
        "row": 5,
        "col": 8,
        "type": "little",
        "level": 3,
        "emoji": "🔍",
        "say": "where",
        "hidden": false
      },
      {
        "id": "make",
        "label": "make",
        "page": "actions",
        "row": 1,
        "col": 8,
        "type": "verb",
        "level": 3,
        "emoji": "🔨",
        "hidden": false
      },
      {
        "id": "come",
        "label": "come",
        "page": "actions",
        "row": 2,
        "col": 3,
        "type": "verb",
        "level": 3,
        "emoji": "🔙",
        "hidden": false
      },
      {
        "id": "little",
        "label": "little",
        "page": "describe",
        "row": 1,
        "col": 5,
        "type": "descriptor",
        "level": 3,
        "emoji": "🐭",
        "hidden": false
      },
      {
        "id": "hot",
        "label": "hot",
        "page": "describe",
        "row": 1,
        "col": 6,
        "type": "descriptor",
        "level": 3,
        "emoji": "🔥",
        "hidden": false
      },
      {
        "id": "different",
        "label": "different",
        "page": "describe",
        "row": 1,
        "col": 7,
        "type": "descriptor",
        "level": 3,
        "emoji": "🔀",
        "hidden": false
      },
      {
        "id": "same",
        "label": "same",
        "page": "describe",
        "row": 1,
        "col": 8,
        "type": "descriptor",
        "level": 3,
        "emoji": "🟰",
        "hidden": false
      },
      {
        "id": "close",
        "label": "close",
        "page": "home",
        "row": 2,
        "col": 4,
        "type": "verb",
        "level": 1,
        "emoji": "📕"
      },
      {
        "id": "little-home",
        "label": "little",
        "page": "home",
        "row": 7,
        "col": 5,
        "type": "descriptor",
        "level": 1,
        "emoji": "🐭"
      },
      {
        "id": "he",
        "label": "he",
        "page": "home",
        "row": 1,
        "col": 9,
        "type": "people",
        "level": 1,
        "emoji": "👦"
      },
      {
        "id": "she",
        "label": "she",
        "page": "home",
        "row": 2,
        "col": 9,
        "type": "people",
        "level": 1,
        "emoji": "👧"
      },
      {
        "id": "we",
        "label": "we",
        "page": "home",
        "row": 3,
        "col": 9,
        "type": "people",
        "level": 1,
        "emoji": "👫"
      },
      {
        "id": "they",
        "label": "they",
        "page": "home",
        "row": 4,
        "col": 9,
        "type": "people",
        "level": 1,
        "emoji": "👨‍👩‍👧"
      },
      {
        "id": "this",
        "label": "this",
        "page": "home",
        "row": 5,
        "col": 9,
        "type": "little",
        "level": 1,
        "emoji": "👇"
      },
      {
        "id": "her",
        "label": "her",
        "page": "home",
        "row": 6,
        "col": 9,
        "type": "people",
        "level": 1,
        "emoji": "👩"
      },
      {
        "id": "who",
        "label": "who",
        "page": "home",
        "row": 7,
        "col": 9,
        "type": "little",
        "level": 1,
        "emoji": "❓"
      },
      {
        "id": "why",
        "label": "why",
        "page": "home",
        "row": 8,
        "col": 9,
        "type": "little",
        "level": 1,
        "emoji": "🤔"
      },
      {
        "id": "am",
        "label": "am",
        "page": "home",
        "row": 1,
        "col": 10,
        "type": "verb",
        "level": 1,
        "emoji": "🟰"
      },
      {
        "id": "is",
        "label": "is",
        "page": "home",
        "row": 2,
        "col": 10,
        "type": "verb",
        "level": 1,
        "emoji": "🟰"
      },
      {
        "id": "are",
        "label": "are",
        "page": "home",
        "row": 3,
        "col": 10,
        "type": "verb",
        "level": 1,
        "emoji": "🟰"
      },
      {
        "id": "have",
        "label": "have",
        "page": "home",
        "row": 4,
        "col": 10,
        "type": "verb",
        "level": 1,
        "emoji": "🤲"
      },
      {
        "id": "need",
        "label": "need",
        "page": "home",
        "row": 5,
        "col": 10,
        "type": "verb",
        "level": 1,
        "emoji": "❗"
      },
      {
        "id": "feel",
        "label": "feel",
        "page": "home",
        "row": 6,
        "col": 10,
        "type": "verb",
        "level": 1,
        "emoji": "💗"
      },
      {
        "id": "okay",
        "label": "okay",
        "page": "home",
        "row": 7,
        "col": 10,
        "type": "social",
        "level": 1,
        "emoji": "👌"
      },
      {
        "id": "sorry",
        "label": "sorry",
        "page": "home",
        "row": 8,
        "col": 10,
        "type": "social",
        "level": 1,
        "emoji": "😔"
      },
      {
        "id": "dont-want",
        "label": "don't want",
        "page": "home",
        "row": 5,
        "col": 8,
        "type": "negation",
        "level": 1,
        "emoji": "🙅"
      },
      {
        "id": "your-turn",
        "label": "your turn",
        "page": "home",
        "row": 6,
        "col": 7,
        "type": "social",
        "level": 1,
        "emoji": "👉"
      },
      {
        "id": "no-thank-you",
        "label": "no thank you",
        "page": "home",
        "row": 6,
        "col": 8,
        "type": "negation",
        "level": 1,
        "emoji": "🙅‍♀️"
      },
      {
        "id": "uh-oh",
        "label": "uh oh",
        "page": "home",
        "row": 7,
        "col": 8,
        "type": "social",
        "level": 1,
        "emoji": "😬"
      },
      {
        "id": "me-too",
        "label": "me too",
        "page": "home",
        "row": 7,
        "col": 2,
        "type": "social",
        "level": 1,
        "emoji": "🙋‍♀️"
      },
      {
        "id": "love-you",
        "label": "love you",
        "page": "home",
        "row": 4,
        "col": 4,
        "type": "social",
        "level": 1,
        "emoji": "❤️"
      },
      {
        "id": "under",
        "label": "under",
        "page": "where",
        "row": 2,
        "col": 1,
        "type": "little",
        "level": 1,
        "emoji": "⬇️"
      },
      {
        "id": "away",
        "label": "away",
        "page": "where",
        "row": 2,
        "col": 2,
        "type": "little",
        "level": 1,
        "emoji": "👋"
      },
      {
        "id": "off-where",
        "label": "off",
        "page": "where",
        "row": 2,
        "col": 3,
        "type": "little",
        "level": 1,
        "emoji": "📴"
      },
      {
        "id": "in-where",
        "label": "in",
        "page": "where",
        "row": 2,
        "col": 4,
        "type": "little",
        "level": 1,
        "emoji": "📥"
      },
      {
        "id": "outside",
        "label": "outside",
        "page": "where",
        "row": 2,
        "col": 5,
        "type": "little",
        "level": 1,
        "emoji": "🌳"
      },
      {
        "id": "home-where",
        "label": "home",
        "page": "where",
        "row": 2,
        "col": 6,
        "type": "little",
        "level": 1,
        "emoji": "🏠"
      },
      {
        "id": "now",
        "label": "now",
        "page": "where",
        "row": 3,
        "col": 1,
        "type": "little",
        "level": 1,
        "emoji": "⏰"
      },
      {
        "id": "cold",
        "label": "cold",
        "page": "describe",
        "row": 2,
        "col": 6,
        "type": "descriptor",
        "level": 1,
        "emoji": "🧊"
      },
      {
        "id": "too",
        "label": "too",
        "page": "describe",
        "row": 2,
        "col": 1,
        "type": "little",
        "level": 1,
        "emoji": "➕"
      },
      {
        "id": "fast",
        "label": "fast",
        "page": "describe",
        "row": 3,
        "col": 1,
        "type": "descriptor",
        "level": 1,
        "emoji": "🐇"
      },
      {
        "id": "slow",
        "label": "slow",
        "page": "describe",
        "row": 3,
        "col": 2,
        "type": "descriptor",
        "level": 1,
        "emoji": "🐢"
      },
      {
        "id": "full",
        "label": "full",
        "page": "describe",
        "row": 3,
        "col": 3,
        "type": "descriptor",
        "level": 1,
        "emoji": "🍼"
      },
      {
        "id": "empty",
        "label": "empty",
        "page": "describe",
        "row": 3,
        "col": 4,
        "type": "descriptor",
        "level": 1,
        "emoji": "🫙"
      },
      {
        "id": "clean",
        "label": "clean",
        "page": "describe",
        "row": 3,
        "col": 5,
        "type": "descriptor",
        "level": 1,
        "emoji": "🧼"
      },
      {
        "id": "dirty",
        "label": "dirty",
        "page": "describe",
        "row": 3,
        "col": 6,
        "type": "descriptor",
        "level": 1,
        "emoji": "💩"
      },
      {
        "id": "loud",
        "label": "loud",
        "page": "describe",
        "row": 3,
        "col": 7,
        "type": "descriptor",
        "level": 1,
        "emoji": "📢"
      },
      {
        "id": "quiet",
        "label": "quiet",
        "page": "describe",
        "row": 3,
        "col": 8,
        "type": "descriptor",
        "level": 1,
        "emoji": "🤫"
      },
      {
        "id": "read",
        "label": "read",
        "page": "actions",
        "row": 2,
        "col": 4,
        "type": "verb",
        "level": 1,
        "emoji": "📚"
      },
      {
        "id": "sleep",
        "label": "sleep",
        "page": "actions",
        "row": 2,
        "col": 5,
        "type": "verb",
        "level": 1,
        "emoji": "😴"
      },
      {
        "id": "wait",
        "label": "wait",
        "page": "actions",
        "row": 2,
        "col": 6,
        "type": "verb",
        "level": 1,
        "emoji": "✋"
      },
      {
        "id": "hug",
        "label": "hug",
        "page": "actions",
        "row": 2,
        "col": 7,
        "type": "verb",
        "level": 1,
        "emoji": "🤗"
      },
      {
        "id": "find",
        "label": "find",
        "page": "actions",
        "row": 2,
        "col": 8,
        "type": "verb",
        "level": 1,
        "emoji": "🔎"
      },
      {
        "id": "turn",
        "label": "turn",
        "page": "actions",
        "row": 3,
        "col": 1,
        "type": "verb",
        "level": 1,
        "emoji": "🔄"
      },
      {
        "id": "walk",
        "label": "walk",
        "page": "actions",
        "row": 3,
        "col": 2,
        "type": "verb",
        "level": 1,
        "emoji": "🚶"
      },
      {
        "id": "run",
        "label": "run",
        "page": "actions",
        "row": 3,
        "col": 3,
        "type": "verb",
        "level": 1,
        "emoji": "🏃"
      },
      {
        "id": "jump",
        "label": "jump",
        "page": "actions",
        "row": 3,
        "col": 4,
        "type": "verb",
        "level": 1,
        "emoji": "🦘"
      },
      {
        "id": "give",
        "label": "give",
        "page": "actions",
        "row": 3,
        "col": 5,
        "type": "verb",
        "level": 1,
        "emoji": "🫴"
      },
      {
        "id": "take",
        "label": "take",
        "page": "actions",
        "row": 3,
        "col": 6,
        "type": "verb",
        "level": 1,
        "emoji": "✊"
      },
      {
        "id": "sit",
        "label": "sit",
        "page": "actions",
        "row": 3,
        "col": 7,
        "type": "verb",
        "level": 1,
        "emoji": "🪑"
      },
      {
        "id": "stand",
        "label": "stand",
        "page": "actions",
        "row": 3,
        "col": 8,
        "type": "verb",
        "level": 1,
        "emoji": "🧍"
      },
      {
        "id": "scared",
        "label": "scared",
        "page": "feelings",
        "row": 1,
        "col": 6,
        "type": "descriptor",
        "level": 1,
        "emoji": "😨"
      },
      {
        "id": "hungry",
        "label": "hungry",
        "page": "feelings",
        "row": 1,
        "col": 7,
        "type": "descriptor",
        "level": 1,
        "emoji": "😋"
      },
      {
        "id": "sick",
        "label": "sick",
        "page": "feelings",
        "row": 1,
        "col": 8,
        "type": "descriptor",
        "level": 1,
        "emoji": "🤒"
      },
      {
        "id": "to",
        "label": "to",
        "page": "home",
        "row": 3,
        "col": 2,
        "type": "little",
        "level": 1,
        "emoji": "➡️"
      },
      {
        "id": "less",
        "label": "less",
        "page": "home",
        "row": 2,
        "col": 5,
        "type": "descriptor",
        "level": 1,
        "emoji": "➖"
      },
      {
        "id": "sheep",
        "label": "sheep",
        "page": "animals",
        "row": 8,
        "col": 3,
        "type": "noun",
        "level": 1,
        "emoji": "🐑"
      },
      {
        "id": "goat",
        "label": "goat",
        "page": "animals",
        "row": 4,
        "col": 6,
        "type": "noun",
        "level": 1,
        "emoji": "🐐"
      },
      {
        "id": "chicken-animal",
        "label": "chicken",
        "page": "animals",
        "row": 2,
        "col": 5,
        "type": "noun",
        "level": 1,
        "emoji": "🐔"
      },
      {
        "id": "rooster",
        "label": "rooster",
        "page": "animals",
        "row": 7,
        "col": 9,
        "type": "noun",
        "level": 2,
        "emoji": "🐓"
      },
      {
        "id": "chick",
        "label": "chick",
        "page": "animals",
        "row": 2,
        "col": 4,
        "type": "noun",
        "level": 2,
        "emoji": "🐤"
      },
      {
        "id": "turkey",
        "label": "turkey",
        "page": "animals",
        "row": 9,
        "col": 3,
        "type": "noun",
        "level": 2,
        "emoji": "🦃"
      },
      {
        "id": "donkey",
        "label": "donkey",
        "page": "animals",
        "row": 3,
        "col": 5,
        "type": "noun",
        "level": 2,
        "emoji": "🫏"
      },
      {
        "id": "goose",
        "label": "goose",
        "page": "animals",
        "row": 4,
        "col": 7,
        "type": "noun",
        "level": 2,
        "emoji": "🪿"
      },
      {
        "id": "rabbit",
        "label": "rabbit",
        "page": "animals",
        "row": 7,
        "col": 5,
        "type": "noun",
        "level": 1,
        "emoji": "🐇"
      },
      {
        "id": "mouse",
        "label": "mouse",
        "page": "animals",
        "row": 6,
        "col": 5,
        "type": "noun",
        "level": 1,
        "emoji": "🐁"
      },
      {
        "id": "lion",
        "label": "lion",
        "page": "animals",
        "row": 5,
        "col": 8,
        "type": "noun",
        "level": 1,
        "emoji": "🦁"
      },
      {
        "id": "tiger",
        "label": "tiger",
        "page": "animals",
        "row": 9,
        "col": 2,
        "type": "noun",
        "level": 1,
        "emoji": "🐅"
      },
      {
        "id": "bear",
        "label": "bear",
        "page": "animals",
        "row": 1,
        "col": 4,
        "type": "noun",
        "level": 1,
        "emoji": "🐻"
      },
      {
        "id": "monkey",
        "label": "monkey",
        "page": "animals",
        "row": 6,
        "col": 2,
        "type": "noun",
        "level": 1,
        "emoji": "🐒"
      },
      {
        "id": "elephant",
        "label": "elephant",
        "page": "animals",
        "row": 3,
        "col": 9,
        "type": "noun",
        "level": 1,
        "emoji": "🐘"
      },
      {
        "id": "giraffe",
        "label": "giraffe",
        "page": "animals",
        "row": 4,
        "col": 5,
        "type": "noun",
        "level": 1,
        "emoji": "🦒"
      },
      {
        "id": "zebra",
        "label": "zebra",
        "page": "animals",
        "row": 9,
        "col": 9,
        "type": "noun",
        "level": 1,
        "emoji": "🦓"
      },
      {
        "id": "panda",
        "label": "panda",
        "page": "animals",
        "row": 6,
        "col": 9,
        "type": "noun",
        "level": 1,
        "emoji": "🐼"
      },
      {
        "id": "kangaroo",
        "label": "kangaroo",
        "page": "animals",
        "row": 5,
        "col": 4,
        "type": "noun",
        "level": 2,
        "emoji": "🦘"
      },
      {
        "id": "koala",
        "label": "koala",
        "page": "animals",
        "row": 5,
        "col": 5,
        "type": "noun",
        "level": 2,
        "emoji": "🐨"
      },
      {
        "id": "gorilla",
        "label": "gorilla",
        "page": "animals",
        "row": 4,
        "col": 8,
        "type": "noun",
        "level": 2,
        "emoji": "🦍"
      },
      {
        "id": "hippo",
        "label": "hippo",
        "page": "animals",
        "row": 5,
        "col": 1,
        "type": "noun",
        "level": 2,
        "emoji": "🦛"
      },
      {
        "id": "rhino",
        "label": "rhino",
        "page": "animals",
        "row": 7,
        "col": 8,
        "type": "noun",
        "level": 2,
        "emoji": "🦏"
      },
      {
        "id": "camel",
        "label": "camel",
        "page": "animals",
        "row": 2,
        "col": 1,
        "type": "noun",
        "level": 2,
        "emoji": "🐪"
      },
      {
        "id": "llama",
        "label": "llama",
        "page": "animals",
        "row": 5,
        "col": 10,
        "type": "noun",
        "level": 2,
        "emoji": "🦙"
      },
      {
        "id": "leopard",
        "label": "leopard",
        "page": "animals",
        "row": 5,
        "col": 7,
        "type": "noun",
        "level": 2,
        "emoji": "🐆"
      },
      {
        "id": "wolf",
        "label": "wolf",
        "page": "animals",
        "row": 9,
        "col": 6,
        "type": "noun",
        "level": 2,
        "emoji": "🐺"
      },
      {
        "id": "deer",
        "label": "deer",
        "page": "animals",
        "row": 3,
        "col": 1,
        "type": "noun",
        "level": 2,
        "emoji": "🦌"
      },
      {
        "id": "polar-bear",
        "label": "polar bear",
        "page": "animals",
        "row": 7,
        "col": 4,
        "type": "noun",
        "level": 2,
        "emoji": "🐻‍❄️"
      },
      {
        "id": "raccoon",
        "label": "raccoon",
        "page": "animals",
        "row": 7,
        "col": 6,
        "type": "noun",
        "level": 2,
        "emoji": "🦝"
      },
      {
        "id": "hamster",
        "label": "hamster",
        "page": "animals",
        "row": 4,
        "col": 9,
        "type": "noun",
        "level": 2,
        "emoji": "🐹"
      },
      {
        "id": "hedgehog",
        "label": "hedgehog",
        "page": "animals",
        "row": 4,
        "col": 10,
        "type": "noun",
        "level": 2,
        "emoji": "🦔"
      },
      {
        "id": "otter",
        "label": "otter",
        "page": "animals",
        "row": 6,
        "col": 7,
        "type": "noun",
        "level": 2,
        "emoji": "🦦"
      },
      {
        "id": "skunk",
        "label": "skunk",
        "page": "animals",
        "row": 8,
        "col": 5,
        "type": "noun",
        "level": 3,
        "emoji": "🦨"
      },
      {
        "id": "sloth",
        "label": "sloth",
        "page": "animals",
        "row": 8,
        "col": 6,
        "type": "noun",
        "level": 3,
        "emoji": "🦥"
      },
      {
        "id": "beaver",
        "label": "beaver",
        "page": "animals",
        "row": 1,
        "col": 5,
        "type": "noun",
        "level": 3,
        "emoji": "🦫"
      },
      {
        "id": "chipmunk",
        "label": "chipmunk",
        "page": "animals",
        "row": 2,
        "col": 6,
        "type": "noun",
        "level": 3,
        "emoji": "🐿️"
      },
      {
        "id": "badger",
        "label": "badger",
        "page": "animals",
        "row": 1,
        "col": 2,
        "type": "noun",
        "level": 3,
        "emoji": "🦡"
      },
      {
        "id": "moose",
        "label": "moose",
        "page": "animals",
        "row": 6,
        "col": 3,
        "type": "noun",
        "level": 3,
        "emoji": "🫎"
      },
      {
        "id": "bison",
        "label": "bison",
        "page": "animals",
        "row": 1,
        "col": 9,
        "type": "noun",
        "level": 3,
        "emoji": "🦬"
      },
      {
        "id": "penguin",
        "label": "penguin",
        "page": "animals",
        "row": 7,
        "col": 2,
        "type": "noun",
        "level": 1,
        "emoji": "🐧"
      },
      {
        "id": "parrot",
        "label": "parrot",
        "page": "animals",
        "row": 6,
        "col": 10,
        "type": "noun",
        "level": 2,
        "emoji": "🦜"
      },
      {
        "id": "eagle",
        "label": "eagle",
        "page": "animals",
        "row": 3,
        "col": 8,
        "type": "noun",
        "level": 2,
        "emoji": "🦅"
      },
      {
        "id": "swan",
        "label": "swan",
        "page": "animals",
        "row": 9,
        "col": 1,
        "type": "noun",
        "level": 2,
        "emoji": "🦢"
      },
      {
        "id": "flamingo",
        "label": "flamingo",
        "page": "animals",
        "row": 4,
        "col": 1,
        "type": "noun",
        "level": 2,
        "emoji": "🦩"
      },
      {
        "id": "peacock",
        "label": "peacock",
        "page": "animals",
        "row": 7,
        "col": 1,
        "type": "noun",
        "level": 2,
        "emoji": "🦚"
      },
      {
        "id": "dove",
        "label": "dove",
        "page": "animals",
        "row": 3,
        "col": 6,
        "type": "noun",
        "level": 2,
        "emoji": "🕊️"
      },
      {
        "id": "turtle",
        "label": "turtle",
        "page": "animals",
        "row": 9,
        "col": 4,
        "type": "noun",
        "level": 1,
        "emoji": "🐢"
      },
      {
        "id": "snake",
        "label": "snake",
        "page": "animals",
        "row": 8,
        "col": 8,
        "type": "noun",
        "level": 1,
        "emoji": "🐍"
      },
      {
        "id": "lizard",
        "label": "lizard",
        "page": "animals",
        "row": 5,
        "col": 9,
        "type": "noun",
        "level": 2,
        "emoji": "🦎"
      },
      {
        "id": "crocodile",
        "label": "crocodile",
        "page": "animals",
        "row": 2,
        "col": 10,
        "type": "noun",
        "level": 2,
        "emoji": "🐊"
      },
      {
        "id": "dinosaur",
        "label": "dinosaur",
        "page": "animals",
        "row": 3,
        "col": 2,
        "type": "noun",
        "level": 1,
        "emoji": "🦖"
      },
      {
        "id": "whale",
        "label": "whale",
        "page": "animals",
        "row": 9,
        "col": 5,
        "type": "noun",
        "level": 1,
        "emoji": "🐳"
      },
      {
        "id": "dolphin",
        "label": "dolphin",
        "page": "animals",
        "row": 3,
        "col": 4,
        "type": "noun",
        "level": 1,
        "emoji": "🐬"
      },
      {
        "id": "shark",
        "label": "shark",
        "page": "animals",
        "row": 8,
        "col": 2,
        "type": "noun",
        "level": 1,
        "emoji": "🦈"
      },
      {
        "id": "seal",
        "label": "seal",
        "page": "animals",
        "row": 8,
        "col": 1,
        "type": "noun",
        "level": 2,
        "emoji": "🦭"
      },
      {
        "id": "octopus",
        "label": "octopus",
        "page": "animals",
        "row": 6,
        "col": 6,
        "type": "noun",
        "level": 1,
        "emoji": "🐙"
      },
      {
        "id": "jellyfish",
        "label": "jellyfish",
        "page": "animals",
        "row": 5,
        "col": 3,
        "type": "noun",
        "level": 2,
        "emoji": "🪼"
      },
      {
        "id": "crab",
        "label": "crab",
        "page": "animals",
        "row": 2,
        "col": 8,
        "type": "noun",
        "level": 1,
        "emoji": "🦀"
      },
      {
        "id": "snail",
        "label": "snail",
        "page": "animals",
        "row": 8,
        "col": 7,
        "type": "noun",
        "level": 2,
        "emoji": "🐌"
      },
      {
        "id": "lobster",
        "label": "lobster",
        "page": "animals",
        "row": 6,
        "col": 1,
        "type": "noun",
        "level": 3,
        "emoji": "🦞"
      },
      {
        "id": "shrimp",
        "label": "shrimp",
        "page": "animals",
        "row": 8,
        "col": 4,
        "type": "noun",
        "level": 3,
        "emoji": "🦐"
      },
      {
        "id": "squid",
        "label": "squid",
        "page": "animals",
        "row": 8,
        "col": 10,
        "type": "noun",
        "level": 3,
        "emoji": "🦑"
      },
      {
        "id": "bee",
        "label": "bee",
        "page": "animals",
        "row": 1,
        "col": 6,
        "type": "noun",
        "level": 1,
        "emoji": "🐝"
      },
      {
        "id": "butterfly",
        "label": "butterfly",
        "page": "animals",
        "row": 1,
        "col": 10,
        "type": "noun",
        "level": 1,
        "emoji": "🦋"
      },
      {
        "id": "ladybug",
        "label": "ladybug",
        "page": "animals",
        "row": 5,
        "col": 6,
        "type": "noun",
        "level": 1,
        "emoji": "🐞"
      },
      {
        "id": "spider",
        "label": "spider",
        "page": "animals",
        "row": 8,
        "col": 9,
        "type": "noun",
        "level": 1,
        "emoji": "🕷️"
      },
      {
        "id": "worm",
        "label": "worm",
        "page": "animals",
        "row": 9,
        "col": 7,
        "type": "noun",
        "level": 1,
        "emoji": "🪱"
      },
      {
        "id": "caterpillar",
        "label": "caterpillar",
        "page": "animals",
        "row": 2,
        "col": 3,
        "type": "noun",
        "level": 2,
        "emoji": "🐛"
      },
      {
        "id": "beetle",
        "label": "beetle",
        "page": "animals",
        "row": 1,
        "col": 7,
        "type": "noun",
        "level": 2,
        "emoji": "🪲"
      },
      {
        "id": "fly",
        "label": "fly",
        "page": "animals",
        "row": 4,
        "col": 2,
        "type": "noun",
        "level": 2,
        "emoji": "🪰"
      },
      {
        "id": "cricket",
        "label": "cricket",
        "page": "animals",
        "row": 2,
        "col": 9,
        "type": "noun",
        "level": 3,
        "emoji": "🦗"
      },
      {
        "id": "mosquito",
        "label": "mosquito",
        "page": "animals",
        "row": 6,
        "col": 4,
        "type": "noun",
        "level": 3,
        "emoji": "🦟"
      },
      {
        "id": "scorpion",
        "label": "scorpion",
        "page": "animals",
        "row": 7,
        "col": 10,
        "type": "noun",
        "level": 3,
        "emoji": "🦂"
      },
      {
        "id": "a",
        "label": "a",
        "page": "home",
        "row": 8,
        "col": 1,
        "type": "little",
        "level": 4,
        "emoji": "🔹",
        "sayAlone": "uh"
      },
      {
        "id": "the",
        "label": "the",
        "page": "home",
        "row": 8,
        "col": 3,
        "type": "little",
        "level": 4,
        "emoji": "🔷",
        "sayAlone": "thuh"
      },
      {
        "id": "when",
        "label": "when",
        "page": "home",
        "row": 8,
        "col": 4,
        "type": "little",
        "level": 4,
        "emoji": "🕐"
      },
      {
        "id": "end-s",
        "label": "-s",
        "page": "home",
        "row": 8,
        "col": 6,
        "type": "little",
        "level": 4,
        "emoji": "👥",
        "ending": "s"
      },
      {
        "id": "end-ing",
        "label": "-ing",
        "page": "home",
        "row": 8,
        "col": 7,
        "type": "little",
        "level": 4,
        "emoji": "▶️",
        "ending": "ing"
      },
      {
        "id": "end-ed",
        "label": "-ed",
        "page": "home",
        "row": 8,
        "col": 8,
        "type": "little",
        "level": 4,
        "emoji": "⏪",
        "ending": "ed"
      },
      {
        "id": "f-little",
        "label": "little words",
        "page": "home",
        "row": 9,
        "col": 9,
        "type": "folder",
        "level": 4,
        "emoji": "🧩",
        "target": "little"
      },
      {
        "id": "f-time",
        "label": "time",
        "page": "home",
        "row": 9,
        "col": 10,
        "type": "folder",
        "level": 5,
        "emoji": "⏳",
        "target": "time"
      },
      {
        "id": "how",
        "label": "how",
        "page": "little",
        "row": 1,
        "col": 1,
        "type": "little",
        "level": 4,
        "emoji": "⚙️"
      },
      {
        "id": "which",
        "label": "which",
        "page": "little",
        "row": 1,
        "col": 2,
        "type": "little",
        "level": 4,
        "emoji": "🔀"
      },
      {
        "id": "whereq",
        "label": "where?",
        "page": "little",
        "row": 1,
        "col": 3,
        "type": "little",
        "level": 4,
        "emoji": "🔍"
      },
      {
        "id": "how-many",
        "label": "how many",
        "page": "little",
        "row": 1,
        "col": 4,
        "type": "little",
        "level": 4,
        "emoji": "🔢"
      },
      {
        "id": "because",
        "label": "because",
        "page": "little",
        "row": 2,
        "col": 1,
        "type": "little",
        "level": 4,
        "emoji": "🔑"
      },
      {
        "id": "but",
        "label": "but",
        "page": "little",
        "row": 2,
        "col": 2,
        "type": "little",
        "level": 4,
        "emoji": "🔃"
      },
      {
        "id": "or",
        "label": "or",
        "page": "little",
        "row": 2,
        "col": 3,
        "type": "little",
        "level": 4,
        "emoji": "⚖️"
      },
      {
        "id": "if",
        "label": "if",
        "page": "little",
        "row": 2,
        "col": 4,
        "type": "little",
        "level": 4,
        "emoji": "🎲"
      },
      {
        "id": "so",
        "label": "so",
        "page": "little",
        "row": 2,
        "col": 5,
        "type": "little",
        "level": 4,
        "emoji": "⏭️"
      },
      {
        "id": "with",
        "label": "with",
        "page": "little",
        "row": 3,
        "col": 1,
        "type": "little",
        "level": 4,
        "emoji": "🤝"
      },
      {
        "id": "for",
        "label": "for",
        "page": "little",
        "row": 3,
        "col": 2,
        "type": "little",
        "level": 4,
        "emoji": "🎁"
      },
      {
        "id": "of",
        "label": "of",
        "page": "little",
        "row": 3,
        "col": 3,
        "type": "little",
        "level": 4,
        "emoji": "🔗"
      },
      {
        "id": "at",
        "label": "at",
        "page": "little",
        "row": 3,
        "col": 4,
        "type": "little",
        "level": 4,
        "emoji": "📌"
      },
      {
        "id": "from",
        "label": "from",
        "page": "little",
        "row": 3,
        "col": 5,
        "type": "little",
        "level": 4,
        "emoji": "📤"
      },
      {
        "id": "about",
        "label": "about",
        "page": "little",
        "row": 3,
        "col": 6,
        "type": "little",
        "level": 4,
        "emoji": "💬"
      },
      {
        "id": "was",
        "label": "was",
        "page": "little",
        "row": 4,
        "col": 1,
        "type": "verb",
        "level": 4,
        "emoji": "⏮️"
      },
      {
        "id": "were",
        "label": "were",
        "page": "little",
        "row": 4,
        "col": 2,
        "type": "verb",
        "level": 4,
        "emoji": "⏮️"
      },
      {
        "id": "did",
        "label": "did",
        "page": "little",
        "row": 4,
        "col": 3,
        "type": "verb",
        "level": 4,
        "emoji": "✔️"
      },
      {
        "id": "does",
        "label": "does",
        "page": "little",
        "row": 4,
        "col": 4,
        "type": "verb",
        "level": 4,
        "emoji": "🛠️"
      },
      {
        "id": "has",
        "label": "has",
        "page": "little",
        "row": 4,
        "col": 5,
        "type": "verb",
        "level": 4,
        "emoji": "🤲"
      },
      {
        "id": "will",
        "label": "will",
        "page": "little",
        "row": 4,
        "col": 6,
        "type": "verb",
        "level": 4,
        "emoji": "🔮"
      },
      {
        "id": "wont",
        "label": "won't",
        "page": "little",
        "row": 4,
        "col": 7,
        "type": "verb",
        "level": 4,
        "emoji": "🚫"
      },
      {
        "id": "him",
        "label": "him",
        "page": "little",
        "row": 5,
        "col": 1,
        "type": "people",
        "level": 4,
        "emoji": "👦"
      },
      {
        "id": "his",
        "label": "his",
        "page": "little",
        "row": 5,
        "col": 2,
        "type": "people",
        "level": 4,
        "emoji": "👦"
      },
      {
        "id": "us",
        "label": "us",
        "page": "little",
        "row": 5,
        "col": 3,
        "type": "people",
        "level": 4,
        "emoji": "👫"
      },
      {
        "id": "our",
        "label": "our",
        "page": "little",
        "row": 5,
        "col": 4,
        "type": "people",
        "level": 4,
        "emoji": "👫"
      },
      {
        "id": "them",
        "label": "them",
        "page": "little",
        "row": 5,
        "col": 5,
        "type": "people",
        "level": 4,
        "emoji": "👨‍👩‍👧"
      },
      {
        "id": "their",
        "label": "their",
        "page": "little",
        "row": 5,
        "col": 6,
        "type": "people",
        "level": 4,
        "emoji": "👨‍👩‍👧"
      },
      {
        "id": "its",
        "label": "its",
        "page": "little",
        "row": 5,
        "col": 7,
        "type": "people",
        "level": 4,
        "emoji": "🔘"
      },
      {
        "id": "end-poss",
        "label": "'s",
        "page": "little",
        "row": 5,
        "col": 8,
        "type": "little",
        "level": 4,
        "emoji": "🏷️",
        "ending": "poss"
      },
      {
        "id": "finished",
        "label": "finished",
        "page": "describe",
        "row": 2,
        "col": 2,
        "type": "descriptor",
        "level": 4,
        "emoji": "🏁"
      },
      {
        "id": "yesterday",
        "label": "yesterday",
        "page": "time",
        "row": 1,
        "col": 1,
        "type": "little",
        "level": 5,
        "emoji": "⏪"
      },
      {
        "id": "today",
        "label": "today",
        "page": "time",
        "row": 1,
        "col": 2,
        "type": "little",
        "level": 5,
        "emoji": "📅"
      },
      {
        "id": "tomorrow",
        "label": "tomorrow",
        "page": "time",
        "row": 1,
        "col": 3,
        "type": "little",
        "level": 5,
        "emoji": "⏩"
      },
      {
        "id": "before",
        "label": "before",
        "page": "time",
        "row": 1,
        "col": 5,
        "type": "little",
        "level": 5,
        "emoji": "⬅️"
      },
      {
        "id": "after",
        "label": "after",
        "page": "time",
        "row": 1,
        "col": 6,
        "type": "little",
        "level": 5,
        "emoji": "➡️"
      },
      {
        "id": "day",
        "label": "day",
        "page": "time",
        "row": 2,
        "col": 1,
        "type": "little",
        "level": 5,
        "emoji": "☀️"
      },
      {
        "id": "night",
        "label": "night",
        "page": "time",
        "row": 2,
        "col": 2,
        "type": "little",
        "level": 5,
        "emoji": "🌙"
      },
      {
        "id": "morning",
        "label": "morning",
        "page": "time",
        "row": 2,
        "col": 4,
        "type": "little",
        "level": 5,
        "emoji": "🌅"
      },
      {
        "id": "afternoon",
        "label": "afternoon",
        "page": "time",
        "row": 2,
        "col": 5,
        "type": "little",
        "level": 5,
        "emoji": "🌤️"
      },
      {
        "id": "evening",
        "label": "evening",
        "page": "time",
        "row": 2,
        "col": 6,
        "type": "little",
        "level": 5,
        "emoji": "🌆"
      },
      {
        "id": "early",
        "label": "early",
        "page": "time",
        "row": 3,
        "col": 1,
        "type": "little",
        "level": 5,
        "emoji": "🐓"
      },
      {
        "id": "late",
        "label": "late",
        "page": "time",
        "row": 3,
        "col": 2,
        "type": "little",
        "level": 5,
        "emoji": "⏰"
      },
      {
        "id": "soon",
        "label": "soon",
        "page": "time",
        "row": 3,
        "col": 4,
        "type": "little",
        "level": 5,
        "emoji": "⏳"
      },
      {
        "id": "later",
        "label": "later",
        "page": "time",
        "row": 3,
        "col": 5,
        "type": "little",
        "level": 5,
        "emoji": "🕑"
      },
      {
        "id": "first",
        "label": "first",
        "page": "time",
        "row": 3,
        "col": 6,
        "type": "little",
        "level": 5,
        "emoji": "1️⃣"
      },
      {
        "id": "then",
        "label": "then",
        "page": "time",
        "row": 3,
        "col": 7,
        "type": "little",
        "level": 5,
        "emoji": "↪️"
      },
      {
        "id": "last",
        "label": "last",
        "page": "time",
        "row": 3,
        "col": 8,
        "type": "little",
        "level": 5,
        "emoji": "🔚"
      },
      {
        "id": "week",
        "label": "week",
        "page": "time",
        "row": 4,
        "col": 1,
        "type": "noun",
        "level": 5,
        "emoji": "🗓️"
      },
      {
        "id": "weekend",
        "label": "weekend",
        "page": "time",
        "row": 4,
        "col": 2,
        "type": "noun",
        "level": 5,
        "emoji": "😎"
      },
      {
        "id": "birthday",
        "label": "birthday",
        "page": "time",
        "row": 4,
        "col": 3,
        "type": "noun",
        "level": 5,
        "emoji": "🎂"
      },
      {
        "id": "holiday",
        "label": "holiday",
        "page": "time",
        "row": 4,
        "col": 4,
        "type": "noun",
        "level": 5,
        "emoji": "🎉"
      },
      {
        "id": "think",
        "label": "think",
        "page": "actions",
        "row": 4,
        "col": 1,
        "type": "verb",
        "level": 5,
        "emoji": "💭"
      },
      {
        "id": "know",
        "label": "know",
        "page": "actions",
        "row": 4,
        "col": 2,
        "type": "verb",
        "level": 5,
        "emoji": "💡"
      },
      {
        "id": "remember",
        "label": "remember",
        "page": "actions",
        "row": 4,
        "col": 3,
        "type": "verb",
        "level": 5,
        "emoji": "🧠"
      },
      {
        "id": "forget",
        "label": "forget",
        "page": "actions",
        "row": 4,
        "col": 4,
        "type": "verb",
        "level": 5,
        "emoji": "🫥"
      },
      {
        "id": "try",
        "label": "try",
        "page": "actions",
        "row": 4,
        "col": 5,
        "type": "verb",
        "level": 5,
        "emoji": "🎯"
      },
      {
        "id": "wish",
        "label": "wish",
        "page": "actions",
        "row": 4,
        "col": 6,
        "type": "verb",
        "level": 5,
        "emoji": "🌠"
      },
      {
        "id": "guess",
        "label": "guess",
        "page": "actions",
        "row": 4,
        "col": 7,
        "type": "verb",
        "level": 5,
        "emoji": "🤷"
      },
      {
        "id": "pretend",
        "label": "pretend",
        "page": "actions",
        "row": 4,
        "col": 8,
        "type": "verb",
        "level": 5,
        "emoji": "🎭"
      },
      {
        "id": "write",
        "label": "write",
        "page": "actions",
        "row": 5,
        "col": 1,
        "type": "verb",
        "level": 5,
        "emoji": "✍️"
      },
      {
        "id": "draw",
        "label": "draw",
        "page": "actions",
        "row": 5,
        "col": 2,
        "type": "verb",
        "level": 5,
        "emoji": "✏️"
      },
      {
        "id": "paint",
        "label": "paint",
        "page": "actions",
        "row": 5,
        "col": 3,
        "type": "verb",
        "level": 5,
        "emoji": "🖌️"
      },
      {
        "id": "listen",
        "label": "listen",
        "page": "actions",
        "row": 5,
        "col": 4,
        "type": "verb",
        "level": 5,
        "emoji": "👂"
      },
      {
        "id": "learn",
        "label": "learn",
        "page": "actions",
        "row": 5,
        "col": 5,
        "type": "verb",
        "level": 5,
        "emoji": "🎓"
      },
      {
        "id": "talk",
        "label": "talk",
        "page": "actions",
        "row": 5,
        "col": 6,
        "type": "verb",
        "level": 5,
        "emoji": "🗣️"
      },
      {
        "id": "wash",
        "label": "wash",
        "page": "actions",
        "row": 5,
        "col": 7,
        "type": "verb",
        "level": 5,
        "emoji": "🧽"
      },
      {
        "id": "watch",
        "label": "watch",
        "page": "actions",
        "row": 5,
        "col": 8,
        "type": "verb",
        "level": 5,
        "emoji": "📺"
      },
      {
        "id": "maybe",
        "label": "maybe",
        "page": "describe",
        "row": 4,
        "col": 1,
        "type": "descriptor",
        "level": 5,
        "emoji": "🤷‍♀️"
      },
      {
        "id": "really",
        "label": "really",
        "page": "describe",
        "row": 4,
        "col": 2,
        "type": "descriptor",
        "level": 5,
        "emoji": "😮"
      },
      {
        "id": "true",
        "label": "true",
        "page": "describe",
        "row": 4,
        "col": 3,
        "type": "descriptor",
        "level": 5,
        "emoji": "✅"
      },
      {
        "id": "funny",
        "label": "funny",
        "page": "describe",
        "row": 4,
        "col": 4,
        "type": "descriptor",
        "level": 5,
        "emoji": "😂"
      },
      {
        "id": "silly",
        "label": "silly",
        "page": "describe",
        "row": 4,
        "col": 5,
        "type": "descriptor",
        "level": 5,
        "emoji": "🤪"
      },
      {
        "id": "easy",
        "label": "easy",
        "page": "describe",
        "row": 4,
        "col": 6,
        "type": "descriptor",
        "level": 5,
        "emoji": "🍰"
      },
      {
        "id": "hard",
        "label": "hard",
        "page": "describe",
        "row": 4,
        "col": 7,
        "type": "descriptor",
        "level": 5,
        "emoji": "🪨"
      },
      {
        "id": "nice",
        "label": "nice",
        "page": "describe",
        "row": 4,
        "col": 8,
        "type": "descriptor",
        "level": 5,
        "emoji": "🌸"
      },
      {
        "id": "teacher",
        "label": "teacher",
        "page": "people",
        "row": 2,
        "col": 1,
        "type": "people",
        "level": 5,
        "emoji": "🧑‍🏫"
      },
      {
        "id": "friend",
        "label": "friend",
        "page": "people",
        "row": 2,
        "col": 2,
        "type": "people",
        "level": 5,
        "emoji": "🧑‍🤝‍🧑"
      },
      {
        "id": "baby",
        "label": "baby",
        "page": "people",
        "row": 2,
        "col": 3,
        "type": "people",
        "level": 5,
        "emoji": "👶"
      },
      {
        "id": "grandma",
        "label": "grandma",
        "page": "people",
        "row": 2,
        "col": 4,
        "type": "people",
        "level": 5,
        "emoji": "👵"
      },
      {
        "id": "grandpa",
        "label": "grandpa",
        "page": "people",
        "row": 2,
        "col": 5,
        "type": "people",
        "level": 5,
        "emoji": "👴"
      },
      {
        "id": "everyone",
        "label": "everyone",
        "page": "people",
        "row": 2,
        "col": 6,
        "type": "people",
        "level": 5,
        "emoji": "🌍"
      },
      {
        "id": "how-are-you",
        "label": "how are you",
        "page": "people",
        "row": 3,
        "col": 1,
        "type": "social",
        "level": 5,
        "emoji": "🙂"
      },
      {
        "id": "whats-up",
        "label": "what's up",
        "page": "people",
        "row": 3,
        "col": 2,
        "type": "social",
        "level": 5,
        "emoji": "🆙"
      },
      {
        "id": "guess-what",
        "label": "guess what",
        "page": "people",
        "row": 3,
        "col": 3,
        "type": "social",
        "level": 5,
        "emoji": "🤩"
      },
      {
        "id": "excuse-me",
        "label": "excuse me",
        "page": "people",
        "row": 3,
        "col": 4,
        "type": "social",
        "level": 5,
        "emoji": "🙇"
      },
      {
        "id": "my-name-is",
        "label": "my name is",
        "page": "people",
        "row": 3,
        "col": 5,
        "type": "social",
        "level": 5,
        "emoji": "📛"
      },
      {
        "id": "see-you-later",
        "label": "see you later",
        "page": "people",
        "row": 3,
        "col": 6,
        "type": "social",
        "level": 5,
        "emoji": "🙋‍♂️"
      },
      {
        "id": "good-job",
        "label": "good job",
        "page": "people",
        "row": 3,
        "col": 7,
        "type": "social",
        "level": 5,
        "emoji": "👏"
      },
      {
        "id": "i-dont-know",
        "label": "I don't know",
        "page": "people",
        "row": 3,
        "col": 8,
        "type": "social",
        "level": 5,
        "emoji": "🤷‍♂️"
      },
      {
        "id": "book",
        "label": "book",
        "page": "things",
        "row": 3,
        "col": 1,
        "type": "noun",
        "level": 5,
        "emoji": "📘"
      },
      {
        "id": "paper",
        "label": "paper",
        "page": "things",
        "row": 3,
        "col": 2,
        "type": "noun",
        "level": 5,
        "emoji": "📄"
      },
      {
        "id": "crayon",
        "label": "crayon",
        "page": "things",
        "row": 3,
        "col": 3,
        "type": "noun",
        "level": 5,
        "emoji": "🖍️"
      },
      {
        "id": "scissors",
        "label": "scissors",
        "page": "things",
        "row": 3,
        "col": 4,
        "type": "noun",
        "level": 5,
        "emoji": "✂️"
      },
      {
        "id": "glue",
        "label": "glue",
        "page": "things",
        "row": 3,
        "col": 5,
        "type": "noun",
        "level": 5,
        "emoji": "🧴"
      },
      {
        "id": "computer",
        "label": "computer",
        "page": "things",
        "row": 3,
        "col": 6,
        "type": "noun",
        "level": 5,
        "emoji": "💻"
      },
      {
        "id": "music",
        "label": "music",
        "page": "things",
        "row": 3,
        "col": 7,
        "type": "noun",
        "level": 5,
        "emoji": "🎵"
      },
      {
        "id": "ball",
        "label": "ball",
        "page": "things",
        "row": 3,
        "col": 8,
        "type": "noun",
        "level": 5,
        "emoji": "⚽"
      },
      {
        "id": "school",
        "label": "school",
        "page": "where",
        "row": 3,
        "col": 2,
        "type": "noun",
        "level": 5,
        "emoji": "🏫"
      },
      {
        "id": "park",
        "label": "park",
        "page": "where",
        "row": 3,
        "col": 3,
        "type": "noun",
        "level": 5,
        "emoji": "🏞️"
      },
      {
        "id": "store",
        "label": "store",
        "page": "where",
        "row": 3,
        "col": 4,
        "type": "noun",
        "level": 5,
        "emoji": "🏪"
      },
      {
        "id": "inside",
        "label": "inside",
        "page": "where",
        "row": 3,
        "col": 5,
        "type": "little",
        "level": 5,
        "emoji": "🛋️"
      },
      {
        "id": "playground",
        "label": "playground",
        "page": "where",
        "row": 3,
        "col": 6,
        "type": "noun",
        "level": 5,
        "emoji": "🛝"
      },
      {
        "id": "bathroom",
        "label": "bathroom",
        "page": "where",
        "row": 3,
        "col": 7,
        "type": "noun",
        "level": 5,
        "emoji": "🚽"
      }
    ],
    "knownWords": [
      "go",
      "on",
      "up",
      "and",
      "ant",
      "bad",
      "bag",
      "bat",
      "box",
      "bus",
      "can",
      "car",
      "cat",
      "cow",
      "cup",
      "dog",
      "dot",
      "fox",
      "hat",
      "jet",
      "jog",
      "kid",
      "man",
      "mat",
      "out",
      "owl",
      "pen",
      "pot",
      "pig",
      "pop",
      "rat",
      "red",
      "tap",
      "top",
      "toy",
      "van",
      "vet",
      "wet",
      "win",
      "yak",
      "bird",
      "boat",
      "down",
      "duck",
      "fish",
      "frog",
      "hose",
      "milk",
      "pink",
      "rain",
      "star",
      "donut",
      "pants",
      "stomp",
      "horse"
    ]
  };
})(typeof self !== "undefined" ? self : globalThis);
