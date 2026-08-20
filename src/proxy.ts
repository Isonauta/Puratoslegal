import { NextRequest, NextResponse } from "next/server";

const COOKIE = "pl_session";
const NOTICIAS_COOKIE = "pl_noticias";
const PUBLIC = ["/login", "/api/auth", "/noticias/acceso", "/api/noticias/auth"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Main session covers everything
  if (req.cookies.get(COOKIE)?.value) return NextResponse.next();

  // Noticias section: accessible with separate noticias cookie
  if (pathname.startsWith("/noticias") || pathname.startsWith("/api/noticias")) {
    if (req.cookies.get(NOTICIAS_COOKIE)?.value) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/noticias/acceso";
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
