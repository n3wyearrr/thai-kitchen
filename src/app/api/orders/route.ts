import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrderFromCart } from "@/lib/store";
import { badTable, isMerchantSession, isValidTableId, unauthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

/** รายการออเดอร์ทั้งหมด สำหรับแม่ค้าเท่านั้น */
export async function GET() {
  if (!isMerchantSession()) return unauthorized();
  return NextResponse.json(await getOrders());
}

/** ลูกค้าส่งออเดอร์: เซิร์ฟเวอร์ใช้ตะกร้าของโต๊ะที่เก็บไว้ ไม่รับรายการหรือราคาจาก client */
export async function POST(request: NextRequest) {
  try {
    const { tableId } = (await request.json()) as { tableId?: string };
    if (!tableId || !isValidTableId(tableId)) return badTable();

    const order = await createOrderFromCart(tableId);
    if (!order) {
      return NextResponse.json({ error: "ตะกร้าว่าง ไม่มีรายการให้สั่ง" }, { status: 400 });
    }
    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
