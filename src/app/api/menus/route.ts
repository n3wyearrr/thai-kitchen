import { NextRequest, NextResponse } from "next/server";
import { getDbMenus } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const menus = await getDbMenus();
    return NextResponse.json(menus);
  } catch (error) {
    console.error("GET /api/menus error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
