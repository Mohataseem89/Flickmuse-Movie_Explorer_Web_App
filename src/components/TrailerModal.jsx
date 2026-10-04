import { Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function TrailerModal({ trailer, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!trailer) return;

    previousFocusRef.current = document.activeElement;

    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const key = (e) => {
      if (e.key === "Escape") {
        onClose();
      }

      if (e.key !== "Tab") return;

      const els = dialogRef.current?.querySelectorAll(
        'button, a[href], iframe, [tabindex]:not([tabindex="-1"])'
      );

      if (!els?.length) return;

      const first = els[0];
      const last = els[els.length - 1];

      if (
        e.shiftKey &&
        document.activeElement === first
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        document.activeElement === last
      ) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", key);

    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", key);
      previousFocusRef.current?.focus?.();
    };
  }, [trailer, onClose]);

  if (!trailer) return null;

  const title = trailer.name || "Official trailer";

  const thumb = `https://i.ytimg.com/vi/${trailer.key}/hqdefault.jpg`;

  return (
    <div
      className="trailer-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trailer-title"
        className="trailer-panel w-full max-w-5xl overflow-hidden rounded-2xl border border-flick-border bg-flick-bg shadow-2xl"
      >
        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-flick-border px-4 sm:px-5">
          <h2
            id="trailer-title"
            className="truncate font-bold text-white"
          >
            {title}
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-300 hover:bg-white/10 hover:text-white"
            aria-label="Close trailer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black">
          {playing ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 h-full w-full overflow-hidden text-white"
              aria-label={`Play ${title}`}
            >
              <img
                src={thumb}
                alt=""
                className="h-full w-full object-cover opacity-80"
                loading="lazy"
                decoding="async"
                width="480"
                height="360"
              />

              <span className="absolute inset-0 bg-black/20" />

              <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 shadow-xl transition-transform group-hover:scale-110">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}