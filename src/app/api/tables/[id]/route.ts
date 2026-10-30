import { NextResponse } from "next/server";
import { getRestaurantTableById, updateRestaurantTable, deleteRestaurantTable } from "@/lib/store";
import { isMerchantSession, unauthorized, isValidTableId, badTable } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id || !isValidTableId(id)) return badTable();

  try {
    const table = await getRestaurantTableById(id);
    if (!table) {
      return NextResponse.json({ error: "ไม่พบโต๊ะนี้" }, { status: 404 });
    }
    return NextResponse.json(table);
  } catch (error) {
    console.error("GET /api/tables/[id] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!isMerchantSession()) {
    return unauthorized();
  }

  const id = params.id;
  if (!id || !isValidTableId(id)) return badTable();

  try {
    const body = await req.json();
    const updates: Parameters<typeof updateRestaurantTable>[1] = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.seats !== undefined) updates.seats = Math.max(1, Number(body.seats) || 4);
    if (body.zone !== undefined) updates.zone = String(body.zone).trim();
    if (body.status !== undefined) {
      updates.status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    }

    const updated = await updateRestaurantTable(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบโต๊ะที่ต้องการแก้ไข" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/tables/[id] error:", error);
    return NextResponse.json({ error: "ไม่สามารถแก้ไขข้อมูลโต๊ะได้" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!isMerchantSession()) {
    return unauthorized();
  }

  const id = params.id;
  if (!id || !isValidTableId(id)) return badTable();

  try {
    const ok = await deleteRestaurantTable(id);
    if (!ok) {
      return NextResponse.json({ error: "ไม่พบโต๊ะที่ต้องการลบ" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `ลบโต๊ะ ${id} เรียบร้อยแล้ว` });
  } catch (error) {
    console.error("DELETE /api/tables/[id] error:", error);
    return NextResponse.json({ error: "ไม่สามารถลบโต๊ะได้" }, { status: 500 });
  }
}
