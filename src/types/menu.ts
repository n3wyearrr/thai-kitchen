export type MenuCategory =
  | 'ทั้งหมด'
  | 'เมนูทอดและของทานเล่น'
  | 'อาหารจานเดียวและกับข้าว'
  | 'ข้าวและเครื่องเคียง'
  | 'น้ำจิ้มและเครื่องเคียง';

export interface MenuExtra {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: number;
  name: string;
  category: Exclude<MenuCategory, 'ทั้งหมด'>;
  price: number;
  desc: string;
  ingredients: string;
  image: string;
  isPopular?: boolean;
  /** เมนูที่เลือกระดับความเผ็ดได้ */
  spiceable?: boolean;
  /** ตัวเลือกเพิ่มเติม (ท็อปปิ้ง/พิเศษ) พร้อมราคา */
  extras?: MenuExtra[];
  /** สถานะความพร้อมจำหน่าย: true = พร้อมขาย, false = ของหมด */
  isAvailable?: boolean;
}
