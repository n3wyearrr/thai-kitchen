import { NextRequest, NextResponse } from "next/server";
import { getTableCart, mutateTableCart, clearTableCart, getDbMenuById } from "@/lib/store";
import { badTable, isValidTableId } from "@/lib/guard";
import { cartLineKey } from "@/lib/cart";
import { CartItem, SpiceLevel } from "@/types/cart";

export const dynamic = "force-dynamic";

type Ctx = { params: { tableId: string } };

const SPICE_VALUES: SpiceLevel[] = ["NONE", "LOW", "MEDIUM", "HIGH"];

/** สร้างรายการตะกร้าจากข้อมูลเมนูฝั่งเซิร์ฟเวอร์ และตรวจสอบว่าของหมดหรือไม่ */
async function buildItem(raw: Partial<CartItem>): Promise<{ item: CartItem | null; error?: string }> {
  const menuId = typeof raw.menuId === "number" ? raw.menuId : null;
  if (!menuId) return { item: null, error: "ไม่พบรหัสเมนู" };

  const menu = await getDbMenuById(menuId);
  if (!menu) return { item: null, error: "ไม่พบเมนูนี้ในระบบ" };

  if (menu.isAvailable === false) {
    return { item: null, error: `ขออภัย เมนู "${menu.name}" หมดชั่วคราว` };
  }

  const quantity = Math.floor(Number(raw.quantity));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
    return { item: null, error: "จำนวนไม่ถูกต้อง" };
  }

  const pickedExtras = (menu.extras ?? []).filter((e) => (raw.extras ?? []).includes(e.label));
  const spice =
    menu.spiceable && raw.spice && SPICE_VALUES.includes(raw.spice) ? raw.spice : undefined;
  const note = typeof raw.note === "string" ? raw.note.trim().slice(0, 120) : "";

  return {
    item: {
      menuId: menu.id,
      name: menu.name,
      price: menu.price + pickedExtras.reduce((s, e) => s + e.price, 0),
      quantity,
      image: menu.image,
      spice,
      extras: pickedExtras.length ? pickedExtras.map((e) => e.label) : undefined,
      note: note || undefined,
    },
  };
}

export async function GET(_request: NextRequest, { params }: Ctx) {
  if (!isValidTableId(params.tableId)) return badTable();
  return NextResponse.json(await getTableCart(params.tableId));
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const { tableId } = params;
  if (!isValidTableId(tableId)) return badTable();

  const body = (await request.json()) as {
    action?: "add" | "setQuantity" | "remove";
    item?: Partial<CartItem>;
    lineKey?: string;
    quantity?: number;
  };

  if (body.action === "add") {
    const result = body.item ? await buildItem(body.item) : { item: null, error: "ข้อมูลไม่ถูกต้อง" };
    if (!result.item) {
      return NextResponse.json({ error: result.error || "ข้อมูลเมนูไม่ถูกต้อง" }, { status: 400 });
    }
    const item = result.item;
    const key = cartLineKey(item);
    const cart = await mutateTableCart(tableId, (items) => {
      const next = items.map((i) => ({ ...i }));
      const existing = next.find((i) => cartLineKey(i) === key);
      if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
      else next.push(item);
      return next;
    });
    return NextResponse.json(cart);
  }

  if (body.action === "setQuantity" && body.lineKey) {
    const qty = Math.floor(Number(body.quantity));
    const cart = await mutateTableCart(tableId, (items) =>
      items
        .map((i) => (cartLineKey(i) === body.lineKey ? { ...i, quantity: Math.min(99, qty) } : i))
        .filter((i) => i.quantity > 0)
    );
    return NextResponse.json(cart);
  }

  if (body.action === "remove" && body.lineKey) {
    const cart = await mutateTableCart(tableId, (items) =>
      items.filter((i) => cartLineKey(i) !== body.lineKey)
    );
    return NextResponse.json(cart);
  }

  return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  if (!isValidTableId(params.tableId)) return badTable();
  return NextResponse.json(await clearTableCart(params.tableId));
}
