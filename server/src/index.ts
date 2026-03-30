import express from "express";
import cors from "cors";
import { initDB } from "./models/database.js";
import feedsRouter from "./routes/feeds.js";
import articlesRouter from "./routes/articles.js";
import categoriesRouter from "./routes/categories.js";
import opmlRouter from "./routes/opml.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/feeds", feedsRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/opml", opmlRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
