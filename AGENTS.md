# AGENTS.md - Thai Kitchen (Next.js Migration & Development Guide)

เอกสารแนะนำและคู่มือการทำงานสำหรับ AI Agent ในการพัฒนาและย้ายโปรเจกต์ **Thai Kitchen (ร้านอาหารไทย)** สู่โมเดิร์นเว็บแอปพลิเคชันด้วย **Next.js (App Router)**

---

## ⚠️ กฎสำคัญที่สุด: เอกสารอ้างอิงบังคับอ่าน (Mandatory Reference Files)

> [!IMPORTANT]
> **ทุกครั้งที่มีการสั่งงาน พัฒนาฟีเจอร์ ปรับแต่ง UI หรือแก้ไขสถาปัตยกรรมระบบ Agent จะต้องอ่านและยึดถือข้อมูลจากไฟล์หลัก 3 ฉบับนี้เป็นเกณฑ์เสมอ:**
> 1. **[PRD.md](file:///e:/Restaurant/thai-kitchen/PRD.md)** : รายละเอียดความต้องการ ฟังก์ชันทั้งฝั่งลูกค้า (Customer) และฝั่งแม่ค้า (Merchant), User Stories, และขอบเขตงาน
> 2. **[DESIGN.md](file:///e:/Restaurant/thai-kitchen/DESIGN.md)** : ข้อกำหนด Design System, โทนสี (Color Tokens), ฟอนต์ (Kanit), การใช้ **shadcn/ui**, และ UI/UX Flow
> 3. **[ARCHITECTURE.md](file:///e:/Restaurant/thai-kitchen/ARCHITECTURE.md)** : สถาปัตยกรรมระบบ Next.js (App Router), Data Models (TypeScript), โครงสร้างโฟลเดอร์, และกลไกซิงก์ตะกร้าโต๊ะเดียวกัน (Shared Table Cart)

---

## 1. ภาพรวมโปรเจกต์ (Project Overview)

- **ชื่อโปรเจกต์:** Thai Kitchen (🍲 ThaiKitchen - Smart Dine-in & POS)
- **เป้าหมาย:** พัฒนาระบบสั่งอาหารไทยสำหรับนั่งทานในร้าน (Dine-in) แบบ 2 ฝั่ง:
  1. **ฝั่งลูกค้า (Customer):** สแกน QR Code ประจำโต๊ะ, ตะกร้าแชร์ร่วมกันในโต๊ะเดียวกัน (Shared Table Cart), ค้นหาเมนูอาหารแบบ Real-time, และดูรายละเอียดอาหารผ่าน Modal Popup
  2. **ฝั่งแม่ค้า (Merchant):** แดชบอร์ดสรุปรายการสั่งซื้อแยกตามโต๊ะ, สถานะการทำอาหาร, และระบบคิดเงิน/คำนวณเงินทอน (Billing & Change Calculator)
- **ภาษาหลัก:** ภาษาไทย (TH) สำหรับเนื้อหาและส่วนต่อประสานผู้ใช้ (UI)

---

## 2. Tech Stack ที่กำหนด

- **Framework:** Next.js (App Router, เวอร์ชัน 14 หรือ 15)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + **shadcn/ui**
- **Font:** Google Font "Kanit" (`next/font/google`)
- **Icons:** Lucide React
- **Data & Real-time State:** SWR / React Query หรือ Server Actions สำหรับ Real-time Cart Revalidation
- **Image Optimization:** `next/image` สำหรับรูปภาพอาหาร

---

## 3. โครงสร้างโฟลเดอร์หลัก (Directory Structure)

*(ดูรายละเอียดเชิงลึกและ Interface เพิ่มเติมได้ใน [ARCHITECTURE.md](file:///e:/Restaurant/thai-kitchen/ARCHITECTURE.md))*

```text
thai-kitchen/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (Kanit, Toaster)
│   │   ├── page.tsx                  # Landing / Table QR Entry
│   │   ├── table/
│   │   │   └── [tableId]/page.tsx    # Customer Dine-in View (Shared Cart, Modal)
│   │   ├── merchant/page.tsx         # Merchant Dashboard (Active Orders, Billing)
│   │   ├── api/                      # Next.js API Routes (Cart Sync & Orders)
│   │   └── globals.css               # Tailwind & Theme Tokens
│   ├── components/
│   │   ├── customer/                 # Components สำหรับฝั่งลูกค้า (Catalog, Modal, Sheet Cart)
│   │   ├── merchant/                 # Components สำหรับฝั่งแม่ค้า (OrderCard, BillingModal)
│   │   └── ui/                       # shadcn/ui primitives (dialog, sheet, button ฯลฯ)
│   ├── data/
│   │   └── menus.ts                  # Mock Data เมนูอาหาร
│   ├── types/                        # TypeScript Interfaces (menu, cart, order)
│   └── lib/                          # Helper functions (utils, store)
├── PRD.md
├── DESIGN.md
├── ARCHITECTURE.md
└── AGENTS.md
```

---

## 4. Design System & Theme Tokens ย่อ

*(ดูรายละเอียดสเปกและ Component Mapping เพิ่มเติมได้ใน [DESIGN.md](file:///e:/Restaurant/thai-kitchen/DESIGN.md))*

| Token / Color | Hex Code | การใช้งาน |
|---|---|---|
| Primary | `#c65324` | สีหลักปุ่มกด, ราคา, ไฮไลต์ตัวอักษร |
| Primary Hover | `#a83f18` | Hover state ของปุ่ม |
| Background | `#fffaf3` | สีพื้นหลังหลัก (Warm Thai Tone) |
| Surface / Card | `#ffffff` | การ์ดเมนู, การ์ดรายละเอียด |
| Text Primary | `#30251e` | สีข้อความหลัก หัวข้อ |
| Muted Text | `#806f61` | คำอธิบาย, text รอง |
| Soft Orange | `#fff0e3` | แบ็กกราวด์ Badge ประเภทอาหาร |
| Accent Green | `#214d3d` | ป้ายความสำเร็จ, Footer |

---

## 5. กฎและแนวปฏิบัติการทำงานสำหรับ AI Agents (Agent Guidelines)

1. **อ่าน 3 ไฟล์ก่อนเริ่มงานเสมอ:** หากงานเกี่ยวข้องกับ Requirements, UI หรือ Architecture ให้เรียกอ่าน [PRD.md](file:///e:/Restaurant/thai-kitchen/PRD.md), [DESIGN.md](file:///e:/Restaurant/thai-kitchen/DESIGN.md), และ [ARCHITECTURE.md](file:///e:/Restaurant/thai-kitchen/ARCHITECTURE.md) ก่อนลงมือเขียนโค้ด
2. **รักษาความสอดคล้องของระบบ Shared Cart:** โค้ดที่เกี่ยวข้องกับตะกร้าสินค้าต้องอิงตามหมายเลขโต๊ะ (`tableId`) เสมอ เพื่อให้การแชร์ตะกร้าระหว่างลูกค้าโต๊ะเดียวกันทำงานได้อย่างถูกต้อง
3. **ใช้ shadcn/ui เป็นมาตรฐาน:** เลือกใช้ Component ตามที่ระบุใน `DESIGN.md` เช่น ใช้ `Dialog` สำหรับ Food Detail Popup และ `Sheet` สำหรับ Cart Drawer
4. **Code Quality & Typing:**
   - ใช้ TypeScript Strict Mode ห้ามใช้ `any`
   - ใช้ `next/image` สำหรับแสดงรูปภาพทุกจุด
   - เขียน Component ให้กระชับและแยกหน้าที่ชัดเจน
5. **Testing & Verification:** ทุกครั้งที่เพิ่มหรือแก้ไขโค้ด ให้ทดสอบ build ด้วย `npm run build` หรือ `next build` เสมอ เพื่อให้แน่ใจว่าไม่มีข้อผิดพลาดด้าน Type หรือ Routing
