const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const { Anthropic } = require("@anthropic-ai/sdk");

const app = express();
app.use(compression());
app.use(express.json());

const client = new Anthropic();

const INSIGHTS_DIR = path.join(__dirname, "insights");
const RENDERS_DIR = path.join(__dirname, "renders");
if (!fs.existsSync(INSIGHTS_DIR)) fs.mkdirSync(INSIGHTS_DIR);
if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR);

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

function getCache(dir, bi) {
  const file = path.join(dir, bi + ".json");
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  return {};
}

function saveCache(dir, bi, cache) {
  fs.writeFileSync(path.join(dir, bi + ".json"), JSON.stringify(cache));
}

function getVerse(bi, ch, v) {
  const bookFile = path.join(__dirname, "books", bi + ".json");
  if (!fs.existsSync(bookFile)) return null;
  const chapters = JSON.parse(fs.readFileSync(bookFile, "utf8"));
  if (!chapters[ch] || !chapters[ch][v]) return null;
  return chapters[ch][v];
}

function clean(text) {
  return text.trim().replace(/[*_]/g, '');
}

// ===== INSIGHT (tap verse in KJV mode) =====
app.get("/api/insight/:bi/:ch/:v", async (req, res) => {
  const bi = parseInt(req.params.bi), ch = parseInt(req.params.ch), v = parseInt(req.params.v);
  const key = ch + ":" + v;

  const cache = getCache(INSIGHTS_DIR, bi);
  if (cache[key]) return res.json({ insight: cache[key], cached: true });

  const verseText = getVerse(bi, ch, v);
  if (!verseText) return res.status(404).json({ error: "Verse not found" });

  try {
    const msg = await client.messages.create({
      model: "claude_sonnet_4_6",
      max_tokens: 200,
      messages: [{ role: "user", content: `"${verseText}" — ${BOOK_NAMES[bi]} ${ch+1}:${v+1}\n\nConsider this verse's heritage through Hebrew, Aramaic, Greek, Latin, and English. Then give a one-sentence pithy, memorable tidbit that primarily illuminates what is lost in translation. The voice should always be pastoral and never academic. No labels, no quotes, no markdown.` }]
    });
    const insight = clean(msg.content[0].text);
    cache[key] = insight;
    saveCache(INSIGHTS_DIR, bi, cache);
    res.json({ insight, cached: false });
  } catch (e) {
    console.error("Insight error:", e.message);
    res.status(500).json({ error: "Failed to generate" });
  }
});

// ===== RENDER (Claude modern English + note) =====
app.get("/api/render/:bi/:ch/:v", async (req, res) => {
  const bi = parseInt(req.params.bi), ch = parseInt(req.params.ch), v = parseInt(req.params.v);
  const key = ch + ":" + v;

  const cache = getCache(RENDERS_DIR, bi);
  if (cache[key]) return res.json({ ...cache[key], cached: true });

  const verseText = getVerse(bi, ch, v);
  if (!verseText) return res.status(404).json({ error: "Verse not found" });

  try {
    const msg = await client.messages.create({
      model: "claude_sonnet_4_6",
      max_tokens: 400,
      messages: [{ role: "user", content: `"${verseText}" — ${BOOK_NAMES[bi]} ${ch+1}:${v+1}\n\nConsider this verse's heritage through Hebrew, Aramaic, Greek, Latin, and English. Then write your own modern English rendering that best conveys the original meaning. Finally give a pithy, memorable tidbit that primarily illuminates your translation decisions. The voice should always be pastoral pointing us to Jesus and never academic pointing us to grammar.\n\nRespond in exactly this format (two lines, no labels):\nYour modern rendering here\n---\nYour note here` }]
    });
    const text = clean(msg.content[0].text);
    const sep = text.indexOf('---');
    let rendering, note;
    if (sep !== -1) {
      rendering = text.substring(0, sep).trim();
      note = text.substring(sep + 3).trim();
    } else {
      // Fallback: split on last sentence
      rendering = text;
      note = '';
    }
    const result = { rendering, note };
    cache[key] = result;
    saveCache(RENDERS_DIR, bi, cache);
    res.json({ ...result, cached: false });
  } catch (e) {
    console.error("Render error:", e.message);
    res.status(500).json({ error: "Failed to generate" });
  }
});

// Static files
app.use(express.static("."));
app.get("/{*path}", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(5000, "0.0.0.0", () => console.log("listening on 5000"));
