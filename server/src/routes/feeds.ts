import { Router } from "express";
import { getDB, saveDB, query, queryScalar } from "../models/database.js";
import {
  fetchAndSaveArticles,
  discoverFeedInfo,
} from "../services/feedService.js";

const router = Router();

interface FeedRow {
  id: number;
  title: string;
  url: string;
  site_url: string | null;
  description: string | null;
  category_id: number | null;
  last_fetched_at: string | null;
  health_status: string;
  last_error_message: string | null;
  created_at: string;
  category_name: string | null;
  unread_count: number;
}

router.get("/", (_req, res) => {
  const feeds = query<FeedRow>(`
    SELECT f.id, f.title, f.url, f.site_url, f.description, f.category_id,
           f.last_fetched_at, f.health_status, f.last_error_message,
           f.created_at, c.name as category_name,
           (SELECT COUNT(*) FROM articles WHERE feed_id = f.id AND is_read = 0) as unread_count
    FROM feeds f
    LEFT JOIN categories c ON f.category_id = c.id
    ORDER BY f.title
  `);
  res.json(feeds);
});

router.post("/", async (req, res) => {
  const { url, category_id } = req.body;
  if (!url?.trim()) {
    res.status(400).json({ error: "Feed URL is required" });
    return;
  }

  try {
    const info = await discoverFeedInfo(url.trim());
    const db = getDB();

    db.run(
      `INSERT INTO feeds (title, url, site_url, description, category_id) VALUES (?, ?, ?, ?, ?)`,
      [info.title, url.trim(), info.link || null, info.description, category_id || null]
    );

    const feedId = queryScalar<number>(`SELECT last_insert_rowid()`) ?? 0;
    saveDB();

    try {
      await fetchAndSaveArticles(feedId, url.trim());
    } catch {
      // feed added but initial fetch failed — not critical
    }

    res.status(201).json({
      id: feedId,
      title: info.title,
      url: url.trim(),
      site_url: info.link,
      description: info.description,
      category_id: category_id || null,
    });
  } catch (err: any) {
    if (err?.message?.includes("UNIQUE")) {
      res.status(409).json({ error: "Feed already subscribed" });
    } else {
      res.status(400).json({ error: "Failed to fetch feed: " + err?.message });
    }
  }
});

router.post("/:id/refresh", async (req, res) => {
  const { id } = req.params;
  const rows = query<{ url: string }>(`SELECT url FROM feeds WHERE id = ?`, [Number(id)]);

  if (rows.length === 0) {
    res.status(404).json({ error: "Feed not found" });
    return;
  }

  const result = await fetchAndSaveArticles(Number(id), rows[0].url);
  res.json({ new_articles: result.newCount, success: result.success });
});

router.post("/refresh-all", async (_req, res) => {
  const rows = query<{ id: number; url: string }>(`SELECT id, url FROM feeds`);

  let totalNew = 0;
  for (const row of rows) {
    const result = await fetchAndSaveArticles(row.id, row.url);
    totalNew += result.newCount;
  }
  res.json({ total_new: totalNew });
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title, category_id } = req.body;
  const db = getDB();

  if (title !== undefined) {
    db.run(`UPDATE feeds SET title = ? WHERE id = ?`, [title, Number(id)]);
  }
  if (category_id !== undefined) {
    db.run(`UPDATE feeds SET category_id = ? WHERE id = ?`, [category_id, Number(id)]);
  }
  saveDB();
  res.json({ success: true });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.run(`DELETE FROM articles WHERE feed_id = ?`, [Number(id)]);
  db.run(`DELETE FROM feeds WHERE id = ?`, [Number(id)]);
  saveDB();
  res.status(204).send();
});

export default router;
