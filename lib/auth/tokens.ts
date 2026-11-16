import { createHmac, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "wazifa_session";
export const SESSION_TTL_SECONDS = 14 * 24 * 60 * 60;

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token).digest("hex");
}
