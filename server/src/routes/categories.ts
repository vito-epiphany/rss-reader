import { Router } from "express";
import { getDB, saveDB, query, queryScalar } from "../models/database.js";

const router = Router();

router.get("/", (_req, res) => {
  const categories = query<{ id: number; name: string; created_at: string }>(
    `SELECT id, name, created_at FROM categories ORDER BY name`
  );
  res.json(categories);
});

router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: "Category name is required" });
    return;
  }
  const db = getDB();
  try {
    db.run(`INSERT INTO categories (name) VALUES (?)`, [name.trim()]);
    const id = queryScalar<number>(`SELECT last_insert_rowid()`) ?? 0;
    saveDB();
    res.status(201).json({ id, name: name.trim() });
  } catch {
    res.status(409).json({ error: "Category already exists" });
  }
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name?.trim()) {
    res.status(400).json({ error: "Category name is required" });
    return;
  }
  const db = getDB();
  db.run(`UPDATE categories SET name = ? WHERE id = ?`, [name.trim(), Number(id)]);
  saveDB();
  res.json({ id: Number(id), name: name.trim() });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.run(`UPDATE feeds SET category_id = NULL WHERE category_id = ?`, [Number(id)]);
  db.run(`DELETE FROM categories WHERE id = ?`, [Number(id)]);
  saveDB();
  res.status(204).send();
});

export default router;
