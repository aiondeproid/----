"use client";

import { useMemo, useState } from "react";

import type { RowView } from "@/lib/attendance-view";
import { dateTimeInputToIso, resolveWorkDate, weekdayJa } from "@/lib/time";

/**
 * 勤怠 1 行の編集フォーム。勤務日・出勤・退勤（クリア可）・備考を編集する。
 * 勤怠入力画面と勤怠一覧画面の両方から使う。送信先は
 * `updateAttendanceAction`（呼び出し側が `action` として渡す）。
 */
export function EditFields({
  row,
  action,
  pending,
  error,
  onCancel,
}: {
  row: RowView;
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
}) {
  const [inDate, setInDate] = useState(row.inInput.date);
  const [inTime, setInTime] = useState(row.inInput.time);
  // null 以外 = 手動指定。編集時は既存の勤務日を初期値にする。
  const [manualWorkDate, setManualWorkDate] = useState<string | null>(
    row.workDate,
  );
  const [clearOut, setClearOut] = useState(row.outInput == null);

  const autoWorkDate = useMemo(() => {
    const iso = dateTimeInputToIso(inDate, inTime);
    return iso ? resolveWorkDate(iso) : row.workDate;
  }, [inDate, inTime, row.workDate]);
  const workDate = manualWorkDate ?? autoWorkDate;
  const wdAuto = manualWorkDate === null;

  return (
    <form
      action={action}
      className="mt-3 flex flex-col gap-3 border-t border-black/10 pt-3 dark:border-white/15"
    >
      <input type="hidden" name="id" value={row.id} />

      <label className="flex flex-col gap-1 text-xs font-medium">
        <span>
          勤務日{" "}
          <span className="font-normal text-zinc-500">
            （{workDate && weekdayJa(workDate)}・{wdAuto ? "自動" : "手動"}）
          </span>
        </span>
        <span className="flex items-center gap-2">
          <input
            type="date"
            name="workDate"
            value={workDate}
            onChange={(e) => setManualWorkDate(e.target.value)}
            required
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
          {!wdAuto && (
            <button
              type="button"
              onClick={() => setManualWorkDate(null)}
              className="text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              出勤時刻から再計算
            </button>
          )}
        </span>
      </label>

      <fieldset className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium">
          出勤日
          <input
            type="date"
            name="inDate"
            value={inDate}
            onChange={(e) => setInDate(e.target.value)}
            required
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          出勤時刻
          <input
            type="time"
            name="inTime"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
            required
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </label>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            name="clearOut"
            checked={clearOut}
            onChange={(e) => setClearOut(e.target.checked)}
          />
          退勤待ちに戻す（退勤時刻を空にする）
        </label>

        {!clearOut && (
          <fieldset className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium">
              退勤日
              <input
                type="date"
                name="outDate"
                defaultValue={row.outInput?.date ?? inDate}
                className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              退勤時刻
              <input
                type="time"
                name="outTime"
                defaultValue={row.outInput?.time ?? ""}
                className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
              />
            </label>
          </fieldset>
        )}
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium">
        備考（任意）
        <input
          type="text"
          name="note"
          defaultValue={row.note}
          maxLength={500}
          className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
        />
      </label>

      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-black/15 px-3 py-1.5 text-xs dark:border-white/20"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
