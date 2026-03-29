const express = require("express");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const { Anthropic } = require("@anthropic-ai/sdk");

const app = express();
app.use(compression());

const client = new Anthropic();
const CACHE_DIR = path.join(__dirname, "renders");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

const NAMES = [
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

function getCache(bi) {
  const f = path.join(CACHE_DIR, bi + ".json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
}

function saveCache(bi, cache) {
  fs.writeFileSync(path.join(CACHE_DIR, bi + ".json"), JSON.stringify(cache));
}

app.get("/api/render/:bi/:ch/:v", async (req, res) => {
  const bi = +req.params.bi, ch = +req.params.ch, v = +req.params.v;
  if (bi < 0 || bi >= 66 || !NAMES[bi]) return res.status(404).json({ error: "Not found" });

  const key = ch + ":" + v;
  const cache = getCache(bi);
  if (cache[key]) return res.json({ ...cache[key], cached: true });

  const ref = NAMES[bi] + " " + (ch + 1) + ":" + (v + 1);

  try {
    const msg = await client.messages.create({
      model: "claude_sonnet_4_6",
      max_tokens: 400,
      messages: [{ role: "user", content:
        `${ref}\n\nConsider this verse's heritage through Hebrew, Aramaic, Greek, Latin, and English. Then write your own modern English rendering that best conveys the original meaning. Finally give a pithy, memorable tidbit that primarily illuminates your translation decisions. The voice should always be pastoral pointing us to Jesus and never academic pointing us to grammar. Never use archaic English words in your note — if the reader wouldn't say it in conversation, don't write it.\n\nRespond in exactly this format (two lines, no labels):\nYour modern rendering here\n---\nYour note here`
      }]
    });
    const text = msg.content[0].text.trim().replace(/[*_]/g, "");
    const sep = text.indexOf("---");
    const rendering = sep !== -1 ? text.substring(0, sep).trim() : text;
    const note = sep !== -1 ? text.substring(sep + 3).trim() : "";
    const result = { rendering, note };
    cache[key] = result;
    saveCache(bi, cache);
    res.json({ ...result, cached: false });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Failed" });
  }
});

app.use(express.static("."));
app.get("/{*path}", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(5000, "0.0.0.0", () => console.log("listening on 5000"));
