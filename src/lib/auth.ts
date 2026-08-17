import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "fallback-dev-secret-change-in-prod"
);
const COOKIE = "pl_session";

export type SessionUser = {
  id: string | null;
  email: string;
  name: string;
  responsable: string | null;
  isAdmin: boolean;
  role: string | null;
  companyId: string | null;
};

// Hardcoded fallback users (Legal module — kept for backward compatibility)
const LEGACY_USERS: {
  email: string;
  name: string;
  responsable: string | null;
  isAdmin: boolean;
  hash: string;
}[] = [
  {
    email: "scorroteaortiz@puratos.com",
    name: "Sebastián Corrotea",
    responsable: "Sebastián Corrotea",
    isAdmin: false,
    hash: "$2b$12$xV04JpC3KjQmDM3PgKHlIuMBMdqi4jo5t68PBPXNvygkRGP4UHViq",
  },
  {
    email: "bhenriquez@puratos.com",
    name: "Benjamín Henriquez",
    responsable: "Benjamín Henriquez",
    isAdmin: false,
    hash: "$2b$12$/nyNqF2z.AOJYOIzjMEw0uiasCJDrXtpWzeVdiLCTDkRYVA/oS1/C",
  },
  {
    email: "cneumannlatorre@puratos.com",
    name: "Carlos Neumann",
    responsable: null,
    isAdmin: true,
    hash: "$2b$12$jhavcaiMv3wsfCKOFaoqT.w2HrSQglKm4p8U27mpNnxlwfDfCftY.",
  },
  {
    email: "cristian@cristiancordero.cl",
    name: "Cristián Cordero",
    responsable: null,
    isAdmin: true,
    hash: "$2b$12$6a94P4XJnHwH.dgh..b3HurKJ7xbpy/j0SyK4L4h9vx3Gsdt54XyW",
  },
];

// Lookup by email: DB first, then legacy hardcoded list.
export async function findUser(email: string) {
  const normalized = email.toLowerCase();

  // Try DB user (PTS users and migrated Legal users)
  try {
    const dbUser = await prisma.user.findUnique({ where: { email: normalized } });
    if (dbUser) return { ...dbUser, responsable: null, isLegacy: false };
  } catch {
    // DB not ready yet — fall through to legacy
  }

  const legacy = LEGACY_USERS.find((u) => u.email.toLowerCase() === normalized);
  if (legacy) return { ...legacy, id: null, role: null, companyId: null, isLegacy: true };

  return null;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    responsable: user.responsable,
    isAdmin: user.isAdmin,
    role: user.role,
    companyId: user.companyId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export const SESSION_COOKIE_OPTIONS = {
  name: COOKIE,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

/** @deprecated Use createSessionToken + set cookie on NextResponse directly */
export async function createSession(user: SessionUser) {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      id: (payload.id as string | null) ?? null,
      email: payload.email as string,
      name: payload.name as string,
      responsable: (payload.responsable as string | null) ?? null,
      isAdmin: (payload.isAdmin as boolean) ?? false,
      role: (payload.role as string | null) ?? null,
      companyId: (payload.companyId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
