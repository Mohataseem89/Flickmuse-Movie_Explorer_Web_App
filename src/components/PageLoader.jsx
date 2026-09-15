export default function PageLoader() {
  return (
    <div
      className="flex min-h-[100svh] items-center justify-center bg-[#080a0f]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 text-gray-400">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
        <span className="text-sm font-semibold">Loading FlickMuse…</span>
      </div>
    </div>
  );
}
