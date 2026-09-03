import "server-only";

import { createAnonServerClient } from "./supabase/server";
import type { Attendance, Member } from "./types";

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
