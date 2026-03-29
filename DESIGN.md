# vapourware.ai — Design Document

A Bible rendered in modern English by Claude, inspired by [yews.news](https://yews.news) (Kanye West's news app, Dec 2023 – Apr 2024). This document captures every design decision so the app can be rebuilt from scratch.

---

## Philosophy

Two interactions: **scroll** to read, **tap** to navigate. Nothing else.

Claude renders every verse into modern English with a pastoral note explaining translation decisions. There is no KJV text, no static Bible data, no pre-existing translation. The entire Bible is generated on demand and cached as people read.

Inspired by yews.news: mobile-only, single-column, ultra-minimal. "We distill the news into memos to liberate you." This app distills scripture.

---

## Architecture

### Files

```
index.html    224 lines — swipe, nav, render verses from API
style.css     143 lines — yews.news aesthetic, light/dark
server.js      71 lines — one endpoint, Claude renders on demand
renders/       cache directory (builds itself as people read)
```

No build step. No framework. No static Bible data anywhere.

### How it works

1. Client requests `/api/render/{bookIndex}/{chapter}/{verse}`
2. Server checks `renders/{bookIndex}.json` for a cached result
3. If cached, return it. If not, send the verse reference to Claude
4. Claude returns a modern English rendering + pastoral note
5. Server caches the result to disk and returns it
6. Client renders the verse and note inline

The cache builds organically. First visitor to a verse waits for Claude. Everyone after gets an instant response.

### The prompt

```
{Book} {Chapter}:{Verse}

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

Claude receives only the reference (e.g. "Ecclesiastes 1:1") — no KJV text is sent. Claude knows the Bible.

### Voice

Like a friend who studied theology for 20 years leaning over and saying something that changes everything. Pastoral, never academic. Pointing to Jesus, never to grammar.

The notes illuminate what is lost when ancient languages pass through Latin and into English. They should make you see the verse differently.

### Examples

Ecclesiastes 1:1:
- Rendering: "These are the collected words of the Preacher — a son of David, a king who once ruled Jerusalem."
- Note: "The Hebrew title Qohelet means someone who gathers people together to speak, and Jesus is the ultimate fulfillment of that — the one who calls us to himself, opens his mouth, and gives us words that actually satisfy the emptiness this whole book is about to describe."

Genesis 1:1:
- Rendering: "In the beginning, God created everything — the sky above and the solid ground beneath our feet."
- Note: "Moses wrote for tired slaves leaving Egypt, not theologians — he was saying: the God who just freed you made absolutely everything, so trust Him with what comes next."

---

## Visual Identity

### Color

| Token | Light | Dark |
|---|---|---|
| Background | `#e9e9eb` | `#0e0e0e` |
| Text | `#1b1212` | `#d4d4d4` |
| Text muted (notes) | `rgba(27,18,18,0.4)` | `rgba(212,212,212,0.35)` |
| Fade (gradients) | Same as background | Same as background |

Dark mode follows system preference. No toggle.

### Typography

- **Font:** `-apple-system, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- **Size:** 17px everywhere. Header, verses, notes, nav — one size.
- **Line-height:** 28px
- **Weight:** 400 body, 500 header and current-book indicator
- **Letter-spacing:** -0.01em body, 0.02em header

### Spacing

- **Side padding:** 56px
- **Verse gap:** 28px between verse-wraps
- **Note padding:** 8px above the note, within the verse-wrap
- **Header top:** 44px
- **Header bottom:** 0px (content starts tight below)
- **Content top:** 12px
- **Bottom spacer:** 120px
- **Nav book items:** 10px vertical, 56px horizontal
- **Nav first book:** 16px top padding

### Gradients

- **Top:** 28px, background → transparent. Softens text scrolling under the header.
- **Bottom:** 80px, transparent → background. Last verse dissolves.
- Both: `pointer-events: none`, `z-index: 10`, use `--fade` variable for light/dark.

---

## Layout

### Mobile (< 480px)

Two views that swap in place:

**Reading view:**
- Fixed header showing `BOOK NAME [chapter]` (tappable → opens nav)
- Below: swipeable chapter content with verses streaming in from the API
- Each verse: modern rendering in body text, pastoral note in muted text below
- Top and bottom gradients

**Nav view:**
- Replaces reading view (header hides)
- Title at top (tappable → closes nav)
- 66 book names, Genesis to Revelation
- Current book is bold
- Auto-scrolls to current book on open

### Desktop (≥ 480px)

"THIS IS DESIGNED FOR MOBILE" with iPhone frame mockup.

---

## Navigation

### Paged chapters, infinite swipe

1,189 chapters as a continuous ribbon. Swipe left for next, right for previous. No walls between books.

### 3-panel sliding window

Three DOM panels: previous, current, next. Track at `width: 300%`, panels at `33.333%`. Default: `translateX(-33.333%)`. After swipe animation, panels rebuild via `requestAnimationFrame`.

### Touch handling

- Direction detection: 6px threshold
- Commit threshold: 15% of container width
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- `sliding` lock prevents stacking

### Verse loading

Verses stream in one at a time. The client fetches `/api/render/{bi}/{ch}/0`, then `/api/render/{bi}/{ch}/1`, and so on until the API returns a 404 (no more verses in that chapter). Each verse appears as it arrives. Cached verses appear instantly.

---

## Server

Express with `compression` middleware. The Anthropic SDK connects to Claude. One endpoint, one cache directory. The entire server is 71 lines.

The `renders/` directory contains one JSON file per book (created on first access). Each file is keyed by `"chapter:verse"` → `{rendering, note}`. Markdown (`*` and `_`) is stripped from Claude's responses.

---

## yews.news Reference

### What it was

A mobile-only news aggregator that published 3x daily (10AM, 3PM, 8PM editions). Each edition: a date/time header, ~10 punchy headlines, "Expand" to open all articles, "Simplify" to collapse.

### Expanded article structure

1. Headline (bold, title case)
2. William Blake illustration with attribution
3. Lede: 1-2 sentences
4. Context: 2-3 short paragraphs
5. Direct quote: "Name, title: 'quote'"
6. Source link

### Design DNA we kept

- Mobile-only with phone frame on desktop
- Single-column, generous margins
- One font, one size, one color
- Light gray background (#e9e9eb), not white
- Tap to toggle between content and navigation
- No icons, no buttons, no chrome
- Text is the interface

### What we changed

- Bible instead of news
- Claude rendering instead of aggregated articles
- Swipe between chapters instead of accordion expand
- Pastoral notes instead of news summaries
- Dark mode (yews didn't have this)
- Gradients at content edges (yews had hard clips)

---

## Anti-patterns (tried and rejected)

- **KJV text stored locally** — Unnecessary when Claude knows the Bible
- **66 per-book JSON files** — Complexity for static data we don't need
- **Monolithic 4MB Bible JSON** — Slow first load, unnecessary
- **External API (dailybible.ca)** — Added latency and failure modes
- **KJV + Claude toggle** — Two modes is one too many
- **Tap-to-expand insights under KJV** — Replaced by always-visible notes in Claude rendering
- **Accordion book navigation** — Glitchy DOM rebuilds
- **Bottom sheet nav** — Foreign to yews.news aesthetic
- **OT/NT section labels** — Visual noise
- **Different font sizes for hierarchy** — One size everywhere
- **Spacing systems (calc from base unit)** — Over-engineered; tuned by eye
- **Service worker / client caching** — Unnecessary complexity
- **Pre-generating insights** — Slow, wasteful; on-demand + cache is better
- **Instructional LLM prompts** — Few-shot examples and voice descriptions work better
- **Archaic English in notes** — Defeats the purpose of modern rendering

---

## Rebuild Checklist

1. `npm init` + install `express`, `compression`, `@anthropic-ai/sdk`
2. Write `server.js`: one `/api/render/:bi/:ch/:v` endpoint, Claude call, disk cache
3. Write `index.html`: desktop gate, header, 3-panel swipe track, nav view, verse streaming
4. Write `style.css`: exact values from this document
5. Deploy with `api_credentials` for the Anthropic SDK
6. Test on a real phone — screenshots don't capture swipe feel

The app is 438 lines of code. No build step, no framework.
