export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    // The browser performs normal SW update checks on navigation. Calling
    // registration.update() immediately after register() creates a redundant
    // concurrent fetch of /sw.js (which can fail in Lighthouse/throttled runs).
    navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).catch((error) => {
      // Registration is an optional enhancement; a failed update must not
      // prevent the normal web application from working.
      if (import.meta.env.DEV) console.warn("Service worker registration failed:", error);
    });
  }, { once: true });
}
