import Link from "next/link";
import type { Metadata } from "next";

import { fetchAllMembers, fetchAttendanceRange } from "@/lib/attendance";
import { describeListRow } from "@/lib/attendance-view";
import {
  currentMonthRange,
  formatTotalDuration,
  isWorkDateString,
  workedMinutes,
} from "@/lib/time";

import { AttendanceTable } from "./attendance-table";

export const metadata: Metadata = { title: "勤怠一覧 | 勤怠管理" };

export default async function ListPage(props: PageProps<"/list">) {
  const sp = await props.searchParams;
  const def = currentMonthRange();
  const from =
    typeof sp.from === "string" && isWorkDateString(sp.from) ? sp.from : def.from;
  const to =
    typeof sp.to === "string" && isWorkDateString(sp.to) ? sp.to : def.to;
  const memberId =
    typeof sp.member === "string" && sp.member.length > 0 ? sp.member : null;

  const [members, rows] = await Promise.all([
    fetchAllMembers(),
    fetchAttendanceRange({ from, to, memberId }),
  ]);
  const views = rows.map(describeListRow);
  const totalMinutes = rows.reduce(
    (sum, r) => sum + (workedMinutes(r.clock_in_at, r.clock_out_at) ?? 0),
    0,
  );
  const hasOpen = rows.some((r) => r.clock_out_at == null);

  const exportParams = new URLSearchParams({ from, to });
  if (memberId) exportParams.set("member", memberId);
  const exportHref = `/api/export?${exportParams.toString()}`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold tracking-tight">勤怠一覧</h1>
        <Link
          href="/attendance"
          className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          勤怠入力へ
        </Link>
      </header>

      <form
        method="GET"
        action="/list"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15"
      >
        <label className="flex flex-col gap-1 text-xs font-medium">
          期間（勤務日）from
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          to
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          名前
          <select
            name="member"
            defaultValue={memberId ?? ""}
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
          >
            <option value="">全員</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.active ? "" : "（アーカイブ）"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          表示
        </button>
        <Link
          href="/list"
          className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20"
        >
          当月に戻す
        </Link>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          {from} 〜 {to}
          {memberId
            ? `／${members.find((m) => m.id === memberId)?.name ?? "不明なメンバー"}`
            : "／全員"}
          （{rows.length} 件）
        </span>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            実働 合計 <strong>{formatTotalDuration(totalMinutes)}</strong>
            {hasOpen && (
              <span className="ml-1 text-xs text-amber-600 dark:text-amber-500">
                ※ 退勤待ちを除く
              </span>
            )}
          </span>
          <a
            href={exportHref}
            className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
          >
            Excel ダウンロード
          </a>
        </div>
      </div>

      <AttendanceTable rows={views} />
    </main>
  );
}
