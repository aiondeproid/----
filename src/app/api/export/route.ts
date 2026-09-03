import type { NextRequest } from "next/server";

import { fetchAttendanceRange } from "@/lib/attendance";
import { buildAttendanceWorkbook, exportFilename } from "@/lib/excel";
import { currentMonthRange, isWorkDateString } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * 勤怠一覧と同じ絞り込み条件（期間・名前）で書式付き .xlsx を返す。
 * サイト共通合言葉ゲート（proxy）の内側にあるため、未認証では到達しない。
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const def = currentMonthRange();
  const fromRaw = sp.get("from");
  const toRaw = sp.get("to");
  const from = fromRaw && isWorkDateString(fromRaw) ? fromRaw : def.from;
  const to = toRaw && isWorkDateString(toRaw) ? toRaw : def.to;
  const memberRaw = sp.get("member");
  const memberId = memberRaw && memberRaw.length > 0 ? memberRaw : null;

  const rows = await fetchAttendanceRange({ from, to, memberId });
  const workbook = await buildAttendanceWorkbook(rows);

  const filename = exportFilename({ from, to });
  const asciiFallback = `kintai_${from}_${to}.xlsx`;

  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
