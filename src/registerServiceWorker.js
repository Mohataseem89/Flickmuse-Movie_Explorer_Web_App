export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => {
        // Check every full page load so a new deployment's worker is picked up
        // promptly instead of relying on the browser's normal update interval.
        registration.update();
      })
      .catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
  });
}
