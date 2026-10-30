import { getDb } from "@/lib/db";
import { CartItem, TableCart } from "@/types/cart";
import { Order, OrderStatus } from "@/types/order";
import { ServiceCall, ServiceCallType } from "@/types/service";
import { MenuItem, MenuCategory } from "@/types/menu";
import { RestaurantTable, TableStatus } from "@/types/restaurant-table";

const nowIso = () => new Date().toISOString();

function toBool(val: unknown): boolean {
  return val === true || val === 1 || val === "1" || val === "true";
}

function parseJson<T>(val: unknown, fallback: T): T {
  if (val === undefined || val === null) return fallback;
  if (typeof val === "object") return val as T;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function rowToOrder(row: any): Order {
  return {
    id: String(row.id),
    tableId: String(row.table_id),
    items: parseJson<CartItem[]>(row.items, []),
    status: String(row.status) as OrderStatus,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    createdAt: String(row.created_at),
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
  };
}

function rowToCall(row: any): ServiceCall {
  return {
    id: Number(row.id),
    tableId: String(row.table_id),
    type: String(row.type) as ServiceCallType,
    status: String(row.status) as ServiceCall["status"],
    createdAt: String(row.created_at),
    doneAt: row.done_at ? String(row.done_at) : undefined,
  };
}

function rowToMenu(row: any): MenuItem {
  return {
    id: Number(row.id),
    name: String(row.name),
    category: String(row.category) as Exclude<MenuCategory, "ทั้งหมด">,
    price: Number(row.price),
    desc: String(row.desc),
    ingredients: String(row.ingredients),
    image: String(row.image),
    isPopular: toBool(row.is_popular),
    spiceable: toBool(row.spiceable),
    extras: row.extras ? parseJson<any[]>(row.extras, []) : undefined,
    isAvailable: row.is_available !== false && row.is_available !== 0 && row.is_available !== "0",
  };
}

function rowToTable(row: any): RestaurantTable {
  return {
    id: String(row.id),
    name: String(row.name),
    seats: Number(row.seats),
    zone: String(row.zone),
    status: String(row.status) as TableStatus,
    createdAt: String(row.created_at),
  };
}

// ---------- Menus Management (Database) ----------

export async function getDbMenus(): Promise<MenuItem[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM menus ORDER BY id ASC");
  return res.rows.map(rowToMenu);
}

export async function getDbMenuById(id: number): Promise<MenuItem | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM menus WHERE id = ?",
    args: [id],
  });
  return res.rows[0] ? rowToMenu(res.rows[0]) : null;
}

export async function toggleMenuAvailability(id: number, isAvailable: boolean): Promise<MenuItem | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "UPDATE menus SET is_available = ? WHERE id = ? RETURNING *",
    args: [isAvailable, id],
  });
  return res.rows[0] ? rowToMenu(res.rows[0]) : null;
}

// ---------- Table cart ----------

export async function getTableCart(tableId: string): Promise<TableCart> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT items, updated_at FROM table_carts WHERE table_id = ?",
    args: [tableId],
  });
  const row = res.rows[0];
  if (!row) return { tableId, items: [], updatedAt: nowIso() };
  return {
    tableId,
    items: parseJson<CartItem[]>(row.items, []),
    updatedAt: String(row.updated_at),
  };
}

export async function mutateTableCart(
  tableId: string,
  mutate: (items: CartItem[]) => CartItem[]
): Promise<TableCart> {
  const db = await getDb();
  const tx = await db.transaction("write");
  try {
    const res = await tx.execute({
      sql: "SELECT items FROM table_carts WHERE table_id = ?",
      args: [tableId],
    });
    const current = res.rows[0] ? parseJson<CartItem[]>(res.rows[0].items, []) : [];
    const items = mutate(current);
    const updatedAt = nowIso();
    await tx.execute({
      sql: `INSERT INTO table_carts (table_id, items, updated_at) VALUES (?,?,?)
            ON CONFLICT (table_id) DO UPDATE SET items = EXCLUDED.items, updated_at = EXCLUDED.updated_at`,
      args: [tableId, JSON.stringify(items), updatedAt],
    });
    await tx.commit();
    return { tableId, items, updatedAt };
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    tx.close();
  }
}

export async function clearTableCart(tableId: string): Promise<TableCart> {
  return mutateTableCart(tableId, () => []);
}

// ---------- Orders ----------

export async function getOrders(): Promise<Order[]> {
  const db = await getDb();
  const res = await db.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 300");
  return res.rows.map(rowToOrder);
}

export async function getTableActiveOrders(tableId: string): Promise<Order[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM orders WHERE table_id = ? AND status != 'PAID' ORDER BY created_at DESC",
    args: [tableId],
  });
  return res.rows.map(rowToOrder);
}

export async function createOrderFromCart(tableId: string): Promise<Order | null> {
  const db = await getDb();
  const tx = await db.transaction("write");
  try {
    const cartRes = await tx.execute({
      sql: "SELECT items FROM table_carts WHERE table_id = ?",
      args: [tableId],
    });
    const items = cartRes.rows[0] ? parseJson<CartItem[]>(cartRes.rows[0].items, []) : [];
    if (items.length === 0) {
      await tx.rollback();
      return null;
    }

    const maxRes = await tx.execute(
      "SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) AS m FROM orders"
    );
    const nextNumber = Math.max(100, Number(maxRes.rows[0]?.m ?? 0)) + 1;
    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const order: Order = {
      id: `ORD-${nextNumber}`,
      tableId,
      items,
      status: "PENDING",
      subtotal,
      total: subtotal,
      createdAt: nowIso(),
    };

    await tx.execute({
      sql: "INSERT INTO orders (id, table_id, items, status, subtotal, total, created_at) VALUES (?,?,?,?,?,?,?)",
      args: [order.id, tableId, JSON.stringify(items), order.status, subtotal, subtotal, order.createdAt],
    });
    await tx.execute({
      sql: "UPDATE table_carts SET items = '[]', updated_at = ? WHERE table_id = ?",
      args: [nowIso(), tableId],
    });
    await tx.commit();
    return order;
  } catch (err) {
    await tx.rollback();
    throw err;
  } finally {
    tx.close();
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  const db = await getDb();
  const paidAt = status === "PAID" ? nowIso() : null;
  const res = await db.execute({
    sql: "UPDATE orders SET status = ?, paid_at = ? WHERE id = ? RETURNING *",
    args: [status, paidAt, orderId],
  });
  return res.rows[0] ? rowToOrder(res.rows[0]) : null;
}

// ---------- Daily Sales Analytics (Report) ----------

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  totalDishesSold: number;
  topDishes: { name: string; count: number; total: number }[];
}

export async function getDailySalesReport(): Promise<SalesReport> {
  const db = await getDb();
  // ดึงเฉพาะออเดอร์ที่ชำระเงินแล้ว (PAID)
  const res = await db.execute("SELECT items, total FROM orders WHERE status = 'PAID'");
  
  let totalRevenue = 0;
  let totalDishesSold = 0;
  const dishMap = new Map<string, { count: number; total: number }>();

  for (const row of res.rows) {
    totalRevenue += Number(row.total);
    const items = parseJson<CartItem[]>(row.items, []);
    for (const item of items) {
      totalDishesSold += item.quantity;
      const existing = dishMap.get(item.name) ?? { count: 0, total: 0 };
      existing.count += item.quantity;
      existing.total += item.price * item.quantity;
      dishMap.set(item.name, existing);
    }
  }

  const topDishes = Array.from(dishMap.entries())
    .map(([name, stat]) => ({ name, count: stat.count, total: stat.total }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders: res.rows.length,
    totalDishesSold,
    topDishes,
  };
}

// ---------- Service calls ----------

export async function createServiceCall(tableId: string, type: ServiceCallType): Promise<ServiceCall> {
  const db = await getDb();
  const existing = await db.execute({
    sql: "SELECT * FROM service_calls WHERE table_id = ? AND type = ? AND status = 'OPEN' LIMIT 1",
    args: [tableId, type],
  });
  if (existing.rows[0]) return rowToCall(existing.rows[0]);

  const res = await db.execute({
    sql: "INSERT INTO service_calls (table_id, type, status, created_at) VALUES (?,?,'OPEN',?) RETURNING *",
    args: [tableId, type, nowIso()],
  });
  return rowToCall(res.rows[0]);
}

export async function getOpenServiceCalls(tableId?: string): Promise<ServiceCall[]> {
  const db = await getDb();
  const res = tableId
    ? await db.execute({
        sql: "SELECT * FROM service_calls WHERE status = 'OPEN' AND table_id = ? ORDER BY created_at ASC",
        args: [tableId],
      })
    : await db.execute("SELECT * FROM service_calls WHERE status = 'OPEN' ORDER BY created_at ASC");
  return res.rows.map(rowToCall);
}

export async function resolveServiceCall(id: number): Promise<ServiceCall | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "UPDATE service_calls SET status = 'DONE', done_at = ? WHERE id = ? RETURNING *",
    args: [nowIso(), id],
  });
  return res.rows[0] ? rowToCall(res.rows[0]) : null;
}

// ---------- Tables Management (Database) ----------

export async function getRestaurantTables(): Promise<RestaurantTable[]> {
  const db = await getDb();
  const sortSql = db.isPostgres
    ? "SELECT * FROM restaurant_tables ORDER BY CASE WHEN id ~ '^[0-9]+$' THEN CAST(id AS INTEGER) ELSE 999999 END, id ASC"
    : "SELECT * FROM restaurant_tables ORDER BY CAST(id AS INTEGER) ASC, id ASC";
  const res = await db.execute(sortSql);
  return res.rows.map(rowToTable);
}

export async function getRestaurantTableById(id: string): Promise<RestaurantTable | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM restaurant_tables WHERE id = ?",
    args: [id],
  });
  return res.rows[0] ? rowToTable(res.rows[0]) : null;
}

export async function createRestaurantTable(table: {
  id: string;
  name: string;
  seats?: number;
  zone?: string;
  status?: TableStatus;
}): Promise<RestaurantTable> {
  const db = await getDb();
  const seats = table.seats ?? 4;
  const zone = table.zone?.trim() || "โซนห้องแอร์";
  const status = table.status || "ACTIVE";
  const createdAt = nowIso();

  await db.execute({
    sql: `INSERT INTO restaurant_tables (id, name, seats, zone, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [table.id, table.name, seats, zone, status, createdAt],
  });

  return {
    id: table.id,
    name: table.name,
    seats,
    zone,
    status,
    createdAt,
  };
}

export async function updateRestaurantTable(
  id: string,
  updates: Partial<{ name: string; seats: number; zone: string; status: TableStatus }>
): Promise<RestaurantTable | null> {
  const db = await getDb();
  const current = await getRestaurantTableById(id);
  if (!current) return null;

  const nextName = updates.name !== undefined ? updates.name : current.name;
  const nextSeats = updates.seats !== undefined ? updates.seats : current.seats;
  const nextZone = updates.zone !== undefined ? updates.zone : current.zone;
  const nextStatus = updates.status !== undefined ? updates.status : current.status;

  const res = await db.execute({
    sql: `UPDATE restaurant_tables SET name = ?, seats = ?, zone = ?, status = ? WHERE id = ? RETURNING *`,
    args: [nextName, nextSeats, nextZone, nextStatus, id],
  });

  return res.rows[0] ? rowToTable(res.rows[0]) : null;
}

export async function deleteRestaurantTable(id: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.execute({
    sql: "DELETE FROM restaurant_tables WHERE id = ?",
    args: [id],
  });
  return (res.rowsAffected ?? 0) > 0;
}

export async function getRestaurantTablesWithStats(): Promise<RestaurantTable[]> {
  const db = await getDb();
  const tables = await getRestaurantTables();

  // Get active orders count per table
  const ordersRes = await db.execute(
    "SELECT table_id, COUNT(*) as cnt FROM orders WHERE status != 'PAID' GROUP BY table_id"
  );
  const activeOrdersMap = new Map<string, number>();
  for (const row of ordersRes.rows) {
    activeOrdersMap.set(String(row.table_id), Number(row.cnt));
  }

  // Get cart item count per table
  const cartsRes = await db.execute("SELECT table_id, items FROM table_carts");
  const cartCountsMap = new Map<string, number>();
  for (const row of cartsRes.rows) {
    try {
      const items = parseJson<CartItem[]>(row.items, []);
      const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      cartCountsMap.set(String(row.table_id), count);
    } catch {
      // ignore
    }
  }

  return tables.map((t) => {
    const activeOrderCount = activeOrdersMap.get(t.id) || 0;
    const cartItemCount = cartCountsMap.get(t.id) || 0;
    return {
      ...t,
      activeOrderCount,
      cartItemCount,
      isOccupied: activeOrderCount > 0 || cartItemCount > 0,
    };
  });
}
