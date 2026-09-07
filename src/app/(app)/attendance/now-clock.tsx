"use client";

import { formatClockStamp } from "@/lib/time";
import { useNow } from "@/lib/use-now";

/** 打刻の目安になる現在日時。1 秒ごとに更新する。 */
export function NowClock() {
  const now = useNow();
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-zinc-500">現在時刻</span>
      <span
        suppressHydrationWarning
        className="text-base font-semibold tabular-nums text-zinc-800 dark:text-zinc-100"
      >
        {formatClockStamp(now)}
      </span>
    </div>
  );
}
