import { useCallback, useEffect, useMemo, useState } from "react";

const DISMISS_KEY = "flickmuse:pwa-install-dismissed-at";
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

function isIosSafari() {
  const ua = window.navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isWebKit = /WebKit/i.test(ua);
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua);
  return isIos && isWebKit && !isOtherIosBrowser;
}

function canRemind() {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
    return !dismissedAt || Date.now() - dismissedAt >= REMIND_AFTER_MS;
  } catch {
    return true;
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [iosInstructionsOpen, setIosInstructionsOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => !canRemind());
  const iosSafari = useMemo(() => isIosSafari(), []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setIosInstructionsOpen(false);
    };
    const displayMode = window.matchMedia?.("(display-mode: standalone)");
    const handleDisplayMode = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    displayMode?.addEventListener?.("change", handleDisplayMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      displayMode?.removeEventListener?.("change", handleDisplayMode);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage is optional; dismissal still applies for this page session.
    }
  }, []);

  const install = useCallback(async () => {
    if (installed) return "installed";

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") setDeferredPrompt(null);
      return choice?.outcome || "dismissed";
    }

    if (iosSafari) {
      setIosInstructionsOpen(true);
      return "instructions";
    }

    return "unavailable";
  }, [deferredPrompt, installed, iosSafari]);

  const installAvailable = !installed && Boolean(deferredPrompt || iosSafari);
  const showBanner = installAvailable && !bannerDismissed;

  return {
    installed,
    installAvailable,
    showBanner,
    iosSafari,
    iosInstructionsOpen,
    install,
    dismissBanner,
    closeIosInstructions: () => setIosInstructionsOpen(false),
  };
}
