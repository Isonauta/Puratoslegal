import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "pl_session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE)?.value;

  if (!cookie) {
    return NextResponse.json({ hasCookie: false });
  }

  const authSecret = process.env.AUTH_SECRET;
  const secretValue = authSecret ?? "fallback-dev-secret-change-in-prod";
  const SECRET = new TextEncoder().encode(secretValue);

  let verifyResult: string;
  let payload: unknown = null;
  try {
    const result = await jwtVerify(cookie, SECRET);
    payload = result.payload;
    verifyResult = "ok";
  } catch (e) {
    verifyResult = String(e);
  }

  return NextResponse.json({
    hasCookie: true,
    cookieLength: cookie.length,
    cookiePreview: cookie.slice(0, 20) + "...",
    authSecretSet: !!authSecret,
    authSecretLength: authSecret?.length ?? 0,
    verifyResult,
    payload,
  });
}
