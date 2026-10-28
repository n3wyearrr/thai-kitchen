import { CartItem } from "./cart";

export type OrderStatus = 'PENDING' | 'COOKING' | 'SERVED' | 'PAID';

export interface Order {
  id: string;             // รหัสออเดอร์ เช่น "ORD-101"
  tableId: string;        // หมายเลขโต๊ะ
  items: CartItem[];
  status: OrderStatus;
  subtotal: number;
  total: number;
  createdAt: string;
  paidAt?: string;
}

export interface BillCalculation {
  subtotal: number;
  discount: number;
  grandTotal: number;
  cashReceived: number;
  change: number;
}
