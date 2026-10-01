/* =====================================================================
   stories.js  —  simple read-along books for the STORIES tab.
   =====================================================================
   The app NEVER reads a page by itself. Turning a page is silent.
   It only speaks when someone taps a word, or taps the ▶ read button.

   Each story: { id, title, emoji, pages: [ page, ... ] }
   Each page:
     text       the words on that page (each word becomes a tappable button)
     scene      optional list of 2–6 emoji shown together as the page picture,
                e.g. ["🐶", "👀", "🌧️"] for "The dog sees rain!"
     sceneMain  optional index of the main subject in "scene" (drawn bigger);
                default 0, use -1 to draw them all the same size
     emoji      single big picture, used when there is no scene
     pic        optional photo/picture (a file in the pack, e.g. "photos/p1.jpg");
                shown instead of the scene. "image" works the same way.
   These are generic samples. Personal stories go in a pack (pack.json
   "stories"), stored on the device only. Don't copy text from
   copyrighted books into anything you publish.
   ===================================================================== */
(function (root) {
  root.AAC_STORIES = [
    {
      id: "what-can-go", title: "What can go?", emoji: "🚌",
      pages: [
        { text: "The bus can go.", emoji: "🚌", scene: ["🚌", "💨", "🛣️"] },
        { text: "The car can go.", emoji: "🚗", scene: ["🚗", "💨", "🛣️"] },
        { text: "The van can go.", emoji: "🚐", scene: ["🚐", "💨", "🛣️"] },
        { text: "The jet can go up, up, up.", emoji: "✈️", scene: ["✈️", "☁️", "⬆️"] },
        { text: "The boat can go on the water.", emoji: "⛵", scene: ["⛵", "🌊"] },
        { text: "Stop! All done.", emoji: "🛑", scene: ["🛑", "🚌", "🙌"] }
      ]
    },
    {
      id: "i-see-a-cat", title: "I see a cat", emoji: "🐱",
      pages: [
        { text: "I see a cat.", emoji: "🐱", scene: ["🙋", "👀", "🐱"], sceneMain: 2 },
        { text: "The cat sees a dog.", emoji: "🐶", scene: ["🐱", "👀", "🐶"], sceneMain: 2 },
        { text: "The dog sees a duck.", emoji: "🦆", scene: ["🐶", "👀", "🦆"], sceneMain: 2 },
        { text: "The duck sees a frog.", emoji: "🐸", scene: ["🦆", "👀", "🐸"], sceneMain: 2 },
        { text: "The frog sees a fish.", emoji: "🐟", scene: ["🐸", "👀", "🐟"], sceneMain: 2 },
        { text: "The fish sees a pig in the rain.", emoji: "🐷", scene: ["🐟", "👀", "🐷", "🌧️"], sceneMain: 2 },
        { text: "The pig sees me!", emoji: "🙋", scene: ["🐷", "👀", "🙋"], sceneMain: 2 }
      ]
    }
  ];
})(typeof self !== "undefined" ? self : globalThis);
