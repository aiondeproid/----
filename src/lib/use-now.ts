"use client";

import { useEffect, useState } from "react";

/**
 * 一定間隔で更新される「現在時刻（エポック ms）」。
 *
 * SSR とハイドレーション直後はレンダー時点の値を返すため、これを表示する要素には
 * `suppressHydrationWarning` を付けること（マウント直後に interval で上書きされる）。
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
