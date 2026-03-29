const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const { Anthropic } = require("@anthropic-ai/sdk");

const app = express();
app.use(compression());
app.use(express.json());

const client = new Anthropic();
const CACHE_DIR = path.join(__dirname, "insights");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

const BOOK_NAMES = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua",
  "Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings",
  "1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job",
  "Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah",
  "Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah",
  "Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts","Romans",
  "1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon",
  "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
];

// Load or create the cache file for a book
function getCache(bi) {
  const file = path.join(CACHE_DIR, bi + ".json");
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }
  return {};
}

function saveCache(bi, cache) {
  fs.writeFileSync(path.join(CACHE_DIR, bi + ".json"), JSON.stringify(cache));
}

// Generate a single verse insight
async function generateInsight(bookName, chapter, verseNum, verseText) {
  const msg = await client.messages.create({
    model: "claude_sonnet_4_6",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `"${verseText}" — ${bookName} ${chapter}:${verseNum}

Distill this verse into one sharp, surprising sentence that changes how someone reads it. Not a summary. Not a definition. A revelation — the kind of thing a scholar would whisper to you in the margin. Could be an etymology that reframes the meaning, an archaeological find, a cultural context invisible to modern readers, or a hidden connection across scripture. Write it like a memo: direct, confident, no hedging, no "this verse" or "interestingly." Under 25 words. Plain text, no formatting.`
    }]
  });
  return msg.content[0].text.trim().replace(/[*_]/g, '');
}

// API: get insight for a specific verse
app.get("/api/insight/:bi/:ch/:v", async (req, res) => {
  const bi = parseInt(req.params.bi);
  const ch = parseInt(req.params.ch);
  const v = parseInt(req.params.v);
  const key = ch + ":" + v;

  // Check cache
  const cache = getCache(bi);
  if (cache[key]) {
    return res.json({ insight: cache[key], cached: true });
  }

  // Load the verse text
  const bookFile = path.join(__dirname, "books", bi + ".json");
  if (!fs.existsSync(bookFile)) return res.status(404).json({ error: "Book not found" });
  const chapters = JSON.parse(fs.readFileSync(bookFile, "utf8"));
  if (!chapters[ch] || !chapters[ch][v]) return res.status(404).json({ error: "Verse not found" });

  const verseText = chapters[ch][v];
  const bookName = BOOK_NAMES[bi];

  try {
    const insight = await generateInsight(bookName, ch + 1, v + 1, verseText);
    cache[key] = insight;
    saveCache(bi, cache);
    res.json({ insight, cached: false });
  } catch (e) {
    console.error("LLM error:", e.message);
    res.status(500).json({ error: "Failed to generate insight" });
  }
});

// Static files
app.use(express.static("."));
app.get("/{*path}", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(5000, "0.0.0.0", () => console.log("listening on 5000"));
