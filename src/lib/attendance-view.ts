/**
 * 勤怠行を画面表示用に整形するヘルパー（クライアント・サーバー共用）。
 * 仕様書「6. 時刻の表示ルール」に従う。
 */
import type { Attendance } from "./types";
import {
  formatRowClock,
  formatWorkedDuration,
  toDateTimeInput,
  weekdayJa,
  type DateTimeInput,
} from "./time";

export type RowView = {
  id: string;
  workDate: string;
  weekday: string;
  /** 勤務日 0:00 起点の出勤時刻（例: 09:00 / 28:00）。 */
  inClock: string;
  /** 退勤時刻。退勤待ちなら "--:--"。 */
  outClock: string;
  /** 実働時間（H:MM）。退勤待ちなら "--:--"。 */
  worked: string;
  isOpen: boolean;
  note: string;
  /** 編集フォームのプリフィル用。 */
  inInput: DateTimeInput;
  outInput: DateTimeInput | null;
};

export function describeRow(row: Attendance): RowView {
  return {
    id: row.id,
    workDate: row.work_date,
    weekday: weekdayJa(row.work_date),
    inClock: formatRowClock(row.clock_in_at, row.work_date),
    outClock: row.clock_out_at
      ? formatRowClock(row.clock_out_at, row.work_date)
      : "--:--",
    worked: formatWorkedDuration(row.clock_in_at, row.clock_out_at),
    isOpen: row.clock_out_at == null,
    note: row.note ?? "",
    inInput: toDateTimeInput(row.clock_in_at),
    outInput: row.clock_out_at ? toDateTimeInput(row.clock_out_at) : null,
  };
}
