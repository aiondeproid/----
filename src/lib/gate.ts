/**
 * サイト共通合言葉ゲートのユーティリティ（仕様書「8. 認証・セキュリティ」）。
 *
 * セッションは署名付き Cookie で表現する。
 *   Cookie 値 = `<失効エポック秒>.<HMAC-SHA256(失効エポック秒, SITE_PASSCODE)>`
 * 署名鍵は `SITE_PASSCODE` から導出するため、合言葉を変更すると既存セッションは
 * すべて無効になる（環境変数は仕様の 5 つに収める）。
 *
 * Next.js の Proxy（Node ランタイム）と Server Action の両方から使う。純粋関数のみ。
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** セッション Cookie 名。 */
export const GATE_COOKIE = "kintai_gate";

/** セッションの有効期間（秒）。仕様の「例: 30 日」。 */
export const GATE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function getKey(): string | null {
  return process.env.SITE_PASSCODE ?? null;
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

/**
 * 新しいセッション Cookie 値を作る。
 * `SITE_PASSCODE` 未設定なら null（呼び出し側で設定不備として扱う）。
 */
export function createGateToken(now: number = Date.now()): {
  value: string;
  maxAge: number;
} | null {
  const key = getKey();
  if (!key) return null;
  const exp = Math.floor(now / 1000) + GATE_MAX_AGE_SEC;
  const payload = String(exp);
  return { value: `${payload}.${sign(payload, key)}`, maxAge: GATE_MAX_AGE_SEC };
}

/** セッション Cookie 値が有効か（署名一致かつ未失効）。 */
export function verifyGateToken(
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

/** 入力された合言葉が `SITE_PASSCODE` と一致するか（定数時間比較）。 */
export function isValidPasscode(input: string): boolean {
  const expected = getKey();
  if (!expected) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** `SITE_PASSCODE` がサーバーに設定されているか。 */
export function isGateConfigured(): boolean {
  return getKey() !== null;
}

/**
 * オープンリダイレクト防止。ローカルの絶対パス（`/...`）のみ許可し、
 * それ以外（外部 URL・プロトコル相対・空）は null を返す。
 */
export function safeNextPath(input: unknown): string | null {
  if (typeof input !== "string" || input.length === 0) return null;
  if (!input.startsWith("/")) return null;
  if (input.startsWith("//") || input.startsWith("/\\")) return null;
  return input;
}
