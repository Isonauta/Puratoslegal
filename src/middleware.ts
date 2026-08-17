import { NextRequest, NextResponse } from "next/server";

const COOKIE = "pl_session";
const PUBLIC = ["/login", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Only check cookie presence here — JWT verification happens in getSession()
  // inside each page/route, which runs in Node.js runtime with full env access.
  if (req.cookies.get(COOKIE)?.value) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
