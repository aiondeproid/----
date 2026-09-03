import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { GATE_COOKIE, verifyGateToken } from "@/lib/gate";

/**
 * サイト共通合言葉ゲート（仕様書「8. 認証・セキュリティ」）。
 *
 * 有効なセッション Cookie が無いリクエストは `/gate` へ誘導する。
 * `/gate` 自身は素通し（合言葉入力と Server Action のため）。
 * Proxy は Next.js 16 では Node ランタイムで動作する。
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/gate") {
    return NextResponse.next();
  }

  const token = request.cookies.get(GATE_COOKIE)?.value;
  if (verifyGateToken(token)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/gate";
  url.search = "";
  const dest = `${pathname}${search}`;
  if (dest && dest !== "/") {
    url.searchParams.set("next", dest);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスに適用:
     * - _next/static, _next/image（ビルド成果物・画像最適化）
     * - favicon.ico
     * - public/ 配下の静的アセット（拡張子で判定）
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
