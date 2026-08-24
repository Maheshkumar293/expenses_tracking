const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { POSTGRES_SCHEMA, SQLITE_SCHEMA, DEFAULT_CATEGORIES } = require('./schema');

let dbMode = 'pg';
let pgPool = null;
let sqliteDb = null;

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      const isSupabase = connectionString.includes('supabase') || connectionString.includes('pooler') || connectionString.includes('sslmode=require');
      pgPool = new Pool({
        connectionString,
        ssl: (process.env.NODE_ENV === 'production' || isSupabase) ? { rejectUnauthorized: false } : false
      });
      // Test connection
      await pgPool.query('SELECT NOW()');
      console.log('Connected to PostgreSQL Database successfully');
      dbMode = 'pg';

      // Run schema
      await pgPool.query(POSTGRES_SCHEMA);
      await seedDefaultCategoriesPg();
      return;
    } catch (err) {
      console.warn('PostgreSQL connection attempt failed or database not running locally. Switching to embedded SQLite for instant seamless execution.', err.message);
    }
  }

  // Embedded SQLite Fallback
  dbMode = 'sqlite';
  const dbDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'expense_tracker.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.exec(SQLITE_SCHEMA);
  console.log(`Connected to SQLite fallback database at ${dbPath}`);
  seedDefaultCategoriesSqlite();
}

async function seedDefaultCategoriesPg() {
  try {
    const res = await pgPool.query('SELECT COUNT(*) FROM categories WHERE user_id IS NULL');
    if (parseInt(res.rows[0].count, 10) === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        const parentRes = await pgPool.query(
          'INSERT INTO categories (name, type, icon, color, user_id) VALUES ($1, $2, $3, $4, NULL) RETURNING id',
          [cat.name, cat.type, cat.icon, cat.color]
        );
        const parentId = parentRes.rows[0].id;
        for (const sub of cat.subcategories) {
          await pgPool.query(
            'INSERT INTO categories (name, type, icon, color, parent_id, user_id) VALUES ($1, $2, $3, $4, $5, NULL)',
            [sub, cat.type, cat.icon, cat.color, parentId]
          );
        }
      }
      console.log('Seeded default categories in PostgreSQL');
    }
  } catch (e) {
    console.error('Error seeding Postgres categories:', e);
  }
}

function seedDefaultCategoriesSqlite() {
  try {
    const count = sqliteDb.prepare('SELECT COUNT(*) as cnt FROM categories WHERE user_id IS NULL').get();
    if (count.cnt === 0) {
      const insertCat = sqliteDb.prepare('INSERT INTO categories (name, type, icon, color, user_id, parent_id) VALUES (?, ?, ?, ?, NULL, ?)');
      for (const cat of DEFAULT_CATEGORIES) {
        const info = insertCat.run(cat.name, cat.type, cat.icon, cat.color, null);
        const parentId = info.lastInsertRowid;
        for (const sub of cat.subcategories) {
          insertCat.run(sub, cat.type, cat.icon, cat.color, parentId);
        }
      }
      console.log('Seeded default categories in SQLite');
    }
  } catch (e) {
    console.error('Error seeding SQLite categories:', e);
  }
}

/**
 * Universal Query Adapter
 * Normalizes SQL queries ($1, $2 params for Postgres mapped accurately to ? for SQLite)
 */
async function query(sql, params = []) {
  if (dbMode === 'pg') {
    const res = await pgPool.query(sql, params);
    return res.rows;
  } else {
    // Correctly map PostgreSQL $1, $2 placeholders to SQLite ? while preserving parameter counts
    const sqliteParams = [];
    const sqliteSql = sql.replace(/\$(\d+)/g, (match, paramIndex) => {
      const idx = parseInt(paramIndex, 10) - 1;
      sqliteParams.push(params[idx]);
      return '?';
    });

    const isInsert = sqliteSql.trim().toUpperCase().startsWith('INSERT');
    const isUpdate = sqliteSql.trim().toUpperCase().startsWith('UPDATE');
    const isDelete = sqliteSql.trim().toUpperCase().startsWith('DELETE');

    let cleanSql = sqliteSql.replace(/RETURNING\s+[\*\w\s,]+/gi, '');

    if (isInsert) {
      const stmt = sqliteDb.prepare(cleanSql);
      const info = stmt.run(...sqliteParams);
      if (sql.toUpperCase().includes('RETURNING')) {
        const getRow = sqliteDb.prepare('SELECT * FROM ' + getTableName(cleanSql) + ' WHERE id = ?');
        const row = getRow.get(info.lastInsertRowid);
        return [row];
      }
      return [{ id: info.lastInsertRowid, affectedRows: info.changes }];
    } else if (isUpdate || isDelete) {
      const stmt = sqliteDb.prepare(cleanSql);
      const info = stmt.run(...sqliteParams);
      return [{ affectedRows: info.changes }];
    } else {
      const stmt = sqliteDb.prepare(cleanSql);
      const rows = stmt.all(...sqliteParams);
      return rows;
    }
  }
}

function getTableName(sql) {
  const match = sql.match(/INTO\s+([a-zA-Z0-9_]+)/i);
  return match ? match[1] : '';
}

module.exports = {
  initDatabase,
  query,
  getDbMode: () => dbMode
};
