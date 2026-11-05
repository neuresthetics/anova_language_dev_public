# Contributing to Word Board

Thanks for helping. Word Board is a free, offline AAC board for kids, shared under the MIT license.

## The easiest ways to help

- **Share it.** Send people https://neuresthetics.github.io/anova_language_dev_public/ (or use
  *Share Word Board* in parent settings for a QR code).
- **Feedback or requests.** Email neuresthetics@gmail.com (subject "Word Board feedback"), or
  open an issue: [bug](../../issues/new?template=bug.yml) or
  [word / pattern request](../../issues/new?template=word-request.yml).
- Issues are public: please leave out children's names, photos and other personal details.

## Code changes

- Plain HTML/CSS/JS. No build step, no frameworks, no CDNs, **no analytics, no tracking, no
  accounts, no network calls**. Pull requests that add any of these won't be merged.
- Words live in `words.js` (with a level 1–5 for each word); Paths patterns in `paths.js`.
  Keep patterns short and grammatically correct.
- Sharing and feedback controls belong in parent settings only, never on the child's board.
- Level ages are approximate guides. Avoid diagnostic or clinical wording.
- When app files change, bump `APP_VERSION` in `app.js` and `CACHE` in `sw.js`.
- Before a pull request, run:
  ```
  node tools/paths-check.js
  node tools/paths-smoke.js   # needs puppeteer-core + Chrome (CHROME_PATH)
  node tools/build-single.js  # refreshes dist/aac.html
  ```
