import "server-only";

import ExcelJS from "exceljs";

import {
  formatRowClock,
  formatTotalDuration,
  formatWorkedDuration,
  weekdayJa,
  workedMinutes,
} from "./time";
import type { AttendanceWithMember } from "./types";

const HEADERS = ["日付", "曜日", "名前", "出勤", "退勤", "実働時間", "備考"];

const THIN = { style: "thin" as const };
const ALL_BORDERS = { top: THIN, left: THIN, bottom: THIN, right: THIN };

/** 全角文字を 2、半角を 1 として数える（Excel の列幅は文字数ベース）。 */
function displayWidth(value: string): number {
  let w = 0;
  for (const ch of value) w += ch.charCodeAt(0) > 0xff ? 2 : 1;
  return w;
}

export type ExportRange = { from: string; to: string };

/**
 * 勤怠一覧の書式付き .xlsx を生成する（仕様書「4.3 Excel 書き出し」）。
 * 全員を 1 シートに、行は呼び出し側で 勤務日 → 表示順 → 出勤 に整列済みの想定。
 */
export async function buildAttendanceWorkbook(
  rows: AttendanceWithMember[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const ws = wb.addWorksheet("勤怠", {
    views: [{ state: "frozen", ySplit: 1 }], // 見出し行を固定
  });

  ws.addRow(HEADERS);

  const lines: string[][] = [];
  let totalMinutes = 0;
  for (const r of rows) {
    const wm = workedMinutes(r.clock_in_at, r.clock_out_at);
    if (wm != null) totalMinutes += wm;
    const line = [
      r.work_date,
      weekdayJa(r.work_date),
      r.member.name,
      formatRowClock(r.clock_in_at, r.work_date),
      r.clock_out_at ? formatRowClock(r.clock_out_at, r.work_date) : "--:--",
      formatWorkedDuration(r.clock_in_at, r.clock_out_at),
      r.note ?? "",
    ];
    lines.push(line);
    ws.addRow(line);
  }

  const totalRow = ["", "", "合計", "", "", formatTotalDuration(totalMinutes), ""];
  ws.addRow(totalRow);

  // 列幅を内容に合わせる
  ws.columns.forEach((col, i) => {
    let max = displayWidth(HEADERS[i]);
    for (const line of [...lines, totalRow]) {
      max = Math.max(max, displayWidth(String(line[i] ?? "")));
    }
    col.width = Math.min(Math.max(max + 2, 6), 60);
  });

  // 罫線・見出し書式・合計行
  const lastRow = ws.rowCount;
  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= HEADERS.length; c++) {
      const cell = ws.getCell(r, c);
      cell.border = ALL_BORDERS;
      if (r === 1) {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDCE6F1" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    }
  }
  for (let c = 1; c <= HEADERS.length; c++) {
    ws.getCell(lastRow, c).font = { bold: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

/** ダウンロードファイル名。例: 勤怠_2026-09-01_2026-09-30.xlsx */
export function exportFilename(range: ExportRange): string {
  return `勤怠_${range.from}_${range.to}.xlsx`;
}
