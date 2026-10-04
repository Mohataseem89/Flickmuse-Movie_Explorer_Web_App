import { Component } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;
const RECOVERY_KEY = "flickmuse:chunk-recovery";
const RECOVERY_COOLDOWN_MS = 60_000;

async function recoverFromStaleChunk() {
  const now = Date.now();
  const previousAttempt = Number(sessionStorage.getItem(RECOVERY_KEY) || 0);

  // A deployment can invalidate a chunk referenced by an already-open tab.
  // Reload once to pick up the new index/chunk manifest, but never loop.
  if (now - previousAttempt < RECOVERY_COOLDOWN_MS) {
    return false;
  }

  sessionStorage.setItem(RECOVERY_KEY, String(now));

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("flickmuse-") && key.endsWith("-shell"))
          .map((key) => caches.delete(key))
      );
    }

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration("/");
      await registration?.update();
    }
  } catch (error) {
    console.warn("FlickMuse chunk recovery cleanup failed:", error);
  }

  window.location.reload();
  return true;
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, recovering: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, details) {
    console.error("FlickMuse encountered an unexpected error:", error, details);

    if (CHUNK_ERROR_RE.test(error?.message || String(error))) {
      this.setState({ recovering: true });
      recoverFromStaleChunk().then((reloading) => {
        if (!reloading) {
          this.setState({ recovering: false });
        }
      });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0f] px-5 py-20 text-center text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-[#11151c] p-8 sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl font-black tracking-[-0.04em]">
            {this.state.recovering
              ? "Updating FlickMuse"
              : "FlickMuse hit an unexpected problem"}
          </h1>
          <p className="mt-4 leading-7 text-gray-400">
            {this.state.recovering
              ? "A newer version was deployed. Refreshing once to load the latest application files…"
              : "Your watchlist remains saved. Reload the application or return to the homepage to continue."}
          </p>
          {!this.state.recovering && (
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 font-bold hover:bg-red-500"
              >
                <RefreshCw className="h-5 w-5" aria-hidden="true" />
                Reload application
              </button>
              <a
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 font-bold hover:bg-white/10"
              >
                <Home className="h-5 w-5" aria-hidden="true" />
                Return home
              </a>
            </div>
          )}
        </div>
      </main>
    );
  }
}
