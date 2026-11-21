import { Film } from "lucide-react";

export default function LoadError({
  error,
  onRetry,
  cooldownSeconds = 0,
  loading = false,
  title = "Movies could not be loaded",
  compact = false,
}) {
  const blocked = loading || cooldownSeconds > 0;
  const label = loading
    ? "Retrying…"
    : cooldownSeconds > 0
      ? "Try again in " + cooldownSeconds + "s"
      : "Try again";

  return (
    <div
      role="alert"
      className={
        "mx-auto max-w-lg rounded-3xl border border-red-500/20 bg-red-950/20 text-center " +
        (compact ? "p-6" : "p-8 sm:p-10")
      }
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <Film className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-400">
        {error?.message || "Something went wrong while loading movie data."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={blocked}
        className="mt-6 min-h-11 rounded-xl bg-red-600 px-5 font-bold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-900/60 disabled:text-white/70"
      >
        {label}
      </button>
    </div>
  );
}
