/**
 * 勤怠入力・編集のバリデーションスキーマ（zod）。
 * フォームから来る値はすべて文字列である前提。
 */
import { z } from "zod";

import { isTimeString, isWorkDateString } from "./time";

const dateField = z
  .string()
  .refine(isWorkDateString, "日付の形式が正しくありません（YYYY-MM-DD）");

const timeField = z
  .string()
  .refine(isTimeString, "時刻の形式が正しくありません（HH:MM）");

const noteField = z
  .string()
  .trim()
  .max(500, "備考は 500 文字以内で入力してください")
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

/** [出勤]: 退勤時刻が空の行を 1 件作成する。 */
export const clockInSchema = z.object({
  memberId: z.uuid("メンバーの選択が正しくありません"),
  workDate: dateField,
  inDate: dateField,
  inTime: timeField,
  note: noteField,
});

/** [退勤]: 退勤待ちの行に退勤時刻を入れる。勤務日は変更しない。 */
export const clockOutSchema = z.object({
  id: z.uuid(),
  outDate: dateField,
  outTime: timeField,
});

/** 行の編集: 勤務日・出勤・退勤（クリア可）・備考。 */
export const updateAttendanceSchema = z.object({
  id: z.uuid(),
  workDate: dateField,
  inDate: dateField,
  inTime: timeField,
  clearOut: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  outDate: dateField.optional().or(z.literal("")),
  outTime: timeField.optional().or(z.literal("")),
  note: noteField,
});

export const deleteAttendanceSchema = z.object({ id: z.uuid() });

/** safeParse の結果から最初のエラーメッセージを取り出す。 */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "入力内容を確認してください";
}
