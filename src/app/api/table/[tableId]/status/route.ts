import { NextResponse } from "next/server";
import { getTableActiveOrders, getOpenServiceCalls } from "@/lib/store";
import { badTable, isValidTableId } from "@/lib/guard";

export const dynamic = "force-dynamic";

/** สถานะของโต๊ะ: ออเดอร์ที่ยังไม่จ่ายเงิน + คำขอพนักงานที่ยังเปิดอยู่ (ลูกค้า poll หน้านี้) */
export async function GET(
  _request: Request,
  { params }: { params: { tableId: string } }
) {
  if (!isValidTableId(params.tableId)) return badTable();
  const [orders, calls] = await Promise.all([
    getTableActiveOrders(params.tableId),
    getOpenServiceCalls(params.tableId),
  ]);
  return NextResponse.json({ orders, calls });
}
