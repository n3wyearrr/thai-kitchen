import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken, SessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const MERCHANT_USER: SessionUser = { name: "แม่ค้า", role: "เจ้าของร้าน" };

/**
 * บัญชีแม่ค้า: บน production ต้องตั้ง MERCHANT_USERNAME / MERCHANT_PASSWORD เอง
 * ตอนพัฒนาใช้ admin / 1234 ได้เพื่อความสะดวก
 */
function getCredentials(): { username: string; password: string } | null {
  const username = process.env.MERCHANT_USERNAME;
  const password = process.env.MERCHANT_PASSWORD;
  if (username && password) return { username, password };
  if (process.env.NODE_ENV !== "production") return { username: "admin", password: "1234" };
  return null;
}

export async function GET() {
  const user = verifySessionToken(cookies().get("pos_session")?.value);
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user });
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const creds = getCredentials();
    if (!creds) {
      return NextResponse.json(
        { error: "ระบบยังไม่ได้ตั้งค่าบัญชีแม่ค้า (MERCHANT_USERNAME / MERCHANT_PASSWORD)" },
        { status: 500 }
      );
    }

    const valid =
      username?.trim().toLowerCase() === creds.username.toLowerCase() &&
      password === creds.password;
    if (!valid) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const token = createSessionToken(MERCHANT_USER);
    if (!token) {
      return NextResponse.json(
        { error: "ระบบยังไม่ได้ตั้งค่า SESSION_SECRET" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ success: true, user: MERCHANT_USER });
    response.cookies.set({
      name: "pos_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("pos_session");
  return response;
}
