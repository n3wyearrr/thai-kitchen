import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

/** ตรวจว่าคำขอมาจากแม่ค้าที่ล็อกอินแล้ว (คุกกี้ pos_session ที่ลงลายเซ็นไว้) */
export function isMerchantSession(): boolean {
  return verifySessionToken(cookies().get("pos_session")?.value) !== null;
}

export function unauthorized() {
  return NextResponse.json({ error: "กรุณาเข้าสู่ระบบแม่ค้า" }, { status: 401 });
}

const TABLE_ID_PATTERN = /^[A-Za-z0-9ก-๙_-]{1,20}$/;

export function isValidTableId(tableId: string): boolean {
  return TABLE_ID_PATTERN.test(tableId);
}

export function badTable() {
  return NextResponse.json({ error: "หมายเลขโต๊ะไม่ถูกต้อง" }, { status: 400 });
}
