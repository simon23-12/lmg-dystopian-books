# The Great LMG Dystopian Book Overview

Fifteen posters on dystopian novels by the English Q2 course at the
Leibniz-Montessori-Gymnasium Düsseldorf, ordered by year of publication.

**Live:** <https://simon23-12.github.io/lmg-dystopian-books/>

- Plain static site, no build step: `index.html`, `style.css`, `app.js`, `books.json`.
- iPad: Share → “Add to Home Screen” installs it as an app. A service worker
  (`sw.js`) stores all posters, so it also runs without Wi-Fi. After changing
  files, bump `VERSION` in `sw.js`.
- Full-screen view: swipe to browse, pinch or double-tap to zoom, arrow keys
  and `+`/`-` on a keyboard.

Posters were rendered from the students' PDFs. No names: file metadata is
dropped, and the one visible name and one photo on the posters are covered.
