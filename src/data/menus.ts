import { MenuItem } from "@/types/menu";

export const menus: MenuItem[] = [
  // --- เมนูทอดและของทานเล่น ---
  {
    id: 1,
    name: "ไก่ทอดสูตรเด็ด",
    category: "เมนูทอดและของทานเล่น",
    price: 65,
    desc: "ไก่ทอดสีเหลืองทอง หนังกรอบกรุบเนื้อในนุ่มฉ่ำ หมักเครื่องเทศเข้าเนื้อ เสิร์ฟร้อนๆ จากกระทะ",
    ingredients: "สะโพก/น่องไก่สด แป้งทอดกรอบสูตรเฉพาะ กระเทียม พริกไทย รากผักชี",
    image: "/images/menus/fried_chicken.png",
    isPopular: true,
    extras: [
      { id: "extra_portion", label: "เพิ่มชิ้น (+1 ชิ้น)", price: 30 },
      { id: "garlic", label: "โรยกระเทียมเจียวกรอบ", price: 10 },
    ],
  },
  {
    id: 2,
    name: "หมูทอดกระเทียมพริกไทย",
    category: "เมนูทอดและของทานเล่น",
    price: 70,
    desc: "หมูสามชั้นหมักนุ่มทอดพอดีคำ หอมกระเทียมพริกไทย รสชาติกลมกล่อมเค็มหวานลงตัว",
    ingredients: "เนื้อหมูคัดพิเศษ กระเทียมไทย พริกไทยเม็ด ซอสปรุงรส น้ำมันงา",
    image: "/images/menus/pork.jpg",
    isPopular: true,
    extras: [
      { id: "extra_meat", label: "พิเศษเนื้อหมู", price: 25 },
    ],
  },
  {
    id: 3,
    name: "เฟรนช์ฟรายส์ทอดกรอบ",
    category: "เมนูทอดและของทานเล่น",
    price: 49,
    desc: "มันฝรั่งทอดแท่งหนากรอบนอกนุ่มใน คลุกเกลือทะเลเบาๆ ทานเพลินคู่ซอส",
    ingredients: "มันฝรั่งแท้ เกลือ ผงปรุงรสปาปริก้า",
    image: "/images/menus/french_fries.jpg",
    extras: [
      { id: "cheese", label: "ราดชีสดิป", price: 15 },
    ],
  },
  {
    id: 4,
    name: "นักเก็ตไก่ทอด",
    category: "เมนูทอดและของทานเล่น",
    price: 55,
    desc: "นักเก็ตเนื้อไก่แน่นเน้นๆ ชุบเกล็ดขนมปังทอดสีทองกรอบ (6 ชิ้น) เสิร์ฟคู่ซอสมะเขือเทศ",
    ingredients: "เนื้ออกไก่บด เกล็ดขนมปัง เครื่องเทศ",
    image: "/images/menus/nuggets.jpg",
    extras: [
      { id: "bbq_sauce", label: "ซอสบาร์บีคิว", price: 10 },
    ],
  },

  // --- อาหารจานเดียวและกับข้าว ---
  {
    id: 5,
    name: "ผัดกะเพราโบราณ",
    category: "อาหารจานเดียวและกับข้าว",
    price: 65,
    desc: "กะเพราแท้ผัดแห้งหอมกลิ่นกระทะ ไม่ใส่ผักอื่นกวนใจ รสจัดจ้านถึงใจ",
    ingredients: "เนื้อสัตว์ (หมูสับ/ไก่) ใบกะเพราบ้าน พริกขี้หนูสวน กระเทียมไทย พริกแห้ง",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    isPopular: true,
    spiceable: true,
    extras: [
      { id: "fried_egg", label: "ไข่ดาวกรอบ", price: 10 },
      { id: "salted_egg", label: "ไข่เค็ม", price: 15 },
      { id: "extra_rice", label: "เพิ่มข้าวสวย", price: 10 },
    ],
  },
  {
    id: 6,
    name: "แกงส้มปลากะพงยอดมะพร้าว",
    category: "อาหารจานเดียวและกับข้าว",
    price: 120,
    desc: "แกงส้มใต้รสจัดจ้าน เข้มข้นถึงเครื่องแกง เนื้อปลากะพงสดหวานชิ้นโต พร้อมยอดมะพร้าวอ่อนกรุบกรอบ",
    ingredients: "เนื้อปลากะพงสด ยอดมะพร้าวอ่อน พริกแกงส้มใต้ น้ำมะนาวแท้/ส้มแขก น้ำปลาดี",
    image: "/images/menus/kaeng_som.jpg",
    isPopular: true,
    spiceable: true,
    extras: [
      { id: "extra_fish", label: "เพิ่มเนื้อปลา (+1 ชิ้น)", price: 35 },
      { id: "extra_veg", label: "พี่ยอดมะพร้าวพิเศษ", price: 15 },
    ],
  },

  // --- ข้าวและเครื่องเคียง ---
  {
    id: 7,
    name: "ข้าวสวยหอมมะลิ",
    category: "ข้าวและเครื่องเคียง",
    price: 15,
    desc: "ข้าวหอมมะลิแท้หุงสุกร้อนๆ นุ่มหอมขึ้นหม้อ",
    ingredients: "ข้าวหอมมะลิ 100%",
    image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 8,
    name: "ข้าวเหนียวนึ่งใบเตย",
    category: "ข้าวและเครื่องเคียง",
    price: 15,
    desc: "ข้าวเหนียวเขี้ยวงู เม็ดนุ่มเรียงสวย หอมกลิ่นใบเตยธรรมชาติ เสิร์ฟในกระติ๊บร้อนๆ",
    ingredients: "ข้าวเหนียวเขี้ยวงู ใบเตยหอม",
    image: "/images/menus/sticky_rice.jpg",
    isPopular: true,
  },

  // --- น้ำจิ้มและเครื่องเคียงรสแซ่บ ---
  {
    id: 9,
    name: "น้ำจิ้มแจ่วสูตรเด็ดมะขามเปียก",
    category: "น้ำจิ้มและเครื่องเคียง",
    price: 15,
    desc: "น้ำจิ้มแจ่วรสเด็ด ข้าวคั่วตำเองหอมกรุ่น ปรุงด้วยพริกป่นและน้ำมะขามเปียกเข้มข้น เข้ากับไก่ทอดและหมูทอดที่สุด",
    ingredients: "พริกป่น ข้าวคั่ว น้ำมะขามเปียก น้ำปลาแท้ ผักชีฝรั่ง หอมแดง",
    image: "/images/menus/jaew_sauce.jpg",
    spiceable: true,
  },
];

export function findMenu(id: number): MenuItem | undefined {
  return menus.find((m) => m.id === id);
}
