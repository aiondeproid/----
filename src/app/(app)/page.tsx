import Link from "next/link";

const links = [
  { href: "/attendance", label: "勤怠入力", description: "出勤・退勤を記録する" },
  {
    href: "/list",
    label: "勤怠一覧",
    description: "期間・名前で絞り込み、編集・Excel 書き出し",
  },
  {
    href: "/members",
    label: "名前の管理",
    description: "メンバーの追加・並び替え・取り込み（管理用合言葉）",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">勤怠管理</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          出退勤の記録と、期間を指定した Excel 書き出し。
        </p>
      </header>

      <nav className="grid gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-black/10 px-4 py-3 transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.05]"
          >
            <span className="block font-medium">{link.label}</span>
            <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">
              {link.description}
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
