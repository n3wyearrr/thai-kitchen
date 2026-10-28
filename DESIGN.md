# DESIGN.md - Design System & UI/UX Specifications
## Thai Kitchen: Smart Dine-in & Merchant POS

เอกสารข้อกำหนดระบบการออกแบบ (Design System), UI Components, โทนสี และ Flow การใช้งานทั้งฝั่งลูกค้า (Customer) และฝั่งแม่ค้า (Merchant)

---

## 1. ปรัชญาการออกแบบ (Design Philosophy)

1. **Warm & Welcoming Thai Atmosphere:** ถ่ายทอดความอบอุ่น รสชาติไทยแท้ ผ่านโทนสีส้มอิฐเครื่องเทศ ดินเผา และครีมอบอุ่น
2. **Frictionless Mobile-First (Customer):** ลูกค้าสแกน QR Code แล้วต้องสั่งอาหารได้ทันที ไม่ต้องติดตั้งแอป ไม่ต้องล็อกอิน ปุ่มกดมีขนาดใหญ่เหมาะกับนิ้วมือ (Touch Target ≥ 44px)
3. **High-Clarity & Fast Action (Merchant):** ฝั่งแม่ค้าเน้นความชัดเจน รายการอาหารอ่านง่าย ตัวเลขอ่านชัดเจน คำนวณเงินถูกต้องในชั่วพริบตา

---

## 2. Design Tokens & Palette

ระบบสีถูกกำหนดให้ทำงานร่วมกับ Tailwind CSS และ CSS Variables ใน `globals.css`:

```css
:root {
  /* Brand Identity Colors */
  --primary: 20 68% 46%;          /* #c65324 ส้มอิฐ */
  --primary-hover: 18 75% 38%;    /* #a83f18 ส้มอิฐเข้ม */
  --primary-foreground: 0 0% 100%;

  /* Backgrounds & Surfaces */
  --background: 35 100% 98%;      /* #fffaf3 ครีมอบอุ่น */
  --foreground: 22 24% 15%;       /* #30251e น้ำตาลเข้มหลัก */
  --card: 0 0% 100%;              /* #ffffff ขาวการ์ด */
  --card-foreground: 22 24% 15%;

  /* Muted & Secondary */
  --muted: 26 14% 44%;            /* #806f61 น้ำตาลหม่นสำหรับคำอธิบาย */
  --muted-foreground: 26 14% 44%;
  --soft-orange: 26 100% 95%;     /* #fff0e3 ส้มพาสเทลสำหรับ Badge */

  /* Borders & Dividers */
  --border: 31 35% 87%;           /* #eaded1 ขอบอบอุ่น */
  --input: 31 35% 87%;

  /* Accent & Success (Thai Forest/Herbal Green) */
  --accent-green: 159 39% 22%;    /* #214d3d เขียวสมุนไพรสำหรับ Footer/Success */
}
```

### Typography (ระบบตัวพิมพ์)
- **ฟอนต์หลัก:** `"Kanit", sans-serif` ผ่าน `next/font/google`
- **น้ำหนักที่ใช้:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)
- **Hierarchy:**
  - H1 / Hero: `text-3xl md:text-5xl font-bold tracking-tight text-[#30251e]`
  - H2 / Section: `text-2xl md:text-3xl font-semibold text-[#30251e]`
  - H3 / Card Title: `text-lg font-medium text-[#30251e]`
  - Body Text: `text-sm md:text-base text-[#806f61] leading-relaxed`
  - Price Tag: `text-xl md:text-2xl font-bold text-[#c65324]`

---

## 3. การใช้งาน shadcn/ui Components

โปรเจกต์ติดตั้งและปรับแต่ง Component จาก **shadcn/ui** ดังนี้:

| shadcn/ui Component | ตำแหน่งการใช้งาน |
|---|---|
| `Dialog` / `DialogContent` | **Food Detail Modal Popup:** หน้าต่างแสดงรายละเอียดอาหาร, ส่วนผสม และปุ่มเพิ่มลงตะกร้า |
| `Sheet` / `SheetContent` | **Shared Table Cart Drawer:** แถบตะกร้าสินค้าสไลด์ขึ้นมาจากด้านล่าง (Mobile) หรือด้านข้าง (Desktop) |
| `Button` | ปุ่มการทำงานทั้งหมด เช่น เพิ่มลงตะกร้า, ส่งออเดอร์, ชำระเงิน, เปลี่ยนสถานะ |
| `Badge` | ป้ายประเภทอาหาร (จานเดียว/ต้มแกง), ป้ายเลขโต๊ะ, ป้ายสถานะออเดอร์ |
| `Input` | ช่องค้นหาอาหารแบบ Real-time, ช่องกรอกรับเงินสดเพื่อทอนเงิน |
| `Card` / `CardContent` | การ์ดเมนูอาหารแต่ละจาน และการ์ดแสดงบิลโต๊ะของแม่ค้า |
| `Tabs` / `TabsList` | แถบหมวดหมู่อาหารด่วน (ทั้งหมด / จานเดียว / ต้มแกง / เครื่องดื่ม) |
| `Toast` (`sonner`) | แจ้งเตือนเมื่อเพื่อนร่วมโต๊ะเพิ่มของลงตะกร้า หรือเมื่อส่งออเดอร์สำเร็จ |

---

## 4. UI/UX Specifications: ฝั่งลูกค้า (Customer Side)

### 4.1 Header & Table Badge
- แสดงโลโก้ `🍲 ThaiKitchen`
- **Table Indicator Badge:** แสดงเลขโต๊ะเด่นชัด เช่น `📍 โต๊ะ 3` หากยังไม่มีเลขโต๊ะจะเปิดโมดอลให้เลือกระบุเลขโต๊ะ
- แสดงปุ่มตะกร้าอาหารพร้อมตัวเลข Badge (Live Item Count)

### 4.2 Hero Section & Category Tabs
- แบนเนอร์สั้นกระชับ สโลแกน "อร่อยแบบไทย ใส่ใจทุกจาน"
- **Category Filter Tabs:** แถบเลื่อนแบบแนวนอน (Horizontal Scroll) บนมือถือ สำหรับกดกรองประเภทอาหารได้อย่างรวดเร็ว

### 4.3 Search Box & Empty State
- ช่องค้นหาขนาดใหญ่ ค้นหาทันทีขณะพิมพ์ (`Real-time Filter`)
- เมื่อไม่มีผลลัพธ์: แสดงไอคอนกระทะ/ชามอาหาร พร้อมข้อความ *"ไม่พบเมนูอาหารที่คุณค้นหา"* และปุ่มกด *"ล้างการค้นหา"*

### 4.4 Menu Grid & Menu Card
- จัดวางแบบ Responsive:
  - Mobile: 1 หรือ 2 คอลัมน์ (ขนาดกระชับ รูปอาหารชัดเจน)
  - Tablet/Desktop: 3 - 4 คอลัมน์
- การ์ดอาหารประกอบด้วย:
  - รูปภาพสัดส่วน 16:10 พร้อมเอฟเฟกต์ซูมเบา ๆ เมื่อโฮเวอร์
  - Badge หมวดหมู่
  - ชื่ออาหาร และคำอธิบายย่อ (จำกัด 2 บรรทัดพร้อม `line-clamp-2`)
  - ราคา และปุ่มบวกด่วน (`+`) หรือกดที่การ์ดเพื่อเปิด Modal

### 4.5 Food Detail Modal (`Dialog`)
- เด้งขึ้นมากลางจอแบบนุ่มนวล (`DialogContent`)
- รูปภาพขนาดใหญ่ความละเอียดสูง
- แสดงชื่อเมนู, ราคา, คำอธิบายอย่างละเอียด, และรายการวัตถุดิบ/ส่วนประกอบ (`ingredients`)
- ปุ่มตัวปรับจำนวน `[-] 1 [+]` พร้อมปุ่ม *"เพิ่มลงตะกร้าโต๊ะนี้"*

### 4.6 Shared Table Cart Drawer (`Sheet`)
- แถบปุ่มลอยด้านล่าง (Floating Cart Button) แสดงจำนวนชิ้นและยอดรวม
- เมื่อกด จะเปิด Bottom Sheet ขึ้นมา แสดงรายการที่คนในโต๊ะสั่งร่วมกัน
- แต่ละรายการสามารถปรับจำนวน `+` / `-` หรือลบออกได้
- แสดงข้อความเตือน: *"ตะกร้านี้แชร์ร่วมกับทุกคนที่โต๊ะ X"*
- ปุ่มกด *"ยืนยันการสั่งอาหาร (Place Order)"*

---

## 5. UI/UX Specifications: ฝั่งแม่ค้า (Merchant Side)

### 5.1 Route & Authentication (หน้าจอเข้าสู่ระบบแม่ค้า)
- เข้าถึงผ่าน `/merchant/login`
- **Form Layout:** ฟอร์มเข้าสู่ระบบของแม่ค้าแบบเรียบง่าย ใส่ชื่อผู้ใช้และรหัสผ่าน พร้อมปุ่มดูรหัสผ่าน
- **Default Account:** กรอกค่าเริ่มต้นบัญชีแม่ค้าไว้ให้พร้อมกดเข้าใช้งานได้ทันที (`admin` / `1234`)

### 5.2 Dashboard Header & Profile
- เข้าถึงผ่าน `/merchant`
- Header แสดงชื่อร้าน, เวลาปัจจุบัน, ปุ่มรีเฟรช และตัวนับออเดอร์ที่ยังไม่ปิดบิล

### 5.2 Table Order Cards (แดชบอร์ดรายการสั่งซื้อ)
- แสดงในรูปแบบ Grid หรือ Kanban แยกตามโต๊ะที่มีออเดอร์ (เช่น โต๊ะ 1, โต๊ะ 2, โต๊ะ 5)
- แต่ละการ์ดโต๊ะจะแสดง:
  - หมายเลขโต๊ะ และเวลาที่สั่ง
  - ป้ายสถานะ (Badge): `รอทำ`, `กำลังปรุง`, `เสิร์ฟครบ`, `รอชำระเงิน`
  - รายการอาหาร จำนวนจาน และราคาต่อหน่วย

### 5.3 Billing & Cash Calculator Modal
- ปุ่ม *"เช็คบิล / คำนวณเงิน"* บนการ์ดโต๊ะ
- แสดงหน้าต่างสรุปบิล:
  - รายการอาหารทั้งหมดรวมยอดเงิน (Subtotal)
  - ช่องกรอกยอดเงินสดที่รับจากลูกค้า (Cash Received)
  - คำนวณเงินทอน (Change) อัตโนมัติทันที
- ปุ่ม *"ยืนยันการชำระเงิน & เคลียร์โต๊ะ"* เพื่อรีเซ็ตสถานะโต๊ะให้ว่างพร้อมรับลูกค้ารอบใหม่

---

## 6. Accessibility & Responsiveness Guidelines

1. **Touch Ergonomics:** ปุ่มกดหลักในหน้าลูกค้าจะอยู่ครึ่งล่างของหน้าจอเพื่อให้กดง่ายด้วยนิ้วโป้ง
2. **Contrast & Readability:** ข้อความทุกชิ้นใช้ Contrast Ratio ไม่ต่ำกว่า 4.5:1 ตามเกณฑ์ WCAG AA
3. **Motion & Feedback:** มีแอนิเมชันเปิด/ปิด Modal และ Drawer ราบรื่น (ประมาณ 200-300ms) พร้อมรองรับ `prefers-reduced-motion`
