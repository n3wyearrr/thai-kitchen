# Chanon — ระบบสั่งอาหารผ่าน QR ประจำโต๊ะ

ลูกค้าสแกน QR ที่โต๊ะ → เลือกเมนู (เลือกระดับเผ็ด/ท็อปปิ้งได้) → ใส่ตะกร้าร่วมกับเพื่อนในโต๊ะ → ส่งออเดอร์ไปที่ครัว
แม่ค้าเห็นออเดอร์แบบสด มีเสียงแจ้งเตือน คิดเงินและทอนเงินได้ในหน้าเดียว

## ฟีเจอร์

- **ตะกร้าร่วมประจำโต๊ะ** ซิงก์ข้อมูลระหว่างมือถือหลายเครื่องในโต๊ะเดียวกัน (อ่าน-แก้-เขียนใน transaction กันข้อมูลทับกัน)
- **ตัวเลือกต่อจาน** ระดับความเผ็ด + ท็อปปิ้งพร้อมราคา + หมายเหตุ (คำนวณราคาฝั่งเซิร์ฟเวอร์ ไม่เชื่อราคาจาก client)
- **ติดตามสถานะอาหารสด** รอคิว → กำลังปรุง → เสิร์ฟแล้ว พร้อมแจ้งเตือนเมื่อสถานะเปลี่ยน
- **ปุ่มเรียกพนักงาน / ขอน้ำ / เช็คบิล** ส่งตรงไปแดชบอร์ดแม่ค้า (กดซ้ำไม่สร้างคำขอซ้ำ)
- **แดชบอร์ดแม่ค้า** เสียงแจ้งเตือนออเดอร์ใหม่และคำขอจากโต๊ะ, ออเดอร์ที่รอเกิน 10 นาทีขึ้นสีแดง, คิดเงินและทอนเงิน
- **เก็บข้อมูลถาวร** SQLite (libSQL) ใช้ไฟล์ในเครื่องตอนพัฒนา และใช้ Turso ตอน deploy
- **ความปลอดภัย** API ฝั่งแม่ค้าต้องล็อกอิน (session cookie ลงลายเซ็น HMAC), ตรวจรูปแบบเลขโต๊ะและสถานะทุกครั้ง

## รันในเครื่อง

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — ตอนพัฒนาหน้าแรกมีปุ่มจำลองการสแกน QR แต่ละโต๊ะ
บัญชีแม่ค้าสำหรับทดสอบคือ `admin` / `1234` (ใช้ได้เฉพาะโหมดพัฒนา)
ฐานข้อมูลถูกสร้างเองที่ `data/chanon.db` พร้อมออเดอร์ตัวอย่าง ลบไฟล์นี้เพื่อเริ่มใหม่

## การเชื่อมต่อฐานข้อมูล PostgreSQL ด้วย Neon และ Deploy บน Vercel

โปรเจกต์รองรับฐานข้อมูล **PostgreSQL ผ่าน Neon Serverless (`@neondatabase/serverless`)** ซึ่งทำงานร่วมกับ Next.js App Router และ Vercel ได้อย่างรวดเร็วและไม่มีปัญหา Connection limit

### วิธีเชื่อมต่อ Neon ผ่าน Vercel (แนะนำ - ง่ายที่สุด)

1. Push โค้ดโปรเจกต์ขึ้น **GitHub** แล้วไปที่ [Vercel Dashboard](https://vercel.com)
2. Import โปรเจกต์ หรือเปิดโปรเจกต์ที่มีอยู่
3. ไปที่แท็บ **Storage** ใน Vercel Dashboard
4. กด **Connect Database** → เลือก **Neon** (หรือ **Vercel Postgres**)
5. Vercel จะทำการเชื่อมต่อและสร้าง Environment Variables (`DATABASE_URL`, `POSTGRES_URL`) ให้โดยอัตโนมัติ
6. เพิ่มตัวแปรสิ่งแวดล้อมฝั่งแม่ค้าใน **Settings → Environment Variables**:
   * `MERCHANT_USERNAME=admin`
   * `MERCHANT_PASSWORD=1234`
   * `SESSION_SECRET=thai-kitchen-secret-key-production-neon-pos`
7. ระบบจะรัน Migration สร้างตาราง (`menus`, `restaurant_tables`, `table_carts`, `orders`, `service_calls`) และ Seed ข้อมูลเมนูเริ่มต้นให้อัตโนมัติในครั้งแรกที่เปิดใช้งาน

### หากต้องการสร้างตรงผ่านเว็บ Neon (neon.tech)

1. สร้างบัญชีและโปรเจกต์ที่ [https://neon.tech](https://neon.tech)
2. คัดลอก Connection String (เช่น `postgresql://user:password@ep-...neon.tech/neondb?sslmode=require`)
3. นำไปใส่ใน `.env.local` สำหรับรันในเครื่อง หรือใส่ใน **Environment Variables** บน Vercel:
   ```bash
   DATABASE_URL=postgresql://user:password@ep-...neon.tech/neondb?sslmode=require
   ```
4. สามารถตรวจสอบโครงสร้างตารางได้จากไฟล์ [schema.sql](schema.sql)

## โครงสร้างสำคัญ

| ไฟล์ | หน้าที่ |
|---|---|
| `src/lib/db.ts` | เชื่อมฐานข้อมูล, สร้างตาราง, ข้อมูลตัวอย่างตอนพัฒนา |
| `src/lib/store.ts` | ฟังก์ชันตะกร้า/ออเดอร์/คำขอพนักงาน (ทั้งหมดเป็น async, ใช้ transaction ที่จำเป็น) |
| `src/lib/session.ts`, `src/lib/guard.ts` | session ลงลายเซ็น และตัวป้องกัน API ฝั่งแม่ค้า |
| `src/app/api/**` | API ของตะกร้า ออเดอร์ สถานะโต๊ะ และคำขอพนักงาน |
| `src/data/menus.ts` | เมนู (แก้เป็นเมนูร้านจริงที่นี่) |
