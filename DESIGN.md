# vapourware.ai — Design Document

The Bible in modern English. Rendered by Claude. Inspired by yews.news.

This document is intentionally thorough. The app is not. Every detail here exists so that someone rebuilding this from scratch understands not just what to build but what to resist building. The discipline of this project is removal.

---

## The yews.news Principle

yews.news was Kanye West's mobile-only news app (December 2023 – April 2024). It was the most aggressively minimal news product ever shipped. It had no logo on screen, no hamburger menu, no bottom tab bar, no icons anywhere, no color besides text and background, no images in the headline view, no bylines, no categories, no timestamps on articles, no share buttons, no comment sections, no related content, no ads, no analytics popups, no cookie banners, no onboarding, no signup wall on the reading experience, and no desktop version — just a message saying "YEWS IS DESIGNED FOR MOBILE" with a phone frame mockup.

Everything was one font (SF Pro), one size (14px), one weight (400, with 500 for emphasis), one color (#1b1212 on #e9e9eb). Headlines were a flat list. Tap to expand. "Expand" to open all. "Simplify" to close all. That was the entire interaction model.

Their editorial voice: "We distill the news into memos to liberate you from newspapers, TV and social media. Domestic and international headlines arrive three times a day, calmly and in context. Designed to promote serenity."

This app follows that principle absolutely. If yews.news wouldn't have it, we don't have it. When in doubt, remove.

---

## What the App Does

Claude renders every verse of the Bible into modern English with a pastoral note explaining translation decisions. There is no King James text, no static Bible data, no pre-existing translation stored anywhere. The entire Bible is generated on demand by Claude and cached as people read.

The user experience is: you open the app, you see a chapter of the Bible in modern English. Each verse has a note below it in muted text. You scroll to read. You swipe left for the next chapter, right for the previous. You tap the header to see a list of 66 book names. You tap a book. You read. That is everything.

---

## Architecture

### File structure

```
index.html     224 lines — all markup and JavaScript, inline
style.css      143 lines — all styling
server.js       71 lines — Express server, one API endpoint
renders/        cache directory, one JSON file per book, builds itself
DESIGN.md       this file
README.md       brief description
```

438 lines of code total. No build step. No framework. No bundler. No TypeScript. No dependencies beyond Express, compression, and the Anthropic SDK.

### The single API endpoint

```
GET /api/render/:bookIndex/:chapter/:verse
```

- `bookIndex`: 0 (Genesis) through 65 (Revelation)
- `chapter`: 0-indexed
- `verse`: 0-indexed

Response:
```json
{
  "rendering": "Modern English text of the verse",
  "note": "Pastoral note about translation decisions",
  "cached": true
}
```

The server receives the request, checks `renders/{bookIndex}.json` for a cached result keyed by `"chapter:verse"`. If found, returns it immediately. If not, sends the verse reference to Claude, caches the response to disk, and returns it. Markdown formatting (`*` and `_`) is stripped from Claude's output.

The server never stores or sends any Bible source text. Claude receives only the reference (e.g. "Ecclesiastes 1:1") and renders from its own knowledge.

### Cache behavior

The `renders/` directory starts empty. Each book gets a JSON file on first access (e.g., `renders/20.json` for Ecclesiastes). The file is a flat object keyed by `"chapter:verse"`:

```json
{
  "0:0": {"rendering": "...", "note": "..."},
  "0:1": {"rendering": "...", "note": "..."}
}
```

First visitor to any verse waits for Claude (~2-5 seconds). Every visitor after gets an instant response. The cache builds organically as people read. There is no pre-generation, no warm-up, no batch job.

---

## The Prompt

This is the exact prompt sent to Claude for every verse. It was written by the project owner, not the AI.

```
{Book Name} {Chapter}:{Verse}

Consider this verse's heritage through Hebrew, Aramaic, Greek, Latin, 
and English. Then write your own modern English rendering that best 
conveys the original meaning. Finally give a pithy, memorable tidbit 
that primarily illuminates your translation decisions. The voice should 
always be pastoral pointing us to Jesus and never academic pointing us 
to grammar. Never use archaic English words in your note — if the 
reader wouldn't say it in conversation, don't write it.

Respond in exactly this format (two lines, no labels):
Your modern rendering here
---
Your note here
```

### Voice

Like a friend who studied theology for 20 years leaning over and saying something that changes everything. Pastoral, warm, direct. Never a textbook footnote. Never a dictionary definition. The notes illuminate what is lost when ancient languages pass through Latin and into English. They should make you see the verse differently.

The rendering should sound like how you'd explain the verse to someone sitting next to you. The note should sound like the most interesting thing your pastor ever said about it.

### Examples

Ecclesiastes 1:1:
- Rendering: "These are the collected words of the Preacher — a son of David, a king who once ruled Jerusalem."
- Note: "The Hebrew title Qohelet means someone who gathers people together to speak, and Jesus is the ultimate fulfillment of that — the one who calls us to himself, opens his mouth, and gives us words that actually satisfy the emptiness this whole book is about to describe."

Genesis 1:1:
- Rendering: "In the beginning, God created everything — the sky above and the solid ground beneath our feet."
- Note: "Moses wrote for tired slaves leaving Egypt, not theologians — he was saying: the God who just freed you made absolutely everything, so trust Him with what comes next."

Ecclesiastes 1:2:
- Rendering: "Breath upon breath, sighs the Teacher, breath upon breath — everything is just breath."
- Note: "The Hebrew hebel means a vapor that vanishes before you can grasp it, and Jesus alone is the one thing that does not disappear when you reach for Him."

---

## Visual Design

Every value below is intentional and was arrived at through extensive iteration. Do not approximate.

### Color

| Token | Light mode | Dark mode |
|---|---|---|
| `--bg` | `#e9e9eb` | `#0e0e0e` |
| `--text` | `#1b1212` | `#d4d4d4` |
| `--text-muted` | `rgba(27,18,18,0.4)` | `rgba(212,212,212,0.35)` |
| `--fade` | Same as `--bg` | Same as `--bg` |
| Selection | `rgba(27,18,18,0.12)` | `rgba(212,212,212,0.15)` |

Dark mode follows `prefers-color-scheme: dark` automatically. There is no manual toggle. The light background is yews.news's exact gray (#e9e9eb), not white. The text is near-black with slight warmth (#1b1212), not pure black.

### Typography

```css
font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;
font-size: 17px;
line-height: 28px;
font-weight: 400;
letter-spacing: -0.01em;
```

One font. One size. Everything — header, verses, notes, book list — is 17px. There is no typographic hierarchy through size. The only weight variation is 500 for the header text and the current book indicator in the nav. This is a direct extension of the yews.news approach (they used 14px for everything in a 260px column; we use 17px in a wider column, same proportional density).

Text rendering: `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `text-rendering: optimizeLegibility`.

### Spacing

| Element | Value | Notes |
|---|---|---|
| Side padding | 56px | On a 375px phone this gives ~263px text width |
| Header top padding | 44px | Clears iOS status bar comfortably |
| Header bottom padding | 0px | Content starts tight below the header |
| Content top padding | 12px | Breathing room for first verse under gradient |
| Verse-wrap bottom padding | 28px | Same as line-height; each verse breathes |
| Note top padding | 8px | Tight to its verse |
| Bottom spacer | 120px | Last verse has generous room below |
| Nav book items | 10px vertical, 56px horizontal | Matching side margins |
| Nav first book extra top | 16px | Breathing room after nav title |
| Nav end spacer | 100px | |

### Gradients

Two gradient pseudo-elements on the reading view:

**Top gradient:** 28px tall, fades from `--fade` (background color) to transparent. Positioned at the top of the reading area, below the fixed header. Its purpose is to soften text as it scrolls under the header — instead of a hard clip, text dissolves. On first load, the 12px content top padding ensures the first verse starts below the gradient's visible range.

**Bottom gradient:** 80px tall, fades from transparent to `--fade`. The last visible verse dissolves into the background instead of being cut off. The 120px bottom spacer ensures there's always room for this effect.

Both gradients use `pointer-events: none` and `z-index: 10` so they never interfere with scrolling or tapping. Both use the `--fade` CSS variable so they automatically adapt to light and dark mode.

---

## Layout

### Mobile (< 480px)

The mobile layout is a flex column filling `100dvh`:

1. **Header** — fixed at top, shows book name and chapter number. Tappable (opens nav). Zero bottom padding — content starts immediately below. Background matches `--bg` so it's seamless with the page.

2. **Reading view** — fills remaining space. Contains the swipe container with the 3-panel sliding track. Has the top and bottom gradient pseudo-elements.

3. **Nav view** — hidden by default. When opened, the header hides and the nav view takes over the full space below. Shows a title (tappable to close) and the book list. Same background, same font, same margins — it doesn't feel like a different screen.

4. **Loading** — shows "..." centered, displayed only during initial load.

The header and nav never coexist on screen. When nav opens, the header hides. When nav closes, the header returns.

### Desktop (≥ 480px)

Desktop shows only:
- "THIS IS DESIGNED FOR MOBILE" in small muted text
- A CSS-drawn iPhone frame with rounded corners and a notch
- Inside the frame: Ecclesiastes 1:2 in italic as a preview

The actual app (`mobile-content`) is `display: none`. This matches yews.news exactly — they showed the same phone frame mockup on desktop.

---

## Navigation

### The swipe model

The entire Bible is 1,189 chapters treated as one continuous sequence. Chapter 0 is Genesis 1. Chapter 1188 is Revelation 22. Swiping left advances to the next chapter, right goes back. There are no walls between books — Ecclesiastes 12 swipes directly into Song of Solomon 1.

### 3-panel sliding window

Only three DOM panels exist at any time. The swipe track is `width: 300%` with three child panels each at `width: 33.333%`. The track's default position is `translateX(-33.333%)`, centering the middle panel.

When the user swipes:
1. Touch direction is detected at 6px of movement (horizontal vs vertical)
2. If horizontal, the track follows the finger with no transition
3. On release, if displacement exceeds 15% of container width, the track animates to `-66.666%` (forward) or `0%` (backward) with `cubic-bezier(0.16, 1, 0.3, 1)` easing
4. After the 300ms animation, `requestAnimationFrame` fires and all three panels are rebuilt around the new position
5. The `sliding` flag prevents overlapping swipes

### Verse streaming

When a panel is filled, it fetches verses sequentially: `/api/render/{bi}/{ch}/0`, then `/api/render/{bi}/{ch}/1`, and so on. Each verse is appended to the DOM as it arrives. A 404 response means no more verses in that chapter. Cached verses appear instantly; uncached verses show "..." briefly then populate.

The panel checks `scroll.isConnected && scroll.dataset.p == p` before each DOM update to ensure the user hasn't swiped away during loading.

### Book navigation

Tapping the header hides the header and reading view, shows the nav view. The nav contains:
- A title (current book/chapter, tappable to close)
- 66 book names in Bible order (Genesis through Revelation)
- Current book indicated by `font-weight: 500`
- Auto-scrolls to the current book on open

Tapping a book name closes the nav and rebuilds the panels at that book's chapter 1.

---

## What Not to Build

This section exists because the temptation to add features is the primary threat to this project.

- **No verse numbers.** The text should read as prose, not as a reference tool.
- **No search.** If you want to find something, scroll or use the book list.
- **No bookmarks.** The app always opens to Ecclesiastes 1. That's intentional.
- **No reading plans.** This is not a productivity tool.
- **No social features.** No sharing, no highlighting, no community.
- **No settings.** No font size slider, no theme picker, no layout options.
- **No analytics.** Don't track what people read.
- **No accounts.** No login, no profiles, no saved state.
- **No multiple translations.** Claude's rendering is the translation.
- **No cross-references.** Each verse stands alone.
- **No pre-generation.** The cache builds as people read. That's a feature, not a limitation.
- **No loading animations.** "..." is the only loading state.
- **No transitions besides the swipe.** No fade-ins, no slide-ups, no bounces.
- **No element that yews.news didn't have.** This is the final test for any proposed addition.

---

## Rebuild Checklist

To rebuild this app from zero:

1. Create the project: `npm init -y && npm install express compression @anthropic-ai/sdk`
2. Write `server.js` (71 lines): Express, compression middleware, one `/api/render/:bi/:ch/:v` endpoint that calls Claude and caches to `renders/`. The prompt is specified verbatim above.
3. Write `style.css` (143 lines): Every value is specified in the Visual Design section above. Start with the CSS custom properties, then body, then desktop gate, then header, then reading view with gradients, then swipe track, then verse/note styling, then nav.
4. Write `index.html` (224 lines): Desktop gate, mobile content with header + reading view + nav view + loading. All JavaScript inline. Build the book name array, chapter count array, and flat chapter index. Wire up the nav, the 3-panel swipe, the touch handling, and the verse streaming.
5. Start the server with Anthropic API credentials.
6. Test on a real phone. Screenshots cannot capture the feel of the swipe or the pace of verse streaming.

The entire app should take less than an hour to rebuild from this document.
