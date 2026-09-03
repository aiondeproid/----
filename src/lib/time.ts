/**
 * 日本時間・勤務日・時刻表示のユーティリティ。
 *
 * 仕様書「5. 勤務日の定義」「6. 時刻の表示ルール」に対応。
 * このアプリの時刻はすべて日本時間（Asia/Tokyo）で扱う。DB には UTC の
 * timestamptz として保存し、表示・入力・勤務日判定の際に JST へ変換する。
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/** アプリ共通のタイムゾーン。 */
export const TZ = "Asia/Tokyo";

/**
 * 勤務日の境界時刻（時）。この時刻より前の出勤は前日の勤務日として扱う。
 * 仕様によりコードに固定（設定変更機能なし）。
 */
export const WORK_DATE_BOUNDARY_HOUR = 4;

/** DB / API でやり取りする時刻の型。ISO 文字列・Date・エポック ms を受ける。 */
export type Instant = string | number | Date;

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 与えられた instant を JST の dayjs に変換する。 */
export function toJst(instant: Instant) {
  return dayjs(instant).tz(TZ);
}

/** 現在時刻を JST の dayjs で返す。 */
export function nowJst() {
  return dayjs().tz(TZ);
}

/** `YYYY-MM-DD` 形式の勤務日文字列かどうか。 */
export function isWorkDateString(value: string): boolean {
  return dayjs(value, "YYYY-MM-DD", true).isValid();
}

/**
 * 出勤時刻から勤務日（`YYYY-MM-DD`）を自動決定する。
 *
 * - 出勤時刻の JST での時刻が 4:00 以降 … 勤務日 = その暦日
 * - 出勤時刻が 3:59 以前（深夜）      … 勤務日 = その暦日の前日
 *
 * 退勤時刻は勤務日を変更しない（この関数は出勤時刻にのみ適用する）。
 */
export function resolveWorkDate(clockInAt: Instant): string {
  const jst = toJst(clockInAt);
  const base = jst.hour() < WORK_DATE_BOUNDARY_HOUR ? jst.subtract(1, "day") : jst;
  return base.format("YYYY-MM-DD");
}

/** 分数を `H:MM`（時は 0 埋めなし、分は 2 桁）で表す。負値は先頭に `-`。 */
function formatHM(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

/**
 * 行内の時刻表示。勤務日 0:00（JST）を起点とした経過時間を `HH:MM` で返す。
 * 翌日にまたぐ時刻は 24:00 以上で表示される（例: 28:00）。
 */
export function formatRowClock(instant: Instant, workDate: string): string {
  const base = dayjs.tz(`${workDate} 00:00`, "YYYY-MM-DD HH:mm", TZ);
  const minutes = toJst(instant).diff(base, "minute");
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * 実働時間（退勤日時 − 出勤日時）を `H:MM` で返す。
 * 退勤が未入力（null / undefined）の場合は「退勤待ち」を表す `--:--`。
 */
export function formatWorkedDuration(
  clockInAt: Instant,
  clockOutAt: Instant | null | undefined,
): string {
  if (clockOutAt == null) return "--:--";
  const minutes = dayjs(clockOutAt).diff(dayjs(clockInAt), "minute");
  return formatHM(minutes);
}

/** 実働時間（分）を返す。退勤未入力なら null。合計計算に使う。 */
export function workedMinutes(
  clockInAt: Instant,
  clockOutAt: Instant | null | undefined,
): number | null {
  if (clockOutAt == null) return null;
  return dayjs(clockOutAt).diff(dayjs(clockInAt), "minute");
}

/**
 * 実働時間の合計表示。24 時間を超えてもそのまま `H:MM`（時は桁数制限なし）で返す。
 */
export function formatTotalDuration(totalMinutes: number): string {
  return formatHM(totalMinutes);
}

/** 勤務日（`YYYY-MM-DD`）の曜日を日本語 1 文字（日〜土）で返す。 */
export function weekdayJa(workDate: string): string {
  return WEEKDAYS_JA[dayjs(workDate).day()];
}

/** 日付 + 時刻の入力値。フォームのプリフィル・保存前の組み立てに使う。 */
export type DateTimeInput = { date: string; time: string };

/** JST の instant を入力欄用の `{ date: 'YYYY-MM-DD', time: 'HH:mm' }` に分解する。 */
export function toDateTimeInput(instant: Instant): DateTimeInput {
  const jst = toJst(instant);
  return { date: jst.format("YYYY-MM-DD"), time: jst.format("HH:mm") };
}

/** 現在時刻（JST）を入力欄用に分解して返す。プリフィル用。 */
export function nowDateTimeInput(): DateTimeInput {
  return toDateTimeInput(new Date());
}

/** `HH:mm`（00:00〜23:59）形式の時刻文字列かどうか。 */
export function isTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * 入力欄の日付 + 時刻（JST のウォールクロック）を絶対時刻の ISO 文字列に変換する。
 * DB 保存前に使う。日付・時刻の形式が不正な場合は null。
 * （`dayjs.tz` は "99:99" のような値を繰り上げてしまうため、形式を先に検証する）
 */
export function dateTimeInputToIso(date: string, time: string): string | null {
  if (!isWorkDateString(date) || !isTimeString(time)) return null;
  const parsed = dayjs.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", TZ);
  return parsed.isValid() ? parsed.toISOString() : null;
}

/** 当月の勤務日 from / to（`YYYY-MM-DD`）。勤怠一覧・Excel の初期値。 */
export function currentMonthRange(reference: Instant = new Date()): {
  from: string;
  to: string;
} {
  const jst = toJst(reference);
  return {
    from: jst.startOf("month").format("YYYY-MM-DD"),
    to: jst.endOf("month").format("YYYY-MM-DD"),
  };
}
