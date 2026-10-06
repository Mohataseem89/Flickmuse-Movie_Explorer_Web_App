import { Download, Share, SquarePlus, X } from "lucide-react";

export default function InstallAppPrompt({
  showBanner,
  iosInstructionsOpen,
  onInstall,
  onDismiss,
  onCloseInstructions,
}) {
  return (
    <>
      {showBanner && (
        <aside
          className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-md rounded-2xl border border-white/10 bg-[#11151c]/95 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur-xl sm:left-auto sm:right-6 sm:w-[390px]"
          aria-label="Install FlickMuse"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss install suggestion"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex gap-3 pr-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600">
              <Download className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-black">Install FlickMuse</p>
              <p className="mt-1 text-sm leading-5 text-gray-400">
                Add FlickMuse to your device for quicker, app-like access.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onInstall}
              className="min-h-11 flex-1 rounded-xl bg-red-600 px-4 text-sm font-bold transition hover:bg-red-500"
            >
              Install App
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-11 rounded-xl px-4 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Not now
            </button>
          </div>
        </aside>
      )}

      {iosInstructionsOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCloseInstructions();
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#11151c] p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">iPhone & iPad</p>
                <h2 id="ios-install-title" className="mt-2 text-2xl font-black">Add FlickMuse to Home Screen</h2>
              </div>
              <button type="button" onClick={onCloseInstructions} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Close install instructions">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-6 space-y-4 text-sm leading-6 text-gray-300">
              <li className="flex gap-3"><Share className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" /><span>Tap the <strong className="text-white">Share</strong> button in Safari.</span></li>
              <li className="flex gap-3"><SquarePlus className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" /><span>Choose <strong className="text-white">Add to Home Screen</strong>.</span></li>
              <li className="flex gap-3"><Download className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" /><span>Tap <strong className="text-white">Add</strong>. FlickMuse will then open from your Home Screen like an app.</span></li>
            </ol>
            <button type="button" onClick={onCloseInstructions} className="mt-6 min-h-11 w-full rounded-xl bg-red-600 px-4 font-bold hover:bg-red-500">Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
