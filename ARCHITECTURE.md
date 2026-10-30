# ARCHITECTURE.md - System Architecture & Technical Specifications
## Thai Kitchen: Smart Dine-in & Merchant POS

เอกสารแสดงสถาปัตยกรรมระบบ, โครงสร้างโค้ด, Data Models, และกลไกการซิงก์ข้อมูลตะกร้าโต๊ะร่วมกัน (Shared Table Cart) สำหรับ **Next.js (App Router)**

---

## 1. แผนภาพรวมระบบ (High-Level Architecture)

```mermaid
flowchart TD
    subgraph CustomerSide["📱 ฝั่งลูกค้า (Customer Dine-in)"]
        UserA["ลูกค้าคนที 1 (สแกน QR โต๊ะ 3)"]
        UserB["ลูกค้าคนที 2 (สแกน QR โต๊ะ 3)"]
    end

    subgraph MerchantSide["💻 ฝั่งแม่ค้า (Merchant / POS)"]
        Merchant["หน้าจอแคชเชียร์ / ครัว (/merchant)"]
    end

    subgraph NextServer["⚡ Next.js App Router Server"]
        AppRoutes["App Pages:\n/table/[tableId]\n/merchant"]
        APICart["API Routes / Server Actions:\n/api/table/[tableId]/cart"]
        APIOrders["Order & Billing APIs:\n/api/orders"]
        
        subgraph DataLayer["💾 Shared State & Data Store"]
            MenuData["Menu Catalog (Static/DB)"]
            TableStore["Live Table Carts (In-Memory / Redis / DB)"]
            OrderStore["Active Orders & History"]
        end
    end

    UserA -->|1. ดึงเมนู & ซิงก์ตะกร้า| AppRoutes
    UserB -->|1. ดึงเมนู & ซิงก์ตะกร้า| AppRoutes
    UserA <-->|2. Real-time Cart Sync (โต๊ะเดียวกัน)| APICart
    UserB <-->|2. Real-time Cart Sync (โต๊ะเดียวกัน)| APICart
    APICart <--> TableStore

    UserA -->|3. ส่งออเดอร์โต๊ะ 3| APIOrders
    APIOrders --> OrderStore
    OrderStore -->|4. แจ้งเตือนออเดอร์เข้า & คำนวณเงิน| Merchant
```

---

## 2. Tech Stack & Library Specifications

- **Framework:** Next.js (App Router, Node.js 18+)
- **Language:** TypeScript (Strict Mode)
- **Styling & UI:** Tailwind CSS + **shadcn/ui**
- **Icons:** Lucide React
- **Client State & Sync:** SWR หรือ React Query สำหรับ Polling / Data Revalidation แบบเรียลไทม์ (หรือ Server-Sent Events สำหรับ Instant Push)
- **Storage Layer (Production & Serverless):**
  - **Database:** PostgreSQL บน **Neon Serverless** (`@neondatabase/serverless`) เชื่อมต่อผ่าน Vercel Integration / `DATABASE_URL`
  - **Auto-migration & Seeding:** ระบบสร้างตารางอัตโนมัติ (`menus`, `restaurant_tables`, `table_carts`, `orders`, `service_calls`) พร้อม seed เมนูตั้งต้น
  - **Local Fallback:** รองรับ SQLite ในเครื่องกรณีรัน offline หรือยังไม่ได้เชื่อมต่อ Neon Cloud

---

## 3. ผังโครงสร้างโปรเจกต์ (Target Project Directory Structure)

```text
thai-kitchen/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (Kanit font, Sonner Toast)
│   │   ├── page.tsx                  # Home / Table QR Landing (เลือกหรือสแกนโต๊ะ)
│   │   ├── table/
│   │   │   └── [tableId]/
│   │   │       ├── page.tsx          # หน้าเมนูสั่งอาหารของลูกค้าประจำโต๊ะ
│   │   │       └── orders/
│   │   │           └── page.tsx      # หน้าติดตามสถานะออเดอร์ของโต๊ะ
│   │   ├── merchant/
│   │   │   ├── page.tsx              # แดชบอร์ดแม่ค้า (สรุปออเดอร์ + คิดเงิน)
│   │   │   ├── tables/
│   │   │   │   └── page.tsx          # หน้าจัดการโต๊ะ & สร้าง QR Code ให้ลูกค้าสแกน
│   │   │   └── login/
│   │   │       └── page.tsx          # หน้าจอเข้าสู่ระบบ POS ด้วย PIN Keypad
│   │   ├── admin/
│   │   │   └── tables/page.tsx       # Alias route สำหรับจัดการโต๊ะ & QR Code
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── route.ts          # Session authentication (GET, POST, DELETE)
│   │   │   ├── tables/
│   │   │   │   ├── route.ts          # GET (รายการโต๊ะพร้อมสถิติสด), POST (เพิ่มโต๊ะ)
│   │   │   │   └── [id]/route.ts     # PATCH (แก้ไขโต๊ะ), DELETE (ลบโต๊ะ)
│   │   │   ├── table/
│   │   │   │   └── [tableId]/
│   │   │   │       └── cart/
│   │   │   │           └── route.ts  # GET, POST, DELETE จัดการตะกร้าร่วม
│   │   │   └── orders/
│   │   │       └── route.ts          # GET (ดูออเดอร์ทั้งหมด), POST (ส่งออเดอร์)
│   │   │       └── [orderId]/
│   │   │           └── route.ts      # PATCH (เปลี่ยนสถานะ / คิดเงินเสร็จ)
│   │   └── globals.css               # Theme tokens & Tailwind styles
│   ├── components/
│   │   ├── customer/
│   │   │   ├── CustomerHeader.tsx    # โลโก้, ป้ายเลขโต๊ะ, ปุ่มเปิดตะกร้า
│   │   │   ├── MenuCatalog.tsx       # แถบ Search, Filter Tabs, Menu Grid
│   │   │   ├── MenuCard.tsx          # การ์ดอาหารแต่ละจาน
│   │   │   ├── FoodDetailModal.tsx   # Modal Popup แสดงรายละเอียดอาหาร (Dialog)
│   │   │   └── SharedCartSheet.tsx   # ตะกร้าสินค้าโต๊ะร่วมกัน (Sheet Drawer)
│   │   ├── merchant/
│   │   │   ├── MerchantHeader.tsx    # แถบควบคุมและสรุปยอด
│   │   │   ├── TableOrderCard.tsx    # การ์ดรายการอาหารแยกตามโต๊ะ
│   │   │   ├── BillingModal.tsx      # Modal คิดเงินและคำนวณเงินทอน
│   │   │   └── OrderStatusBadge.tsx  # ป้ายสถานะ (รอทำ, กำลังปรุง, เสิร์ฟแล้ว)
│   │   └── ui/                       # shadcn/ui components (dialog, sheet, button ฯลฯ)
│   ├── data/
│   │   └── menus.ts                  # ข้อมูลเมนูอาหารตั้งต้น
│   ├── lib/
│   │   ├── store.ts                  # In-memory / State store สำหรับ Table Carts & Orders
│   │   └── utils.ts                  # ฟังก์ชัน formatPrice, calculateBill, cn
│   └── types/
│       ├── menu.ts                   # Type อาหาร
│       ├── cart.ts                   # Type ตะกร้าสินค้าประจำโต๊ะ
│       └── order.ts                  # Type ออเดอร์และการคิดเงิน
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── PRD.md
├── DESIGN.md
└── ARCHITECTURE.md
```

---

## 4. โครงสร้างข้อมูล (Data Models & TypeScript Interfaces)

### 4.1 Menu & Food Item (`src/types/menu.ts`)
```typescript
export type MenuCategory = 'อาหารจานเดียว' | 'ต้มและแกง' | 'ของว่าง' | 'เครื่องดื่ม';

export interface MenuItem {
  id: number;
  name: string;
  category: MenuCategory;
  price: number;
  desc: string;
  ingredients: string;
  image: string;
  isPopular?: boolean;
}
```

### 4.2 Shared Table Cart (`src/types/cart.ts`)
```typescript
export interface CartItem {
  menuId: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;      // หมายเหตุ เช่น "ไม่ใส่ผักชี", "เผ็ดน้อย"
  image?: string;
}

export interface TableCart {
  tableId: string;    // เช่น "1", "2", "3"
  items: CartItem[];
  updatedAt: string;  // ISO timestamp สำหรับตรวจสอบการเปลี่ยนแปลง
}
```

### 4.3 Order & Billing (`src/types/order.ts`)
```typescript
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
```

---

## 5. กลไกการทำงานของ Shared Table Cart (โต๊ะเดียวกัน ซิงก์ร่วมกัน)

### 5.1 Flow การซิงก์ข้อมูล
1. **การเข้าร่วมโต๊ะ (Join Table):** ลูกค้าสแกน QR Code เข้ามาที่ `/table/3` หน้าเว็บจะ Initialize การเชื่อมต่อกับ Session โต๊ะ 3
2. **การดึงข้อมูลตะกร้า (Cart Subscription):**
   - ฝั่ง Client เรียกใช้ SWR hook เช่น `useTableCart(tableId)` ที่ส่ง Request ไปยัง `/api/table/3/cart`
   - ตั้งค่า Polling สั้น ๆ (Revalidation ทุก 1-2 วินาที) หรือใช้ SSE เพื่อดึงข้อมูลอัปเดตล่าสุด
3. **การเพิ่ม/ลดของในตะกร้า (Mutation):**
   - เมื่อลูกค้าคนใดคนหนึ่งกด *"เพิ่มลงตะกร้า"* หรือแก้ไขจำนวน Client จะส่ง `POST /api/table/3/cart` พร้อมข้อมูล
   - Server บันทึกตะกร้าของโต๊ะ 3 และส่งผลลัพธ์ใหม่กลับมา
   - ทุกคนที่เปิดหน้า `/table/3` อยู่จะเห็นตัวเลข Badge และรายการใน Drawer อัปเดตพร้อมกัน

---

## 6. ฝั่งแม่ค้า: สรุปออเดอร์ & ระบบคำนวณเงิน (Billing Workflow)

1. **รับออเดอร์ (Incoming Orders):**
   - เมื่อลูกค้าโต๊ะ 3 กดส่งออเดอร์ ระบบจะย้ายรายการจาก `TableCart` ไปสร้างเป็น `Order` ใหม่ใน `OrderStore`
   - แดชบอร์ดแม่ค้า `/merchant` จะปรากฏการ์ดของ "โต๊ะ 3" ทันทีพร้อมเสียงเตือน (Beep/Toast)
2. **การเปลี่ยนสถานะการทำอาหาร:**
   - แม่ค้ากดเปลี่ยนสถานะ: รอคิว -> กำลังทำ -> เสิร์ฟแล้ว
3. **การคิดเงินและคำนวณเงินทอน (Checkout / Billing):**
   - กดปุ่ม *"คิดเงิน"* ที่การ์ดโต๊ะ
   - ระบบสรุปยอดรวม เช่น ยอด 323 บาท
   - แม่ค้าพิมพ์ตัวเลขเงินสดที่ได้รับ เช่น รับมา 500 บาท
   - ระบบคำนวณเงินทอนอัตโนมัติทันที: `500 - 323 = 177 บาท`
   - กดปุ่ม *"ยืนยันชำระเงิน"* ระบบจะอัปเดตสถานะเป็น `PAID` และเคลียร์โต๊ะให้ว่าง

---

## 7. แผนการนำไปปฏิบัติ (Implementation Steps)

1. **Step 1 - Scaffolding:** สร้าง Next.js App Router พร้อม Tailwind CSS, shadcn/ui และฟอนต์ Kanit
2. **Step 2 - Data & Store:** จัดเตรียม Mock Data เมนู และ In-memory Store สำหรับตะกร้าโต๊ะและออเดอร์
3. **Step 3 - Customer Experience:** สร้างหน้า `/table/[tableId]`, Search, Filter, Modal Popup และ Shared Cart Sheet
4. **Step 4 - Merchant Dashboard:** สร้างหน้า `/merchant`, การ์ดออเดอร์แต่ละโต๊ะ และโมดอลคำนวณเงินทอน
5. **Step 5 - Sync & Verification:** ทดสอบเปิด 2 หน้าต่างในโต๊ะเดียวกันเพื่อตรวจสอบการซิงก์ตะกร้า และทดสอบส่งออเดอร์ไปให้แม่ค้า
