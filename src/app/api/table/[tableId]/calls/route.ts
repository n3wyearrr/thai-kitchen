import { NextRequest, NextResponse } from "next/server";
import { createServiceCall } from "@/lib/store";
import { badTable, isValidTableId } from "@/lib/guard";
import { ServiceCallType } from "@/types/service";

export const dynamic = "force-dynamic";

const TYPES: ServiceCallType[] = ["STAFF", "WATER", "BILL"];

export async function POST(
  request: NextRequest,
  { params }: { params: { tableId: string } }
) {
  if (!isValidTableId(params.tableId)) return badTable();
  const { type } = (await request.json()) as { type?: ServiceCallType };
  if (!type || !TYPES.includes(type)) {
    return NextResponse.json({ error: "ประเภทคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  const call = await createServiceCall(params.tableId, type);
  return NextResponse.json(call, { status: 201 });
}
