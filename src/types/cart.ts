export interface CartItem {
  menuId: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  image?: string;
}

export interface TableCart {
  tableId: string;
  items: CartItem[];
  updatedAt: string;
}
