"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { Member } from "@/lib/types";

const STORAGE_KEY = "kintai.selectedMember";

export function MemberSelect({
  members,
  selectedId,
}: {
  members: Member[];
  selectedId: string | null;
}) {
  const router = useRouter();

  // 未選択なら、前回選んだメンバーを復元する（存在する場合のみ）。
  useEffect(() => {
    if (selectedId) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored && members.some((m) => m.id === stored)) {
      router.replace(`/attendance?member=${encodeURIComponent(stored)}`);
    }
  }, [selectedId, members, router]);

  function onChange(id: string) {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* localStorage 不可でも動作は継続 */
    }
    router.push(id ? `/attendance?member=${encodeURIComponent(id)}` : "/attendance");
  }

  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      名前
      <select
        value={selectedId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-zinc-900"
      >
        <option value="">— 選択してください —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}
