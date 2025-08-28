import { SignJWT, jwtVerify } from "jose";
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function sign(payload: any, expiresIn = "15m") {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime(expiresIn).sign(secret);
}
export async function verify<T=any>(token?: string | null): Promise<T|null> {
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret); return payload as T; } catch { return null; }
}
