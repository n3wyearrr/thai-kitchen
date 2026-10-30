export type SpiceLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface CartItem {
  menuId: number;
  name: string;
  /** ราคาต่อหน่วย รวมราคาตัวเลือกเพิ่มเติมแล้ว */
  price: number;
  quantity: number;
  note?: string;
  image?: string;
  spice?: SpiceLevel;
  /** ชื่อตัวเลือกเพิ่มเติมที่เลือก เช่น "ไข่ดาว" */
  extras?: string[];
}

export interface TableCart {
  tableId: string;
  items: CartItem[];
  updatedAt: string;
}
