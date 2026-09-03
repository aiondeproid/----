import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import {
  GATE_COOKIE,
  isGateConfigured,
  safeNextPath,
  verifyGateToken,
} from "@/lib/gate";

import { GateForm } from "./gate-form";

export const metadata: Metadata = {
  title: "合言葉 | 勤怠管理",
};

export default async function GatePage(props: PageProps<"/gate">) {
  const { next } = await props.searchParams;
  const safeNext = safeNextPath(typeof next === "string" ? next : undefined) ?? "/";

  const store = await cookies();
  if (verifyGateToken(store.get(GATE_COOKIE)?.value)) {
    redirect(safeNext);
  }

  const configured = isGateConfigured();

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xs">
        <h1 className="text-xl font-bold tracking-tight">勤怠管理</h1>
        <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          このサイトは合言葉で保護されています。
        </p>

        {configured ? (
          <GateForm next={safeNext} />
        ) : (
          <p
            role="alert"
            className="text-sm leading-relaxed text-red-600 dark:text-red-400"
          >
            サーバー側で <code className="font-mono">SITE_PASSCODE</code>{" "}
            が設定されていません。環境変数を確認してください。
          </p>
        )}
      </div>
    </main>
  );
}
