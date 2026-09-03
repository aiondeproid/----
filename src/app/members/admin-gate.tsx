"use client";

import { useActionState } from "react";

import { unlockAdminAction, type ActionState } from "./actions";

const INITIAL: ActionState = { ok: false, error: null };

export function AdminGate({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(unlockAdminAction, INITIAL);

  if (!configured) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
      >
        サーバー側で <code className="font-mono">ADMIN_PASSCODE</code>{" "}
        が設定されていません。環境変数を確認してください。
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-xs flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        この画面の操作には管理用の合言葉が必要です。
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        管理用合言葉
        <input
          name="passcode"
          type="password"
          autoComplete="off"
          autoFocus
          required
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-zinc-900"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "確認中…" : "ロックを解除"}
      </button>
    </form>
  );
}
