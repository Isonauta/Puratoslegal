import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUser, createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciales requeridas" }, { status: 400 });
  }

  const user = await findUser(email);
  if (!user) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const hash = "passwordHash" in user ? user.passwordHash : user.hash;
  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const token = await createSessionToken({
    id: user.id ?? null,
    email: user.email,
    name: user.name,
    responsable: user.responsable ?? null,
    isAdmin: "isAdmin" in user ? user.isAdmin : user.role === "ADMIN",
    role: "role" in user ? (user.role as string | null) : null,
    companyId: "companyId" in user ? (user.companyId as string | null) : null,
  });

  const secure = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 7;
  const cookieStr = `pl_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;

  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", cookieStr);
  return response;
}
