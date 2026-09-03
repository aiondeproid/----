"use client";

import { useActionState, useState } from "react";

import {
  deleteAttendanceAction,
  updateAttendanceAction,
  type ActionState,
} from "@/app/attendance/actions";
import { EditFields } from "@/app/attendance/edit-fields";
import type { ListRowView } from "@/lib/attendance-view";

const INITIAL: ActionState = { ok: false, error: null };

const COLS = 8;

export function AttendanceTable({ rows }: { rows: ListRowView[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-black/15 px-4 py-10 text-center text-sm text-zinc-500 dark:border-white/20">
        この期間の記録はありません。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/10 bg-black/[.03] text-left dark:border-white/15 dark:bg-white/[.04]">
            <th className="px-3 py-2 font-semibold">日付</th>
            <th className="px-3 py-2 font-semibold">曜日</th>
            <th className="px-3 py-2 font-semibold">名前</th>
            <th className="px-3 py-2 font-semibold">出勤</th>
            <th className="px-3 py-2 font-semibold">退勤</th>
            <th className="px-3 py-2 font-semibold">実働</th>
            <th className="px-3 py-2 font-semibold">備考</th>
            <th className="px-3 py-2 font-semibold">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TableRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ row }: { row: ListRowView }) {
  const [editing, setEditing] = useState(false);
  const [editState, editAction, editPending] = useActionState(
    updateAttendanceAction,
    INITIAL,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteAttendanceAction,
    INITIAL,
  );

  const [handled, setHandled] = useState<ActionState | null>(null);
  if (editState.ok && editState !== handled) {
    setHandled(editState);
    setEditing(false);
  }

  return (
    <>
      <tr className="border-b border-black/5 align-top dark:border-white/10">
        <td className="px-3 py-2 tabular-nums">{row.workDate}</td>
        <td className="px-3 py-2">{row.weekday}</td>
        <td className="px-3 py-2">{row.memberName}</td>
        <td className="px-3 py-2 tabular-nums">{row.inClock}</td>
        <td className="px-3 py-2 tabular-nums">
          {row.isOpen ? (
            <span className="text-amber-600 dark:text-amber-500">--:--</span>
          ) : (
            row.outClock
          )}
        </td>
        <td className="px-3 py-2 tabular-nums">{row.worked}</td>
        <td className="px-3 py-2 whitespace-pre-wrap break-words">{row.note}</td>
        <td className="px-3 py-2">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20"
            >
              {editing ? "閉じる" : "編集"}
            </button>
            <form
              action={delAction}
              onSubmit={(e) => {
                if (
                  !confirm(
                    `${row.memberName} / ${row.workDate} の記録を削除します。よろしいですか？`,
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                disabled={delPending}
                className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                {delPending ? "削除中…" : "削除"}
              </button>
            </form>
          </div>
        </td>
      </tr>

      {(editing || delState.error) && (
        <tr className="border-b border-black/5 dark:border-white/10">
          <td colSpan={COLS} className="px-3 pb-3">
            {delState.error && (
              <p role="alert" className="pt-2 text-xs text-red-600 dark:text-red-400">
                {delState.error}
              </p>
            )}
            {editing && (
              <EditFields
                row={row}
                action={editAction}
                pending={editPending}
                error={editState.error}
                onCancel={() => setEditing(false)}
              />
            )}
          </td>
        </tr>
      )}
    </>
  );
}
