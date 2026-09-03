"use client";

import { useActionState, useMemo, useState } from "react";

import {
  dateTimeInputToIso,
  nowDateTimeInput,
  resolveWorkDate,
  weekdayJa,
} from "@/lib/time";

import { clockInAction, type ActionState } from "./actions";

const INITIAL: ActionState = { ok: false, error: null };

export function ClockInForm({
  memberId,
  memberName,
  todayWorkDate,
}: {
  memberId: string;
  memberName: string;
  todayWorkDate: string;
}) {
  const [open, setOpen] = useState(false);
  // 開くたびに現在時刻でプリフィルし直すための key。
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(clockInAction, INITIAL);
  const [handled, setHandled] = useState<ActionState | null>(null);

  // 保存成功時にフォームを閉じる（成功状態ごとに 1 回だけ）。
  if (state.ok && state !== handled) {
    setHandled(state);
    setOpen(false);
    setFormKey((k) => k + 1);
  }

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setFormKey((k) => k + 1);
            setOpen(true);
          }}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          出勤
        </button>
        <p className="mt-1 text-xs text-zinc-500">{memberName} として記録します。</p>
      </div>
    );
  }

  return (
    <ClockInFields
      key={formKey}
      memberId={memberId}
      todayWorkDate={todayWorkDate}
      formAction={formAction}
      pending={pending}
      error={state.error}
      onCancel={() => setOpen(false)}
    />
  );
}

function ClockInFields({
  memberId,
  todayWorkDate,
  formAction,
  pending,
  error,
  onCancel,
}: {
  memberId: string;
  todayWorkDate: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
}) {
  const now = useMemo(() => nowDateTimeInput(), []);
  const [inDate, setInDate] = useState(now.date);
  const [inTime, setInTime] = useState(now.time);
  // null = 自動（出勤時刻から算出）、文字列 = 手動指定。
  const [manualWorkDate, setManualWorkDate] = useState<string | null>(null);

  const autoWorkDate = useMemo(() => {
    const iso = dateTimeInputToIso(inDate, inTime);
    return iso ? resolveWorkDate(iso) : todayWorkDate;
  }, [inDate, inTime, todayWorkDate]);
  const workDate = manualWorkDate ?? autoWorkDate;
  const wdAuto = manualWorkDate === null;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-emerald-600/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20"
    >
      <p className="text-sm font-semibold">出勤の記録</p>
      <input type="hidden" name="memberId" value={memberId} />

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
              className="text-xs text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              自動に戻す
            </button>
          )}
        </span>
        <span className="text-xs font-normal text-zinc-500">
          深夜 4:00 より前の出勤は前日の勤務日になります。
        </span>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium">
        備考（任意）
        <input
          type="text"
          name="note"
          maxLength={500}
          className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
