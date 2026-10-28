import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Single merchant account
const VALID_CREDENTIALS = {
  usernames: ["admin", "merchant", "แม่ค้า"],
  passwords: ["1234", "admin1234"],
  user: {
    name: "แม่ค้า",
    role: "เจ้าของร้าน",
  },
};

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get("pos_session");

  if (!session || !session.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const data = JSON.parse(session.value);
    return NextResponse.json({ authenticated: true, user: data });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const normalizedUsername = username?.trim()?.toLowerCase();

    const isUsernameValid = VALID_CREDENTIALS.usernames.some(
      (u) => u.toLowerCase() === normalizedUsername
    );
    const isPasswordValid = VALID_CREDENTIALS.passwords.includes(password);

    if (!isUsernameValid || !isPasswordValid) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ลองใช้: admin / 1234)" },
        { status: 401 }
      );
    }

    const user = VALID_CREDENTIALS.user;

    // Set HTTP-only session cookie
    const response = NextResponse.json({ success: true, user });
    response.cookies.set({
      name: "pos_session",
      value: JSON.stringify(user),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("pos_session");
  return response;
}
