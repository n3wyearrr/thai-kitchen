import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/store";
import { isMerchantSession, unauthorized } from "@/lib/guard";
import { OrderStatus } from "@/types/order";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["PENDING", "COOKING", "SERVED", "PAID"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  if (!isMerchantSession()) return unauthorized();
  try {
    const { status } = (await request.json()) as { status: OrderStatus };
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }
    const updated = await updateOrderStatus(params.orderId, status);
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
