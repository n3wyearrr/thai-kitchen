import { NextResponse } from "next/server";
import { getRestaurantTablesWithStats, getRestaurantTableById, createRestaurantTable } from "@/lib/store";
import { isMerchantSession, unauthorized, isValidTableId, badTable } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tables = await getRestaurantTablesWithStats();
    return NextResponse.json(tables);
  } catch (error) {
    console.error("GET /api/tables error:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลโต๊ะได้" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isMerchantSession()) {
    return unauthorized();
  }

  try {
    const body = await req.json();
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim() || `โต๊ะ ${id}`;
    const seats = Number(body.seats) || 4;
    const zone = String(body.zone || "").trim() || "โซนห้องแอร์";
    const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    if (!id || !isValidTableId(id)) {
      return badTable();
    }

    const existing = await getRestaurantTableById(id);
    if (existing) {
      return NextResponse.json({ error: `มีโต๊ะหมายเลข "${id}" อยู่ในระบบแล้ว` }, { status: 409 });
    }

    const created = await createRestaurantTable({
      id,
      name,
      seats,
      zone,
      status,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/tables error:", error);
    return NextResponse.json({ error: "ไม่สามารถเพิ่มโต๊ะได้" }, { status: 500 });
  }
}
