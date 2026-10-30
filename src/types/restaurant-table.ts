export type TableStatus = "ACTIVE" | "INACTIVE";

export interface RestaurantTable {
  id: string; // เช่น "1", "2", "3", "VIP-1"
  name: string; // เช่น "โต๊ะ 1", "โต๊ะริมหน้าต่าง", "โต๊ะ VIP 1"
  seats: number; // จำนวนที่นั่ง เช่น 2, 4, 6, 8
  zone: string; // เช่น "โซนห้องแอร์", "โซนหน้าร้าน", "โซน VIP"
  status: TableStatus; // สถานะการใช้งาน: ACTIVE หรือ INACTIVE
  createdAt: string; // ISO string
  activeOrderCount?: number; // จำนวนออเดอร์ที่ยังไม่ปิดบิล
  cartItemCount?: number; // จำนวนรายการที่อยู่ในตะกร้าตอนนี้
  isOccupied?: boolean; // มีลูกค้านั่งอยู่หรือไม่
}
