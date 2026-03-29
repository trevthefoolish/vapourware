const express = require("express");
const compression = require("compression");
const path = require("path");
const app = express();
app.use(compression());
app.use(express.static(".", {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('kjv.json')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));
app.get("/{*path}", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(5000, "0.0.0.0", () => console.log("listening on 5000"));
