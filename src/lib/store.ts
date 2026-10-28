import { CartItem, TableCart } from "@/types/cart";
import { Order, OrderStatus } from "@/types/order";

// Global cache / In-memory store for Next.js runtime
interface ThaiKitchenStore {
  tableCarts: Map<string, TableCart>;
  orders: Order[];
}

declare global {
  // eslint-disable-next-line no-var
  var __thaiKitchenStore: ThaiKitchenStore | undefined;
}

if (!global.__thaiKitchenStore) {
  global.__thaiKitchenStore = {
    tableCarts: new Map<string, TableCart>(),
    orders: [
      {
        id: "ORD-101",
        tableId: "1",
        status: "COOKING",
        subtotal: 248,
        total: 248,
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        items: [
          {
            menuId: 1,
            name: "ผัดไทยกุ้งสด",
            price: 89,
            quantity: 2,
            note: "เผ็ดน้อย",
          },
          {
            menuId: 5,
            name: "ปอเปี๊ยะทอดโบราณ",
            price: 69,
            quantity: 1,
          },
        ],
      },
      {
        id: "ORD-102",
        tableId: "2",
        status: "PENDING",
        subtotal: 204,
        total: 204,
        createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        items: [
          {
            menuId: 3,
            name: "ต้มยำกุ้งน้ำข้น",
            price: 159,
            quantity: 1,
          },
          {
            menuId: 6,
            name: "ชาไทยเย็นต้นตำรับ",
            price: 45,
            quantity: 1,
            note: "หวานน้อย",
          },
        ],
      },
    ],
  };
}

const store = global.__thaiKitchenStore;

// Cart Store Helpers
export function getTableCart(tableId: string): TableCart {
  const existing = store.tableCarts.get(tableId);
  if (existing) return existing;

  const initial: TableCart = {
    tableId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
  store.tableCarts.set(tableId, initial);
  return initial;
}

export function saveTableCart(tableId: string, items: CartItem[]): TableCart {
  const cart: TableCart = {
    tableId,
    items,
    updatedAt: new Date().toISOString(),
  };
  store.tableCarts.set(tableId, cart);
  return cart;
}

export function clearTableCart(tableId: string): TableCart {
  const cart: TableCart = {
    tableId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
  store.tableCarts.set(tableId, cart);
  return cart;
}

// Order Store Helpers
export function getOrders(): Order[] {
  return [...store.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createOrder(tableId: string, items: CartItem[]): Order {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const newOrder: Order = {
    id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
    tableId,
    items,
    status: "PENDING",
    subtotal,
    total: subtotal,
    createdAt: new Date().toISOString(),
  };
  store.orders.unshift(newOrder);
  // Clear cart for this table after order is placed
  clearTableCart(tableId);
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) return null;
  order.status = status;
  if (status === "PAID") {
    order.paidAt = new Date().toISOString();
  }
  return order;
}
