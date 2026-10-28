import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/store";
import { OrderStatus } from "@/types/order";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { status } = (await request.json()) as { status: OrderStatus };
    const updated = updateOrderStatus(params.orderId, status);
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
