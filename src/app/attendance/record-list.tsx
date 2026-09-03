"use client";

import { useActionState, useMemo, useState } from "react";

import type { RowView } from "@/lib/attendance-view";
import {
  dateTimeInputToIso,
  nowDateTimeInput,
  resolveWorkDate,
  weekdayJa,
} from "@/lib/time";

import {
  clockOutAction,
  deleteAttendanceAction,
  updateAttendanceAction,
  type ActionState,
} from "./actions";

const INITIAL: ActionState = { ok: false, error: null };

export function RecordList({ rows }: { rows: RowView[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-black/15 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/20">
        まだ記録がありません。「出勤」から記録を追加してください。
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.id}>
          <RecordItem row={row} />
        </li>
      ))}
    </ul>
  );
}

type Mode = "view" | "clockout" | "edit";

function RecordItem({ row }: { row: RowView }) {
  const [mode, setMode] = useState<Mode>("view");

  const [outState, outAction, outPending] = useActionState(clockOutAction, INITIAL);
  const [editState, editAction, editPending] = useActionState(
    updateAttendanceAction,
    INITIAL,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteAttendanceAction,
    INITIAL,
  );

  // 退勤・編集が成功したら表示モードへ戻す（成功状態ごとに 1 回だけ）。
  const [handled, setHandled] = useState<ActionState | null>(null);
  if (outState.ok && outState !== handled) {
    setHandled(outState);
    setMode("view");
  } else if (editState.ok && editState !== handled) {
    setHandled(editState);
    setMode("view");
  }

  return (
    <div className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-medium tabular-nums">
          {row.workDate}（{row.weekday}）
        </span>
        <span className="tabular-nums">
          {row.inClock}
          <span className="mx-1 text-zinc-400">〜</span>
          {row.isOpen ? (
            <span className="text-amber-600 dark:text-amber-500">退勤待ち</span>
          ) : (
            row.outClock
          )}
        </span>
        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
          実働 {row.worked}
        </span>
        {row.note && (
          <span className="text-zinc-500" title={row.note}>
            📝 {row.note}
          </span>
        )}
      </div>

      {mode === "view" && (
        <div className="mt-2 flex flex-wrap gap-2">
          {row.isOpen && (
            <button
              type="button"
              onClick={() => setMode("clockout")}
              className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
            >
              退勤
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="rounded-md border border-black/15 px-3 py-1.5 text-xs dark:border-white/20"
          >
            編集
          </button>
          <form
            action={delAction}
            onSubmit={(e) => {
              if (!confirm("この記録を削除します。よろしいですか？")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={row.id} />
            <button
              type="submit"
              disabled={delPending}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              {delPending ? "削除中…" : "削除"}
            </button>
          </form>
        </div>
      )}

      {delState.error && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {delState.error}
        </p>
      )}

      {mode === "clockout" && (
        <ClockOutFields
          rowId={row.id}
          action={outAction}
          pending={outPending}
          error={outState.error}
          onCancel={() => setMode("view")}
        />
      )}

      {mode === "edit" && (
        <EditFields
          row={row}
          action={editAction}
          pending={editPending}
          error={editState.error}
          onCancel={() => setMode("view")}
        />
      )}
    </div>
  );
}

function ClockOutFields({
  rowId,
  action,
  pending,
  error,
  onCancel,
}: {
  rowId: string;
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
}) {
  const now = useMemo(() => nowDateTimeInput(), []);
  return (
    <form action={action} className="mt-3 flex flex-col gap-2 border-t border-black/10 pt-3 dark:border-white/15">
      <input type="hidden" name="id" value={rowId} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium">
          退勤日
          <input
            type="date"
            name="outDate"
            defaultValue={now.date}
            required
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          退勤時刻
          <input
            type="time"
            name="outTime"
            defaultValue={now.time}
            required
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {pending ? "保存中…" : "退勤を保存"}
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

function EditFields({
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
