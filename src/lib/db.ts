import { Pool } from "@neondatabase/serverless";
import { createClient, Client as LibsqlClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { menus as initialMenus } from "@/data/menus";

export interface DbQueryResult {
  rows: any[];
  rowsAffected?: number;
}

export interface DbTransaction {
  execute: (query: string | { sql: string; args?: any[] }) => Promise<DbQueryResult>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  close: () => void;
}

export interface DbClient {
  isPostgres: boolean;
  execute: (query: string | { sql: string; args?: any[] }) => Promise<DbQueryResult>;
  transaction: (mode?: "write" | "read") => Promise<DbTransaction>;
}

declare global {
  // eslint-disable-next-line no-var
  var __thaiKitchenDb: Promise<DbClient> | undefined;
}

// ============================================================================
// PostgreSQL (Neon Serverless) Implementation
// ============================================================================

const PG_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS table_carts (
    table_id VARCHAR(50) PRIMARY KEY,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    table_id VARCHAR(50) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL,
    subtotal INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_table ON orders (table_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS service_calls (
    id SERIAL PRIMARY KEY,
    table_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    done_at TIMESTAMPTZ
  )`,
  `CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    "desc" TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    image TEXT NOT NULL,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    spiceable BOOLEAN NOT NULL DEFAULT FALSE,
    extras JSONB,
    is_available BOOLEAN NOT NULL DEFAULT TRUE
  )`,
  `CREATE TABLE IF NOT EXISTS restaurant_tables (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    seats INTEGER NOT NULL DEFAULT 4,
    zone VARCHAR(100) NOT NULL DEFAULT 'โซนห้องแอร์',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

function toPostgresSql(sql: string): string {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

class NeonDbClient implements DbClient {
  public isPostgres = true;
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async execute(query: string | { sql: string; args?: any[] }): Promise<DbQueryResult> {
    const rawSql = typeof query === "string" ? query : query.sql;
    const args = typeof query === "string" ? [] : query.args ?? [];
    const pgSql = toPostgresSql(rawSql);

    const res = await this.pool.query(pgSql, args);
    return {
      rows: res.rows,
      rowsAffected: res.rowCount ?? 0,
    };
  }

  async transaction(): Promise<DbTransaction> {
    const client = await this.pool.connect();
    await client.query("BEGIN");
    let closed = false;

    return {
      execute: async (query: string | { sql: string; args?: any[] }) => {
        const rawSql = typeof query === "string" ? query : query.sql;
        const args = typeof query === "string" ? [] : query.args ?? [];
        const pgSql = toPostgresSql(rawSql);
        const res = await client.query(pgSql, args);
        return {
          rows: res.rows,
          rowsAffected: res.rowCount ?? 0,
        };
      },
      commit: async () => {
        if (!closed) await client.query("COMMIT");
      },
      rollback: async () => {
        if (!closed) await client.query("ROLLBACK");
      },
      close: () => {
        if (!closed) {
          closed = true;
          client.release();
        }
      },
    };
  }
}

async function seedInitialTablesPg(client: DbClient) {
  const existing = await client.execute("SELECT COUNT(*) AS c FROM restaurant_tables");
  if (Number(existing.rows[0]?.c ?? 0) === 0) {
    const initialTables = [
      { id: "1", name: "โต๊ะ 1", seats: 4, zone: "โซนห้องแอร์" },
      { id: "2", name: "โต๊ะ 2", seats: 4, zone: "โซนห้องแอร์" },
      { id: "3", name: "โต๊ะ 3", seats: 4, zone: "โซนห้องแอร์" },
      { id: "4", name: "โต๊ะ 4", seats: 6, zone: "โซนห้องแอร์" },
      { id: "5", name: "โต๊ะ 5", seats: 2, zone: "โซนระเบียง / หน้าร้าน" },
      { id: "6", name: "โต๊ะ 6", seats: 8, zone: "ห้อง VIP" },
    ];
    const now = new Date().toISOString();
    for (const t of initialTables) {
      await client.execute({
        sql: `INSERT INTO restaurant_tables (id, name, seats, zone, status, created_at)
              VALUES (?, ?, ?, ?, 'ACTIVE', ?)
              ON CONFLICT (id) DO NOTHING`,
        args: [t.id, t.name, t.seats, t.zone, now],
      });
    }
  }
}

async function seedInitialMenusPg(client: DbClient) {
  const existing = await client.execute("SELECT COUNT(*) AS c FROM menus");
  if (Number(existing.rows[0]?.c ?? 0) === 0) {
    for (const m of initialMenus) {
      await client.execute({
        sql: `INSERT INTO menus 
          (id, name, category, price, "desc", ingredients, image, is_popular, spiceable, extras, is_available) 
          VALUES (?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            price = EXCLUDED.price,
            "desc" = EXCLUDED."desc",
            ingredients = EXCLUDED.ingredients,
            image = EXCLUDED.image,
            is_popular = EXCLUDED.is_popular,
            spiceable = EXCLUDED.spiceable,
            extras = EXCLUDED.extras,
            is_available = EXCLUDED.is_available`,
        args: [
          m.id,
          m.name,
          m.category,
          m.price,
          m.desc,
          m.ingredients,
          m.image,
          Boolean(m.isPopular),
          Boolean(m.spiceable),
          m.extras ? JSON.stringify(m.extras) : null,
          true,
        ],
      });
    }
  }
}

// ============================================================================
// SQLite (libSQL Fallback for Offline / Local Dev without Neon URL)
// ============================================================================

const SQLITE_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS table_carts (
    table_id TEXT PRIMARY KEY,
    items TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL,
    items TEXT NOT NULL,
    status TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    paid_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_orders_table ON orders (table_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at)`,
  `CREATE TABLE IF NOT EXISTS service_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    done_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    "desc" TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    image TEXT NOT NULL,
    is_popular INTEGER NOT NULL DEFAULT 0,
    spiceable INTEGER NOT NULL DEFAULT 0,
    extras TEXT,
    is_available INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS restaurant_tables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 4,
    zone TEXT NOT NULL DEFAULT 'โซนห้องแอร์',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL
  )`,
];

class LibsqlDbClient implements DbClient {
  public isPostgres = false;
  private client: LibsqlClient;

  constructor(client: LibsqlClient) {
    this.client = client;
  }

  async execute(query: string | { sql: string; args?: any[] }): Promise<DbQueryResult> {
    const res = await this.client.execute(query);
    return {
      rows: res.rows as any[],
      rowsAffected: res.rowsAffected,
    };
  }

  async transaction(mode: "write" | "read" = "write"): Promise<DbTransaction> {
    const tx = await this.client.transaction(mode);
    return {
      execute: async (query) => {
        const res = await tx.execute(query);
        return {
          rows: res.rows as any[],
          rowsAffected: res.rowsAffected,
        };
      },
      commit: () => tx.commit(),
      rollback: () => tx.rollback(),
      close: () => tx.close(),
    };
  }
}

async function seedInitialTablesSqlite(client: DbClient) {
  const existing = await client.execute("SELECT COUNT(*) AS c FROM restaurant_tables");
  if (Number(existing.rows[0]?.c ?? 0) === 0) {
    const initialTables = [
      { id: "1", name: "โต๊ะ 1", seats: 4, zone: "โซนห้องแอร์" },
      { id: "2", name: "โต๊ะ 2", seats: 4, zone: "โซนห้องแอร์" },
      { id: "3", name: "โต๊ะ 3", seats: 4, zone: "โซนห้องแอร์" },
      { id: "4", name: "โต๊ะ 4", seats: 6, zone: "โซนห้องแอร์" },
      { id: "5", name: "โต๊ะ 5", seats: 2, zone: "โซนระเบียง / หน้าร้าน" },
      { id: "6", name: "โต๊ะ 6", seats: 8, zone: "ห้อง VIP" },
    ];
    const now = new Date().toISOString();
    for (const t of initialTables) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO restaurant_tables (id, name, seats, zone, status, created_at)
              VALUES (?, ?, ?, ?, 'ACTIVE', ?)`,
        args: [t.id, t.name, t.seats, t.zone, now],
      });
    }
  }
}

async function seedInitialMenusSqlite(client: DbClient) {
  const existing = await client.execute("SELECT COUNT(*) AS c FROM menus");
  if (Number(existing.rows[0]?.c ?? 0) === 0) {
    for (const m of initialMenus) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO menus 
          (id, name, category, price, "desc", ingredients, image, is_popular, spiceable, extras, is_available) 
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          m.id,
          m.name,
          m.category,
          m.price,
          m.desc,
          m.ingredients,
          m.image,
          m.isPopular ? 1 : 0,
          m.spiceable ? 1 : 0,
          m.extras ? JSON.stringify(m.extras) : null,
          1,
        ],
      });
    }
  }
}

// ============================================================================
// Initialization & Database Resolver
// ============================================================================

async function init(): Promise<DbClient> {
  const pgUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.STORAGE_POSTGRES_URL;

  // 1. ถ้ามี DATABASE_URL หรือ POSTGRES_URL ของ Neon / PostgreSQL (บน Vercel หรือใน .env.local)
  if (pgUrl && (pgUrl.startsWith("postgres://") || pgUrl.startsWith("postgresql://"))) {
    const client = new NeonDbClient(pgUrl);
    for (const sql of PG_SCHEMA) {
      await client.execute(sql);
    }
    await seedInitialMenusPg(client);
    await seedInitialTablesPg(client);
    return client;
  }

  // 2. ถ้ายังไม่ได้กำหนด URL ฐานข้อมูล Neon -> ใช้งาน SQLite ในเครื่องเป็น Fallback ชั่วคราว
  const sqliteUrl = process.env.TURSO_DATABASE_URL ?? "file:data/chanon.db";
  if (sqliteUrl.startsWith("file:")) {
    const filePath = sqliteUrl.slice("file:".length);
    fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  }

  const rawClient = createClient({
    url: sqliteUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  await rawClient.batch(SQLITE_SCHEMA, "write");

  const client = new LibsqlDbClient(rawClient);
  await seedInitialMenusSqlite(client);
  await seedInitialTablesSqlite(client);

  return client;
}

export function getDb(): Promise<DbClient> {
  if (!global.__thaiKitchenDb) {
    global.__thaiKitchenDb = init().catch((err) => {
      global.__thaiKitchenDb = undefined;
      throw err;
    });
  }
  return global.__thaiKitchenDb;
}
