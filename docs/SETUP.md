# Set it up yourself

This guide gets Word Board onto an iPad for free. You need a computer with internet, an
iPad, and about 20 minutes. No programming is needed for parts 1–4.

> Word Board is a free option to use at home and while you wait for a device. It is not a
> replacement for an evaluation by a speech-language pathologist (SLP). Please work with
> your child's SLP.

## 1. Put the app online (free, with GitHub Pages)

The iPad needs to open the app from an **https://** address once. After that it works
offline. (Opening `dist/aac.html` straight from the Files app does **not** work on iPad: the
Files preview doesn't run apps, and Safari won't open local HTML files.)

1. Make a free account at [github.com](https://github.com) if you don't have one.
2. Open [github.com/neuresthetics/anova_language_dev_public](https://github.com/neuresthetics/anova_language_dev_public)
   and click **Fork**, then **Create fork**. You now have your own copy.
3. In your copy, click **Settings**, then **Pages** (left side).
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**. Set **Branch**
   to **main** and the folder to **/ (root)**. Click **Save**.
5. Wait 1–2 minutes and refresh the page. It shows your address, like
   `https://YOUR-NAME.github.io/anova_language_dev_public/`. Write it down.

Your copy on GitHub is **public**. That's fine: the app has nothing personal in it. Never
upload your child's pack, photos or recordings there (see part 6).

Any other static web host with https works too.

## 2. Put it on the iPad's Home Screen

1. On the iPad, open **Safari** and type your address from part 1.
2. When the board appears, close the tab and open the address once more. This saves the
   offline copy.
3. Tap **Share**, then **Add to Home Screen**. If you see **Open as Web App**, leave it
   **on**. Tap **Add**.
4. From now on, always open Word Board from this **Home Screen icon**. The Home Screen app
   keeps its own storage, separate from Safari, so import your pack in the icon app (part 5).
5. Check offline use: hold the ⚙ gear (top right) for **2 seconds**. At the bottom,
   **About** should say *Offline copy: installed*. Tap **Done**.

Tip: for a nicer voice, go to iPad **Settings → Accessibility → Spoken Content → Voices →
English** and download an *Enhanced* or *Premium* voice. Then pick it under ⚙ → **Voice**.

## 3. Lock the iPad into the app (Guided Access)

1. Open iPad **Settings → Accessibility → Guided Access** and turn it **on**.
2. Tap **Passcode Settings → Set Guided Access Passcode** and choose a passcode.
3. Open Word Board. Triple-click the **top button** (or the **Home button** on iPads that have
   one), then tap **Start**.
4. To leave, triple-click again, enter the passcode, and tap **End**.

## 4. Adjust the board on the iPad

Hold the ⚙ gear for **2 seconds** to open **Parent settings**. A quick tap does nothing, so
children don't open it by accident.

1. **Words shown:** choose *Starter*, *Middle*, *Full* or *Custom*. Hidden words leave an
   empty space; the other buttons never move. Starting small and revealing more over time is
   common AAC practice.
2. **Words: show / hide and photos:** pick what a tap does, then tap a word: hide/show it
   (this switches *Words shown* to *Custom*), add a photo from the camera or photo library,
   or remove a photo.
3. **Stories: photos:** open a story and tap **Add photo** next to any page.
4. **Usage log** (off by default): turn on *keep a usage log* to record the time and word for
   each word button tapped and each finished typed word. **View log**, **Export CSV** or
   **Export JSON** to see it. It stays on this iPad.
5. Tap **Done**.

## 5. Make your own personal pack (on a computer)

A pack holds your child's own words, folders and stories. The easiest start is to export the
board you already have and edit it.

1. On your computer, open your app address (from part 1) in a web browser.
2. Click and **hold** the ⚙ gear for 2 seconds. Under **Personal pack**, click
   **Export pack (.zip)**. You get a file like `word-board-pack-2026-10-01.zip`.
3. Unzip it and open `pack.json` in a plain-text editor (for example
   [VS Code](https://code.visualstudio.com), which is free and points out typos).
4. Make your changes and save. For example:
   - change a word: edit its `label` (text on the button) and `emoji`;
   - add a word: copy a word line and give it a new `id` and an **empty** `row`/`col`
     (never move a word your child already uses);
   - add a folder: add a page to `pages` and a word with `"type": "folder"` and
     `"target"` set to that page's `id`;
   - set a word's level: `"level": 1` (Starter), `2` (Middle) or `3` (Full).
5. Send `pack.json` to the iPad: AirDrop it, or save it to iCloud Drive so it shows up in the
   **Files** app.
6. On the iPad, open Word Board **from the Home Screen icon**. Hold ⚙ for 2 seconds. Under
   **Personal pack**, tap **Import pack (.zip / .json)**, choose the file, and confirm.

Importing **replaces** the board on that iPad, so tap **Export pack** first if you made
changes on the iPad (like photos) that you want to keep. Your *Words shown* choice is kept.

### A tiny pack, for reference

This is [docs/example-pack/pack.json](example-pack/pack.json). It makes a Home page with five
words and a Food folder, plus one story:

```json
{
  "format": "wordboard-pack", "version": 1, "name": "Example pack",
  "config": {
    "wordsShown": "full",
    "pages": [
      { "id": "home", "title": "Home", "rows": 5, "cols": 8 },
      { "id": "food", "title": "Food", "rows": 5, "cols": 8 }
    ],
    "words": [
      { "id": "i", "label": "I", "say": "eye", "page": "home", "row": 1, "col": 1, "type": "people", "emoji": "🙋", "level": 1 },
      { "id": "want", "label": "want", "page": "home", "row": 1, "col": 2, "type": "verb", "emoji": "🤲", "level": 1 },
      { "id": "more", "label": "more", "page": "home", "row": 1, "col": 3, "type": "descriptor", "emoji": "➕", "level": 1 },
      { "id": "all-done", "label": "all done", "page": "home", "row": 1, "col": 4, "type": "social", "emoji": "🙌", "level": 1 },
      { "id": "big", "label": "big", "page": "home", "row": 2, "col": 3, "type": "descriptor", "emoji": "🐘", "level": 3 },
      { "id": "food", "label": "food", "page": "home", "row": 5, "col": 1, "type": "folder", "target": "food", "emoji": "🍎" },
      { "id": "apple", "label": "apple", "page": "food", "row": 1, "col": 1, "type": "noun", "emoji": "🍎" }
    ],
    "knownWords": ["cat", "dog"]
  },
  "stories": [
    { "id": "my-dog", "title": "My dog", "emoji": "🐶", "pages": [
      { "text": "I see my dog.", "scene": ["🙋", "👀", "🐶"], "sceneMain": 2 },
      { "text": "My dog likes me!", "pic": "photos/dog.jpg", "emoji": "🐶" }
    ] }
  ],
  "includeSampleStories": true
}
```

- `type` sets the colour: `people`, `verb`, `descriptor`, `noun`, `social`, `negation`,
  `little`, or `folder`.
- `say` is what the voice says if it should differ from the label.
- `knownWords` are extra words for keyboard prediction.
- `wordsShown` is the starting level until a parent picks one.
- In stories, `pic` is a photo, `scene` is 2–6 emoji, and `emoji` is the fallback. A `pic`
  that isn't in the pack simply shows the scene or emoji instead.
- Every field is explained at the top of `words.js` and in the main README.

### Packs with photo or recording files (optional)

Plain `pack.json` files can't carry photos or recordings. The easiest way to add photos is
on the iPad (part 4). To bundle files instead, use the build tool. It needs
[Node.js](https://nodejs.org) (the LTS version).

1. On your fork's GitHub page, click **Code → Download ZIP** and unzip it.
2. Make a folder, for example `my-pack`, with `pack.json` inside, plus `photos/` and
   `recordings/` folders for your files. Refer to them in `pack.json` like
   `"pic": "photos/dog.jpg"` or `"audio": "recordings/milk.m4a"`.
3. In a terminal, inside the unzipped app folder, run:

   ```
   node tools/make-pack.js my-pack out my-pack
   ```

4. This checks the pack (for example, two words in one cell) and writes `out/my-pack.zip`.
   Import that zip on the iPad as in step 6 above.

## 6. Keep personal packs off GitHub

- Your fork is **public**. Don't upload `pack.json`, pack `.zip` files, photos, recordings or
  usage-log exports to it.
- Keep packs in a private place, like your computer or iCloud Drive. The imported pack and the
  usage log live only on the iPad.
- If you use git, the included `.gitignore` already skips `pack.json`, `.zip` files,
  `photos/` and `recordings/`.

## 7. Update the app

1. On your fork's GitHub page, click **Sync fork**, then **Update branch**. GitHub Pages
   republishes in a minute or two.
2. On the iPad, while online, open Word Board, close it, and open it again. The first open
   downloads the update in the background; the second open shows it. Check the version
   under ⚙ → **About**.

Your pack, photos, settings and usage log stay on the iPad through updates.
