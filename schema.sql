-- ==============================================================================
-- Thai Kitchen - PostgreSQL Schema for Neon Database
-- รองรับการใช้งานผ่าน Vercel + Neon Serverless Driver (@neondatabase/serverless)
-- ==============================================================================

-- 1. ตารางเมนูอาหาร (Menus)
CREATE TABLE IF NOT EXISTS menus (
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
);

-- 2. ตารางข้อมูลโต๊ะในร้าน (Restaurant Tables)
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  seats INTEGER NOT NULL DEFAULT 4,
  zone VARCHAR(100) NOT NULL DEFAULT 'โซนห้องแอร์',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ตารางตะกร้าอาหารประจำโต๊ะ (Table Carts - Shared Cart)
CREATE TABLE IF NOT EXISTS table_carts (
  table_id VARCHAR(50) PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ตารางออเดอร์ (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  table_id VARCHAR(50) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_table ON orders (table_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);

-- 5. ตารางคำขอบริการจากโต๊ะ (Service Calls)
CREATE TABLE IF NOT EXISTS service_calls (
  id SERIAL PRIMARY KEY,
  table_id VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  done_at TIMESTAMPTZ
);
