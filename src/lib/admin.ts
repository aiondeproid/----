/**
 * 「名前の管理」の管理用合言葉（仕様書「8. 認証・セキュリティ」）。
 *
 * サイト共通合言葉ゲート（[[gate]]）の内側で、さらに members の変更操作を
 * ADMIN_PASSCODE で保護する。認証すると署名付き Cookie を発行し、以降の
 * Server Action / Route Handler はその Cookie を検証する。
 * DB 書き込み自体は SUPABASE_SERVICE_ROLE_KEY（RLS バイパス）で行う。
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "kintai_admin";

/** 管理セッションの有効期間（秒）。1 日。 */
export const ADMIN_MAX_AGE_SEC = 60 * 60 * 24;

function getKey(): string | null {
  return process.env.ADMIN_PASSCODE ?? null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** `ADMIN_PASSCODE` がサーバーに設定されているか。 */
export function isAdminConfigured(): boolean {
  return getKey() !== null;
}

/** 管理セッション Cookie 値を作る。未設定なら null。 */
export function createAdminToken(now: number = Date.now()): {
  value: string;
  maxAge: number;
} | null {
  const key = getKey();
  if (!key) return null;
  const exp = Math.floor(now / 1000) + ADMIN_MAX_AGE_SEC;
  const payload = String(exp);
  return { value: `${payload}.${sign(payload, key)}`, maxAge: ADMIN_MAX_AGE_SEC };
}

/** 管理セッション Cookie 値が有効か（署名一致かつ未失効）。 */
export function verifyAdminToken(
  token: string | undefined | null,
  now: number = Date.now(),
): boolean {
  const key = getKey();
  if (!key || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  if (!safeEqualHex(sig, sign(payload, key))) return false;

  const exp = Number(payload);
  return Number.isFinite(exp) && exp * 1000 > now;
}

/** 入力された合言葉が `ADMIN_PASSCODE` と一致するか（定数時間比較）。 */
export function isValidAdminPasscode(input: string): boolean {
  const expected = getKey();
  if (!expected) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
