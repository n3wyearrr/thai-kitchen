import { NextResponse } from "next/server";
import { getOpenServiceCalls } from "@/lib/store";
import { isMerchantSession, unauthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

/** คำขอจากโต๊ะที่ยังไม่ได้จัดการ สำหรับแม่ค้า */
export async function GET() {
  if (!isMerchantSession()) return unauthorized();
  return NextResponse.json(await getOpenServiceCalls());
}
