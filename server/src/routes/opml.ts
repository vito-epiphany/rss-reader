import { Router } from "express";
import { getDB, saveDB, query, queryScalar } from "../models/database.js";
import { fetchAndSaveArticles, discoverFeedInfo } from "../services/feedService.js";

const router = Router();

interface OpmlOutline {
  title?: string;
  text?: string;
  xmlUrl?: string;
  htmlUrl?: string;
  type?: string;
  children: OpmlOutline[];
}

/** Minimal OPML XML parser — no external dependency needed */
function parseOpml(xml: string): OpmlOutline[] {
  const outlines: OpmlOutline[] = [];

  // Extract <body> content
  const bodyMatch = xml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return outlines;

  parseOutlines(bodyMatch[1], outlines);
  return outlines;
}

function parseOutlines(xml: string, results: OpmlOutline[]): void {
  // Match top-level <outline> tags (self-closing or with children)
  const outlineRegex = /<outline\b([^>]*?)(?:\/>|>([\s\S]*?)<\/outline>)/gi;
  let match: RegExpExecArray | null;

  while ((match = outlineRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const inner = match[2] || "";

    const outline: OpmlOutline = {
      title: getAttr(attrs, "title") || getAttr(attrs, "text"),
      text: getAttr(attrs, "text"),
      xmlUrl: getAttr(attrs, "xmlUrl"),
      htmlUrl: getAttr(attrs, "htmlUrl"),
      type: getAttr(attrs, "type"),
      children: [],
    };

    if (inner.trim()) {
      parseOutlines(inner, outline.children);
    }

    results.push(outline);
  }
}

function getAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i");
  const m = attrs.match(re);
  return m ? decodeXmlEntities(m[1]) : undefined;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

router.post("/import", async (req, res) => {
  const { opml } = req.body;
  if (!opml || typeof opml !== "string") {
    res.status(400).json({ error: "OPML content is required" });
    return;
  }

  const outlines = parseOpml(opml);
  if (outlines.length === 0) {
    res.status(400).json({ error: "No feeds found in OPML file" });
    return;
  }

  const db = getDB();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const outline of outlines) {
    if (outline.xmlUrl) {
      // Top-level feed (no category)
      const result = await importFeed(db, outline, null);
      if (result === "imported") imported++;
      else if (result === "skipped") skipped++;
      else errors.push(result);
    } else if (outline.children.length > 0) {
      // Category folder
      const categoryName = outline.title || outline.text || "Imported";
      let categoryId: number | null = null;

      // Find or create category
      const existing = queryScalar<number>(
        `SELECT id FROM categories WHERE name = ?`,
        [categoryName]
      );
      if (existing !== null) {
        categoryId = existing;
      } else {
        db.run(`INSERT INTO categories (name) VALUES (?)`, [categoryName]);
        categoryId = queryScalar<number>(`SELECT last_insert_rowid()`) ?? null;
        saveDB();
      }

      for (const child of outline.children) {
        if (child.xmlUrl) {
          const result = await importFeed(db, child, categoryId);
          if (result === "imported") imported++;
          else if (result === "skipped") skipped++;
          else errors.push(result);
        }
      }
    }
  }

  res.json({ imported, skipped, errors: errors.slice(0, 10) });
});

async function importFeed(
  db: ReturnType<typeof getDB>,
  outline: OpmlOutline,
  categoryId: number | null
): Promise<"imported" | "skipped" | string> {
  const url = outline.xmlUrl!;

  // Check if already subscribed
  const exists = queryScalar<number>(
    `SELECT id FROM feeds WHERE url = ?`,
    [url]
  );
  if (exists !== null) return "skipped";

  try {
    let title = outline.title || outline.text || "";
    let siteUrl = outline.htmlUrl || null;
    let description = "";

    // Try to discover feed info, fall back to OPML metadata
    try {
      const info = await discoverFeedInfo(url);
      title = title || info.title;
      siteUrl = siteUrl || info.link || null;
      description = info.description;
    } catch {
      // Use OPML metadata as fallback
      if (!title) title = url;
    }

    db.run(
      `INSERT INTO feeds (title, url, site_url, description, category_id) VALUES (?, ?, ?, ?, ?)`,
      [title, url, siteUrl, description, categoryId]
    );
    const feedId = queryScalar<number>(`SELECT last_insert_rowid()`) ?? 0;
    saveDB();

    // Fetch articles in background — don't block import
    fetchAndSaveArticles(feedId, url).catch(() => {});

    return "imported";
  } catch (err: any) {
    return `${url}: ${err?.message || "unknown error"}`;
  }
}

export default router;
