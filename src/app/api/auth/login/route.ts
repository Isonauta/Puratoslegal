import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUser, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciales requeridas" }, { status: 400 });
  }

  const user = findUser(email);
  if (!user) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.hash);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  await createSession({ email: user.email, name: user.name, responsable: user.responsable, isAdmin: user.isAdmin });
  return NextResponse.json({ ok: true });
}
