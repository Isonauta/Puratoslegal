import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "fallback-dev-secret-change-in-prod"
);
const COOKIE = "pl_session";

export type SessionUser = {
  email: string;
  name: string;
  responsable: string | null;
  isAdmin: boolean;
};

const USERS: { email: string; name: string; responsable: string | null; isAdmin: boolean; hash: string }[] = [
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

export function findUser(email: string) {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ email: user.email, name: user.name, responsable: user.responsable, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      email: payload.email as string,
      name: payload.name as string,
      responsable: (payload.responsable as string | null) ?? null,
      isAdmin: (payload.isAdmin as boolean) ?? false,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
