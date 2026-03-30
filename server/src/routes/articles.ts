import { Router } from "express";
import { getDB, saveDB, query, queryScalar } from "../models/database.js";

const router = Router();

interface ArticleRow {
  id: number;
  feed_id: number;
  title: string;
  url: string;
  author: string | null;
  content: string | null;
  summary: string | null;
  published_at: string | null;
  is_read: number;
  is_starred: number;
  created_at: string;
  feed_title: string;
}

router.get("/", (req, res) => {
  const {
    feed_id,
    is_read,
    is_starred,
    search,
    limit = "50",
    offset = "0",
  } = req.query;

  let where = "WHERE 1=1";
  const params: unknown[] = [];

  if (feed_id) {
    where += " AND a.feed_id = ?";
    params.push(Number(feed_id));
  }
  if (is_read !== undefined) {
    where += " AND a.is_read = ?";
    params.push(Number(is_read));
  }
  if (is_starred !== undefined) {
    where += " AND a.is_starred = ?";
    params.push(Number(is_starred));
  }
  if (search) {
    where += " AND (a.title LIKE ? OR a.summary LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term);
  }

  const countParams = [...params];
  params.push(Number(limit), Number(offset));

  const articles = query<ArticleRow>(
    `SELECT a.id, a.feed_id, a.title, a.url, a.author, a.content, a.summary,
            a.published_at, a.is_read, a.is_starred, a.created_at,
            f.title as feed_title
     FROM articles a
     JOIN feeds f ON a.feed_id = f.id
     ${where}
     ORDER BY a.published_at DESC, a.created_at DESC
     LIMIT ? OFFSET ?`,
    params
  );

  const total =
    queryScalar<number>(
      `SELECT COUNT(*) FROM articles a ${where}`,
      countParams
    ) ?? 0;

  res.json({ articles, total });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;

  const rows = query<ArticleRow>(
    `SELECT a.id, a.feed_id, a.title, a.url, a.author, a.content, a.summary,
            a.published_at, a.is_read, a.is_starred, a.created_at,
            f.title as feed_title
     FROM articles a
     JOIN feeds f ON a.feed_id = f.id
     WHERE a.id = ?`,
    [Number(id)]
  );

  if (rows.length === 0) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(rows[0]);
});

router.patch("/:id/read", (req, res) => {
  const { id } = req.params;
  const { is_read } = req.body;
  const db = getDB();
  db.run(`UPDATE articles SET is_read = ? WHERE id = ?`, [
    is_read ? 1 : 0,
    Number(id),
  ]);
  saveDB();
  res.json({ success: true });
});

router.patch("/:id/star", (req, res) => {
  const { id } = req.params;
  const { is_starred } = req.body;
  const db = getDB();
  db.run(`UPDATE articles SET is_starred = ? WHERE id = ?`, [
    is_starred ? 1 : 0,
    Number(id),
  ]);
  saveDB();
  res.json({ success: true });
});

router.post("/mark-all-read", (req, res) => {
  const { feed_id } = req.body;
  const db = getDB();

  if (feed_id) {
    db.run(
      `UPDATE articles SET is_read = 1 WHERE feed_id = ? AND is_read = 0`,
      [feed_id]
    );
  } else {
    db.run(`UPDATE articles SET is_read = 1 WHERE is_read = 0`);
  }
  saveDB();
  res.json({ success: true });
});

export default router;
