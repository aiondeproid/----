"use server";

import { revalidatePath } from "next/cache";

import { fetchAttendanceById } from "@/lib/attendance";
import {
  clockInSchema,
  clockOutSchema,
  deleteAttendanceSchema,
  firstIssueMessage,
  updateAttendanceSchema,
} from "@/lib/schemas";
import { createAnonServerClient } from "@/lib/supabase/server";
import { dateTimeInputToIso } from "@/lib/time";

export type ActionState = { ok: boolean; error: string | null };

const OK: ActionState = { ok: true, error: null };
const fail = (error: string): ActionState => ({ ok: false, error });

function revalidate() {
  revalidatePath("/attendance");
  revalidatePath("/list");
}

/** [出勤]: 退勤時刻が空の行を 1 件作成する。 */
export async function clockInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = clockInSchema.safeParse({
    memberId: formData.get("memberId"),
    workDate: formData.get("workDate"),
    inDate: formData.get("inDate"),
    inTime: formData.get("inTime"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return fail(firstIssueMessage(parsed.error));

  const { memberId, workDate, inDate, inTime, note } = parsed.data;
  const clockInAt = dateTimeInputToIso(inDate, inTime);
  if (!clockInAt) return fail("出勤時刻が正しくありません");

  const sb = createAnonServerClient();
  const { error } = await sb.from("attendance").insert({
    member_id: memberId,
    work_date: workDate,
    clock_in_at: clockInAt,
    clock_out_at: null,
    note,
  });
  if (error) return fail(`保存に失敗しました: ${error.message}`);

  revalidate();
  return OK;
}

/** [退勤]: 退勤待ちの行に退勤時刻を確定する。勤務日は変更しない。 */
export async function clockOutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = clockOutSchema.safeParse({
    id: formData.get("id"),
    outDate: formData.get("outDate"),
    outTime: formData.get("outTime"),
  });
  if (!parsed.success) return fail(firstIssueMessage(parsed.error));

  const { id, outDate, outTime } = parsed.data;
  const clockOutAt = dateTimeInputToIso(outDate, outTime);
  if (!clockOutAt) return fail("退勤時刻が正しくありません");

  const row = await fetchAttendanceById(id);
  if (!row) return fail("対象の記録が見つかりません");
  if (new Date(clockOutAt) <= new Date(row.clock_in_at)) {
    return fail("退勤時刻は出勤時刻より後にしてください");
  }

  const sb = createAnonServerClient();
  const { error } = await sb
    .from("attendance")
    .update({ clock_out_at: clockOutAt })
    .eq("id", id);
  if (error) return fail(`保存に失敗しました: ${error.message}`);

  revalidate();
  return OK;
}

/** 行の編集: 勤務日・出勤・退勤（クリア可）・備考をまとめて更新する。 */
export async function updateAttendanceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateAttendanceSchema.safeParse({
    id: formData.get("id"),
    workDate: formData.get("workDate"),
    inDate: formData.get("inDate"),
    inTime: formData.get("inTime"),
    clearOut: formData.get("clearOut") ?? undefined,
    outDate: formData.get("outDate") ?? undefined,
    outTime: formData.get("outTime") ?? undefined,
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return fail(firstIssueMessage(parsed.error));

  const { id, workDate, inDate, inTime, clearOut, outDate, outTime, note } =
    parsed.data;

  const clockInAt = dateTimeInputToIso(inDate, inTime);
  if (!clockInAt) return fail("出勤時刻が正しくありません");

  let clockOutAt: string | null = null;
  if (!clearOut) {
    if (!outDate || !outTime) return fail("退勤時刻を入力するか、「退勤待ちに戻す」を選んでください");
    clockOutAt = dateTimeInputToIso(outDate, outTime);
    if (!clockOutAt) return fail("退勤時刻が正しくありません");
    if (new Date(clockOutAt) <= new Date(clockInAt)) {
      return fail("退勤時刻は出勤時刻より後にしてください");
    }
  }

  const sb = createAnonServerClient();
  const { error } = await sb
    .from("attendance")
    .update({
      work_date: workDate,
      clock_in_at: clockInAt,
      clock_out_at: clockOutAt,
      note,
    })
    .eq("id", id);
  if (error) return fail(`保存に失敗しました: ${error.message}`);

  revalidate();
  return OK;
}

/** 行の削除（承認不要）。 */
export async function deleteAttendanceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteAttendanceSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return fail(firstIssueMessage(parsed.error));

  const sb = createAnonServerClient();
  const { error } = await sb.from("attendance").delete().eq("id", parsed.data.id);
  if (error) return fail(`削除に失敗しました: ${error.message}`);

  revalidate();
  return OK;
}
