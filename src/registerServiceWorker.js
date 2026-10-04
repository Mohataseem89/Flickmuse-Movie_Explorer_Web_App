export function registerServiceWorker() {
  if (
    !("serviceWorker" in navigator) ||
    import.meta.env.DEV
  ) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
      })
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.warn(
          "Service worker registration failed:",
          error
        );
      });
  });
}