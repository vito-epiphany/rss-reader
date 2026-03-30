import Parser from "rss-parser";
import { getDB, saveDB, queryScalar } from "../models/database.js";

const parser = new Parser();

export async function fetchAndSaveArticles(
  feedId: number,
  feedUrl: string
): Promise<{ newCount: number; success: boolean; error?: string }> {
  const db = getDB();

  try {
    const feed = await parser.parseURL(feedUrl);
    let newCount = 0;

    for (const item of feed.items) {
      if (!item.link) continue;

      const existing = queryScalar<number>(
        `SELECT id FROM articles WHERE feed_id = ? AND url = ?`,
        [feedId, item.link]
      );

      if (existing !== null) continue;

      db.run(
        `INSERT INTO articles (feed_id, title, url, author, content, summary, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          feedId,
          item.title || "Untitled",
          item.link,
          item.creator || item.author || null,
          item["content:encoded"] || item.content || null,
          item.contentSnippet || null,
          item.isoDate || item.pubDate || null,
        ]
      );
      newCount++;
    }

    db.run(
      `UPDATE feeds SET last_fetched_at = datetime('now'), health_status = 'ok', last_error_message = NULL WHERE id = ?`,
      [feedId]
    );
    saveDB();
    return { newCount, success: true };
  } catch (err: any) {
    const message = (err?.message || "Unknown error").slice(0, 500);
    db.run(
      `UPDATE feeds SET health_status = 'error', last_error_message = ? WHERE id = ?`,
      [message, feedId]
    );
    saveDB();
    return { newCount: 0, success: false, error: message };
  }
}

export async function discoverFeedInfo(
  feedUrl: string
): Promise<{ title: string; description: string; link?: string }> {
  const feed = await parser.parseURL(feedUrl);
  return {
    title: feed.title || feedUrl,
    description: feed.description || "",
    link: feed.link,
  };
}
