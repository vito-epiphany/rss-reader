import initSqlJs, { type Database } from "sql.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "../../data/rss.db");

let db: Database;

export async function initDB(): Promise<Database> {
  const SQL = await initSqlJs();

  const dataDir = dirname(DB_PATH);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      site_url TEXT,
      description TEXT,
      category_id INTEGER,
      last_fetched_at TEXT,
      health_status TEXT DEFAULT 'ok',
      last_error_message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // Migration for existing databases
  try { db.run(`ALTER TABLE feeds ADD COLUMN health_status TEXT DEFAULT 'ok'`); } catch {}
  try { db.run(`ALTER TABLE feeds ADD COLUMN last_error_message TEXT`); } catch {}

  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      author TEXT,
      content TEXT,
      summary TEXT,
      published_at TEXT,
      is_read INTEGER DEFAULT 0,
      is_starred INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE,
      UNIQUE(feed_id, url)
    )
  `);

  db.run(
    `CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id)`
  );
  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_is_read ON articles(is_read)`);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_articles_is_starred ON articles(is_starred)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at)`
  );

  saveDB();
  return db;
}

export function getDB(): Database {
  return db;
}

export function saveDB(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

/** Run a SELECT query and return rows as objects using prepared statements */
export function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params as any);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

/** Run a SELECT query and return a single scalar value */
export function queryScalar<T = number>(
  sql: string,
  params: unknown[] = []
): T | null {
  const result = db.exec(sql, params as any);
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as T;
  }
  return null;
}
