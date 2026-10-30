import { NextRequest, NextResponse } from "next/server";
import { toggleMenuAvailability } from "@/lib/store";
import { isMerchantSession, unauthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isMerchantSession()) return unauthorized();

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid menu ID" }, { status: 400 });
  }

  try {
    const { isAvailable } = (await request.json()) as { isAvailable: boolean };
    const updated = await toggleMenuAvailability(id, isAvailable);
    if (!updated) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update menu status" }, { status: 500 });
  }
}
