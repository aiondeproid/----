import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { ADMIN_COOKIE, isAdminConfigured, verifyAdminToken } from "@/lib/admin";
import { fetchAllMembers } from "@/lib/attendance";

import { AdminGate } from "./admin-gate";
import { MemberAdmin } from "./member-admin";

export const metadata: Metadata = { title: "名前の管理 | 勤怠管理" };

export default async function MembersPage() {
  const store = await cookies();
  const unlocked = verifyAdminToken(store.get(ADMIN_COOKIE)?.value);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold tracking-tight">名前の管理</h1>
        <Link
          href="/attendance"
          className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          勤怠入力へ
        </Link>
      </header>

      {unlocked ? (
        <MemberAdmin members={await fetchAllMembers()} />
      ) : (
        <AdminGate configured={isAdminConfigured()} />
      )}
    </main>
  );
}
