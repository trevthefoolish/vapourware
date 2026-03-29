# vapourware.ai

The Bible in modern English. Rendered by Claude. Inspired by yews.news.

---

## One rule

If yews.news wouldn't have it, we don't have it.

No icons. No buttons. No chrome. No settings. No onboarding. No loading spinners. No toasts. No modals. No color besides text and background. The text is the interface.

---

## Two interactions

**Scroll** to read. **Tap** to navigate.

That's the entire app.

---

## What you see

A chapter of the Bible in modern English. Each verse is followed by a muted note about what the English lost in translation. Swipe for the next chapter. Tap the header for the book list. Tap a book. Read.

Desktop shows a phone frame and nothing else.

---

## What Claude does

Claude receives a verse reference. Just the reference — "Ecclesiastes 1:1". No source text. Claude knows the Bible.

Claude returns two things: a modern rendering and a pastoral note. The note illuminates translation decisions, always pointing to Jesus, never to grammar. If a reader wouldn't say a word in conversation, Claude doesn't write it.

First request generates. Every request after serves from cache. The cache builds as people read.

---

## The prompt

```
{Reference}

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

---

## How it looks

Light: `#e9e9eb` background, `#1b1212` text. Dark follows system.

One font. One size. One weight (500 for the header, 400 for everything else). 17px / 28px. SF Pro or system sans-serif.

56px side padding. 28px between verses. Notes in muted text, 8px below their verse.

Top gradient (28px) softens text under the header. Bottom gradient (80px) dissolves the last verse. Both match the background color.

---

## How it works

```
index.html    224 lines
style.css     143 lines
server.js      71 lines
renders/       builds itself
```

No build step. No framework. No static Bible data.

Server: Express, compression, Anthropic SDK. One endpoint. One cache directory.

Client: 3-panel swipe track, touch handling with direction lock, nav that replaces the reading view in place. Verses stream in one at a time from the API.

---

## yews.news

A mobile-only news bulletin. Three editions daily. Punchy headlines, tap to expand, William Blake illustrations, concise summaries, source links. "We distill the news into memos to liberate you."

We kept: mobile-only, one column, one font, one size, gray background, tap to toggle, no chrome.

We changed: Bible instead of news, Claude instead of editors, swipe instead of accordion, pastoral notes instead of summaries, dark mode, gradient edges.

---

## Don't

- Don't add a toggle, setting, or preference
- Don't show verse numbers
- Don't add a search bar
- Don't add social features
- Don't add bookmarks
- Don't add a reading plan
- Don't use a different font size for anything
- Don't store any Bible text locally
- Don't pre-generate content
- Don't add loading states beyond "..."
- Don't add animations beyond the swipe
- Don't add any element that yews.news didn't have
