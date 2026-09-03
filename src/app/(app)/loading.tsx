export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 py-10 text-sm text-zinc-500 sm:px-6"
      role="status"
      aria-live="polite"
    >
      読み込み中…
    </div>
  );
}
