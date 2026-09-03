"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/attendance", label: "勤怠入力" },
  { href: "/list", label: "勤怠一覧" },
  { href: "/members", label: "名前の管理" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
        <Link href="/" className="mr-2 font-bold tracking-tight">
          勤怠管理
        </Link>
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-md bg-black/[.06] px-2.5 py-1.5 text-sm font-medium dark:bg-white/[.12]"
                  : "rounded-md px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-black/[.03] dark:text-zinc-400 dark:hover:bg-white/[.06]"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
