import Parser from "rss-parser";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getDB, saveDB, queryScalar } from "../models/database.js";

// 从环境变量获取代理设置
const HTTP_PROXY = process.env.HTTP_PROXY || process.env.http_proxy;
const HTTPS_PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;

// 创建带代理支持的 parser
const getParserWithProxy = () => {
  const config: any = {
    defaultRSS: "2.0",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RSS Reader/1.0)",
      Accept: "application/rss+xml,application/atom+xml,text/xml,*/*",
    },
    timeout: 30000, // 30 seconds
  };

  // 如果设置了代理，则添加代理 agent
  if (HTTPS_PROXY) {
    config.agent = new HttpsProxyAgent(HTTPS_PROXY);
    console.log(`[INFO] Using HTTPS proxy: ${HTTPS_PROXY}`);
  } else if (HTTP_PROXY) {
    config.agent = new HttpsProxyAgent(HTTP_PROXY);
    console.log(`[INFO] Using HTTP proxy: ${HTTP_PROXY}`);
  }

  return new Parser(config);
};

export async function fetchAndSaveArticles(
  feedId: number,
  feedUrl: string
): Promise<{ newCount: number; success: boolean; error?: string }> {
  const db = getDB();
  const parser = getParserWithProxy();

  try {
    console.log(`[DEBUG] Fetching feed: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);
    console.log(`[DEBUG] Feed fetched successfully, items: ${feed.items?.length || 0}`);
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
    console.error(`[ERROR] Failed to fetch feed ${feedId}:`, message);
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
  const parser = getParserWithProxy();
  const feed = await parser.parseURL(feedUrl);
  return {
    title: feed.title || feedUrl,
    description: feed.description || "",
    link: feed.link,
  };
}
