# vapourware.ai — Design Document

A KJV Bible reader inspired by [yews.news](https://yews.news) (Kanye West's news app, Dec 2023 – Apr 2024). This document captures every design decision so the app can be rebuilt from scratch.

---

## Philosophy

Two interactions for the entire Bible: **scroll** to read, **tap** to navigate. Nothing else. No icons, no buttons, no chrome, no decorative elements. The text is the interface.

Inspired by yews.news: a mobile-only, single-column bulletin that prioritized content over UI. Every element that doesn't serve the reading experience is removed.

---

## Visual Identity

### Color

| Token | Light | Dark |
|---|---|---|
| Background | `#e9e9eb` | `#0e0e0e` |
| Text | `#1b1212` | `#d4d4d4` |
| Text muted | `rgba(27,18,18,0.4)` | `rgba(212,212,212,0.35)` |
| Fade (gradients) | Same as background | Same as background |

- Dark mode follows system preference via `prefers-color-scheme: dark`. No manual toggle.
- The light background is yews.news's exact gray (`#e9e9eb`), not white.
- Text is near-black, not pure black. Slightly warm (`#1b1212`).
- Muted text is used only for the "KJV" label.

### Typography

- **Font:** `-apple-system, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- **Size:** 17px everywhere. Header, verses, nav — one size. No hierarchy through size.
- **Line-height:** 28px (1.65 ratio). The KJV has long compound sentences; generous line-height helps track across line breaks.
- **Weight:** 400 for body, 500 for titles/headers and current-book indicator. Only two weights.
- **Letter-spacing:** -0.01em on body (SF Pro's native tracking). +0.02em on headers (slightly open for uppercase).
- **Text rendering:** `antialiased` + `optimizeLegibility`.

### Spacing

- **Side padding:** 56px. On a 375px phone, this gives ~263px of text width. Feels generous and pushed inward, matching yews.news's deep margins.
- **Verse gap:** 28px (`padding-bottom`). Same as line-height — each verse breathes.
- **Header top padding:** 44px. Clears the iOS status bar area comfortably.
- **Header bottom padding:** 0px. Content starts immediately below the header — the gradient handles the visual transition.
- **Content top padding:** 12px. Just enough so the first verse isn't touching the gradient edge.
- **Bottom spacer:** 120px. The last verse has generous room below; the bottom gradient fades into it.
- **Nav book items:** 10px vertical padding, 56px horizontal (matching side margins). First book gets 16px top padding for breathing room after the nav title.

### Gradients

- **Top gradient:** 28px, fades from background color to transparent. Positioned at the top of the reading area, below the fixed header. Softens text as it scrolls under the header instead of hard-clipping.
- **Bottom gradient:** 80px, fades from transparent to background color. The last visible verse dissolves into the background.
- Both use `pointer-events: none` and `z-index: 10` so they don't interfere with scrolling/tapping.
- Gradient color is a CSS variable (`--fade`) that switches between light and dark mode.

---

## Layout

### Mobile (< 480px)

The app has two views that swap in place:

**Reading view:**
- Fixed header at top: `BOOK NAME [chapter]` + `KJV` (muted)
- Below: swipeable chapter content, vertically scrollable
- Bottom gradient fades the lower edge

**Nav view:**
- Same position as reading view — replaces it entirely
- Title at top (tappable to close): same style as header
- Scrollable list of 66 book names, Genesis to Revelation
- Current book is bold (font-weight 500)
- Auto-scrolls to current book on open

Tap the header → nav opens. Tap a book → nav closes, chapter loads. Tap nav title → nav closes. The header hides when nav is open (no double header).

### Desktop (≥ 480px)

Shows a centered message: "THIS IS DESIGNED FOR MOBILE" with an iPhone 15 Pro frame mockup containing a centered italic quote from Ecclesiastes 1:2. The actual app is hidden. This matches yews.news's desktop behavior exactly.

---

## Navigation Model

### Paged chapters with infinite swipe

The entire Bible (1,189 chapters) is a single continuous ribbon. Swipe left for the next chapter, right for the previous. Ecclesiastes 12 → Song of Solomon 1. Genesis 50 → Exodus 1. No walls between books. The header updates as you cross book boundaries.

### 3-panel sliding window

Only 3 DOM panels exist at any time: previous, current, next. The swipe track is `width: 300%` with panels at `33.333%` each. Default position: `translateX(-33.333%)` (centered on middle panel).

After each swipe animation completes, the panels are rebuilt around the new position via `requestAnimationFrame` to avoid visible flash.

### Touch handling

- `touchstart`: Record start position, reset state
- `touchmove`: Detect direction on first significant movement (6px threshold). If horizontal, prevent default and drag the track. If vertical, release to native scroll.
- `touchend`: If dragged past 15% of container width, commit the swipe. Otherwise snap back.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — fast deceleration, feels physical.
- `sliding` lock prevents double-swipes from stacking.

---

## Data Architecture

### Source

KJV text from [github.com/aruljohn/Bible-kjv](https://github.com/aruljohn/Bible-kjv) (public domain). Processed into 66 individual JSON files (`books/0.json` through `books/65.json`).

### Format

Each book file is a 2D array: `chapters[chapterIndex][verseIndex] = "verse text"`. No metadata, no verse numbers, no markup.

### File sizes

Range from 1.5KB (2 John) to 229KB (Psalms). Ecclesiastes is 29KB. Typical book is 20-80KB.

### Loading strategy

- **On init:** Fetch the starting book (Ecclesiastes, index 20). Also fire-and-forget fetches for the previous and next book.
- **In-memory cache:** Each book is fetched once and held in `bookCache[bi]`. Subsequent access is synchronous.
- **Prefetch on navigate:** After every chapter change, prefetch the neighboring books (bi-1, bi+1). Near book boundaries (within 2 chapters of start/end), also prefetch bi-2 or bi+2.
- **On swipe:** If the next chapter's book isn't cached, await its fetch before animating. This is the only blocking fetch — all others are fire-and-forget.
- **On nav jump:** If the target book isn't cached, show "..." loading state while fetching. Neighbors are fetched concurrently.

### Server

Express with `compression` middleware. Static file serving. The `compression` middleware gzips JSON responses automatically (~70% reduction). No cache headers, no service worker, no client-side persistence beyond the in-memory `bookCache` object.

---

## Interaction Reference

| Action | Result |
|---|---|
| Swipe left | Next chapter (seamless across books) |
| Swipe right | Previous chapter |
| Scroll up/down | Read within chapter |
| Tap header | Open book list |
| Tap book name | Jump to that book's chapter 1, close nav |
| Tap nav title | Close nav, return to reading |

---

## File Structure

```
/
├── index.html       Single page, all JS inline (~260 lines)
├── style.css        All styles (~150 lines)
├── server.js        Express static server with compression
├── books/
│   ├── 0.json       Genesis
│   ├── 1.json       Exodus
│   ├── ...
│   └── 65.json      Revelation
├── package.json
└── DESIGN.md        This file
```

---

## Anti-patterns (things we tried and rejected)

- **Accordion navigation** — Expanding chapters inside book names felt glitchy. DOM rebuilds caused scroll jumps.
- **Bottom sheet / overlay nav** — Foreign to the yews.news aesthetic. The app should feel like one flat surface, not layered.
- **Service worker / client-side caching** — Unnecessary complexity. Per-book files are small enough that re-fetching is fine. The in-memory cache handles the session.
- **Monolithic Bible JSON (4MB)** — Too slow on first load. Split into per-book files.
- **External API (dailybible.ca)** — Added latency and failure modes. Bundled data is better.
- **OT/NT section labels** — Added visual noise to the nav. Just book names.
- **Different font sizes for different elements** — Creates hierarchy that fights the minimal aesthetic. One size everywhere.
- **Inline header (scrolls with content)** — Loses your place in long chapters. Fixed header is more useful and more true to yews.news.
- **Top gradient on first load** — Fades the first verse, which looks broken. Only applies during scroll.
- **Spacing systems (calc from a base unit)** — Over-engineered. The final values were tuned by eye.
- **260px fixed column width** — Too narrow for 17px flowing prose. Full-width with generous padding is better.

---

## AI Verse Insights

Tap any verse to reveal a one-sentence insight below it in muted text. Tap again to collapse. Same expand/collapse pattern yews.news used for article summaries under headlines.

### Voice

Like a friend who studied theology for 20 years leaning over and saying something that changes everything. Not a textbook footnote. Not a dictionary definition. A revelation — the kind of thing a scholar would whisper in the margin.

Inspired by yews.news calling their content "memos": "We distill the news into memos to liberate you." These insights distill scripture.

### Tone rules

- Direct, confident, no hedging
- No "this verse" or "interestingly" or "notably"
- Under 25 words
- Plain text, no formatting
- Could be: an etymology that reframes the meaning, an archaeological find, a cultural context invisible to modern readers, a hidden connection across scripture
- Must make the reader see the verse differently

### Examples

- Ecc 1:1: "The Hebrew 'Qohelet' isn't a name — it's a job title, meaning 'one who assembles,' making this book's author permanently anonymous."
- Ecc 1:2: "The Hebrew 'hevel' means breath or vapor — Qohelet isn't calling life worthless, he's calling it fleeting, like mist you can almost hold."
- Gen 1:1: "The Hebrew word for 'created' — bara — is used exclusively with God as subject; humans make, shape, form, but never bara."

### Architecture

- Server-side: Express endpoint `/api/insight/:bookIndex/:chapter/:verse`
- LLM: Anthropic Claude via SDK, called on first tap
- Cache: `insights/{bookIndex}.json` on disk, keyed by `"chapter:verse"`. First tap generates, all subsequent taps serve from disk.
- Client-side: `insightCache` object in memory for the session
- Markdown stripped from responses (`*` and `_` removed)

### Styling

- `.insight` — same 17px font, muted color (`--text-muted`), 8px top padding
- Hidden by default (`display: none`), shown with `.open` class
- `.verse` is tappable (cursor pointer, tap highlight suppressed)
- `.verse:active` dims to 0.4 opacity
- "..." shown while generating

---

## Rebuild Checklist

To rebuild this from scratch:

1. Create the book JSON files from the aruljohn/Bible-kjv source
2. Set up Express with compression middleware
3. Build the HTML with: desktop gate, fixed header, 3-panel swipe track, nav view, loading state
4. Style with the exact values from this document
5. Implement: touch swipe with direction lock, 3-panel sliding window with requestAnimationFrame rebuild, in-memory book cache with eager prefetch, nav toggle
6. Test on a real phone — Playwright screenshots don't capture the feel of the swipe

The entire app is ~410 lines of code (HTML + CSS) plus the data files. No build step, no framework, no dependencies beyond Express.
