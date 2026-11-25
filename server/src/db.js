/**
 * db.js - SQLite 数据库初始化与操作
 *
 * 使用 better-sqlite3 进行同步数据库操作。
 * 自动创建 users 和 skins 表。
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

// 确定数据库路径
let dbPath;
if (process.env.DB_PATH) {
  dbPath = path.resolve(projectRoot, process.env.DB_PATH);
} else {
  dbPath = path.join(projectRoot, 'data', 'blockbrew.db');
}

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// 启用 WAL 模式提升性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Skin',
    model_type TEXT NOT NULL DEFAULT 'steve' CHECK(model_type IN ('steve', 'alex')),
    inner_data TEXT NOT NULL,
    outer_data TEXT NOT NULL,
    preview_url TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_skins_user_id ON skins(user_id);
  CREATE INDEX IF NOT EXISTS idx_skins_public ON skins(is_public, created_at);
`);

export default db;
