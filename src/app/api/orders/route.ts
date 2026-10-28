import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = getOrders();
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  try {
    const { tableId, items } = await request.json();
    if (!tableId || !items || !items.length) {
      return NextResponse.json({ error: "Missing tableId or items" }, { status: 400 });
    }
    const order = createOrder(tableId, items);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
