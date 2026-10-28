import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return `฿${price.toLocaleString("th-TH")}`;
}

export function calculateBill(subtotal: number, cashReceived: number = 0, discount: number = 0) {
  const grandTotal = Math.max(0, subtotal - discount);
  const change = Math.max(0, cashReceived - grandTotal);
  return {
    subtotal,
    discount,
    grandTotal,
    cashReceived,
    change,
  };
}
