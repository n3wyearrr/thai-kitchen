import crypto from "node:crypto";

export interface SessionUser {
  name: string;
  role: string;
}

interface SessionPayload extends SessionUser {
  exp: number; // epoch ms
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function getSecret(): string | null {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // ใช้ค่าเริ่มต้นได้เฉพาะตอนพัฒนา บน production ต้องตั้ง SESSION_SECRET เอง
  return process.env.NODE_ENV === "production" ? null : "dev-only-secret";
}

function sign(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}

export function createSessionToken(user: SessionUser): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload: SessionPayload = { ...user, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  const secret = getSecret();
  if (!token || !secret) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}
