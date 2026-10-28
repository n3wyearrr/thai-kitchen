export type MenuCategory = 'ทั้งหมด' | 'อาหารจานเดียว' | 'ต้มและแกง' | 'ของว่าง' | 'เครื่องดื่ม';

export interface MenuItem {
  id: number;
  name: string;
  category: Exclude<MenuCategory, 'ทั้งหมด'>;
  price: number;
  desc: string;
  ingredients: string;
  image: string;
  isPopular?: boolean;
}
