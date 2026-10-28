import { NextRequest, NextResponse } from "next/server";
import { getTableCart, saveTableCart, clearTableCart } from "@/lib/store";
import { CartItem } from "@/types/cart";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const tableId = params.tableId;
  const cart = getTableCart(tableId);
  return NextResponse.json(cart);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const tableId = params.tableId;
  const body = await request.json();

  if (Array.isArray(body.items)) {
    const updated = saveTableCart(tableId, body.items);
    return NextResponse.json(updated);
  }

  // Handle single item add/update mutation
  const currentCart = getTableCart(tableId);
  const items = [...currentCart.items];
  const { action, item } = body as { action: "add" | "update" | "remove"; item: CartItem };

  if (action === "add" && item) {
    const existingIndex = items.findIndex((i) => i.menuId === item.menuId && i.note === item.note);
    if (existingIndex > -1) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }
  } else if (action === "update" && item) {
    const existingIndex = items.findIndex((i) => i.menuId === item.menuId);
    if (existingIndex > -1) {
      if (item.quantity <= 0) {
        items.splice(existingIndex, 1);
      } else {
        items[existingIndex].quantity = item.quantity;
      }
    }
  } else if (action === "remove" && item) {
    const existingIndex = items.findIndex((i) => i.menuId === item.menuId);
    if (existingIndex > -1) {
      items.splice(existingIndex, 1);
    }
  }

  const updated = saveTableCart(tableId, items);
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const tableId = params.tableId;
  const cleared = clearTableCart(tableId);
  return NextResponse.json(cleared);
}
