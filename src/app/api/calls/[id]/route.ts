import { NextResponse } from "next/server";
import { resolveServiceCall } from "@/lib/store";
import { isMerchantSession, unauthorized } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isMerchantSession()) return unauthorized();
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
  }
  const call = await resolveServiceCall(id);
  if (!call) return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
  return NextResponse.json(call);
}
