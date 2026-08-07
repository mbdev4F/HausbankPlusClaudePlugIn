import { createHmac, timingSafeEqual, createHash } from "crypto";

function b64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSec: number,
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const h = b64urlJson(header);
  const p = b64urlJson(body);
  const sig = createHmac("sha256", secret)
    .update(`${h}.${p}`)
    .digest("base64url");
  return `${h}.${p}.${sig}`;
}

export function verifyJwt<T extends Record<string, unknown>>(
  token: string,
  secret: string,
): T {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  const [h, p, s] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${h}.${p}`)
    .digest("base64url");
  const a = Buffer.from(s);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid JWT signature");
  }
  const payload = JSON.parse(
    Buffer.from(p, "base64url").toString("utf8"),
  ) as T & { exp?: number };
  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT expired");
  }
  return payload;
}

export function pkceChallengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Decode JWT payload without verifying (Entra id_token / access opaque check). */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}
