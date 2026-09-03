import "server-only";

import { createAnonServerClient } from "./supabase/server";
import type { Attendance, AttendanceWithMember, Member } from "./types";

/** アクティブなメンバーを表示順で取得する（勤怠入力の名前選択用）。 */
export async function fetchActiveMembers(): Promise<Member[]> {
  const sb = createAnonServerClient();
  const { data, error } = await sb
    .from("members")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`メンバーの取得に失敗しました: ${error.message}`);
  return (data ?? []) as Member[];
}

/** 全メンバーを表示順で取得する（一覧・Excel 用。アーカイブ済みも含む）。 */
export async function fetchAllMembers(): Promise<Member[]> {
  const sb = createAnonServerClient();
  const { data, error } = await sb
    .from("members")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`メンバーの取得に失敗しました: ${error.message}`);
  return (data ?? []) as Member[];
}

export async function fetchMemberById(id: string): Promise<Member | null> {
  const sb = createAnonServerClient();
  const { data, error } = await sb
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`メンバーの取得に失敗しました: ${error.message}`);
  return (data as Member) ?? null;
}

/**
 * 勤怠入力画面に出す行: 指定メンバーの
 *   - 当該勤務日（workDate）の全記録
 *   - 退勤待ち（clock_out_at IS NULL）の全記録（勤務日を問わない）
 * を勤務日・出勤時刻順で返す。両条件に該当する行は 1 件だけ含まれる。
 */
export async function fetchInputRows(
  memberId: string,
  workDate: string,
): Promise<Attendance[]> {
  const sb = createAnonServerClient();
  const { data, error } = await sb
    .from("attendance")
    .select("*")
    .eq("member_id", memberId)
    .or(`work_date.eq.${workDate},clock_out_at.is.null`)
    .order("work_date", { ascending: true })
    .order("clock_in_at", { ascending: true });
  if (error) throw new Error(`勤怠の取得に失敗しました: ${error.message}`);
  return (data ?? []) as Attendance[];
}

/**
 * 勤怠一覧・Excel 用。勤務日が [from, to] の範囲にある勤怠を、メンバー情報を
 * 結合して取得する。並び順は 勤務日 → メンバーの表示順 → 出勤時刻。
 * memberId を渡すとそのメンバーに絞り込む（アーカイブ済みも表示対象）。
 */
export async function fetchAttendanceRange(params: {
  from: string;
  to: string;
  memberId?: string | null;
}): Promise<AttendanceWithMember[]> {
  const sb = createAnonServerClient();
  let query = sb
    .from("attendance")
    .select("*, member:members!inner(id, name, sort_order)")
    .gte("work_date", params.from)
    .lte("work_date", params.to);
  if (params.memberId) query = query.eq("member_id", params.memberId);

  const { data, error } = await query;
  if (error) throw new Error(`勤怠の取得に失敗しました: ${error.message}`);

  const rows = (data ?? []) as unknown as AttendanceWithMember[];
  rows.sort((a, b) => {
    if (a.work_date !== b.work_date) return a.work_date < b.work_date ? -1 : 1;
    if (a.member.sort_order !== b.member.sort_order) {
      return a.member.sort_order - b.member.sort_order;
    }
    if (a.member.name !== b.member.name) {
      return a.member.name < b.member.name ? -1 : 1;
    }
    return a.clock_in_at < b.clock_in_at
      ? -1
      : a.clock_in_at > b.clock_in_at
        ? 1
        : 0;
  });
  return rows;
}

export async function fetchAttendanceById(id: string): Promise<Attendance | null> {
  const sb = createAnonServerClient();
  const { data, error } = await sb
    .from("attendance")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`勤怠の取得に失敗しました: ${error.message}`);
  return (data as Attendance) ?? null;
}
