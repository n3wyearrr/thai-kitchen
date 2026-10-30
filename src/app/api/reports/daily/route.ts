import { NextResponse } from "next/server";
import { getDailySalesReport } from "@/lib/store";
import { isMerchantSession, unauthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isMerchantSession()) return unauthorized();

  try {
    const report = await getDailySalesReport();
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate sales report" }, { status: 500 });
  }
}
