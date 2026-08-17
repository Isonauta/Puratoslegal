import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUser, createSession } from "@/lib/auth";

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

  await createSession({
    id: user.id ?? null,
    email: user.email,
    name: user.name,
    responsable: user.responsable ?? null,
    isAdmin: "isAdmin" in user ? user.isAdmin : user.role === "ADMIN",
    role: "role" in user ? (user.role as string | null) : null,
    companyId: "companyId" in user ? (user.companyId as string | null) : null,
  });
  return NextResponse.json({ ok: true });
}
