(function () {
  const CACHE_NAME = "clara-cache-v50";
  if (!("serviceWorker" in navigator)) return;

  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    try {
      if (sessionStorage.getItem("clara.swReloaded") === CACHE_NAME) return;
      sessionStorage.setItem("clara.swReloaded", CACHE_NAME);
    } catch (error) {
      return;
    }
    window.location.reload();
  });

  navigator.serviceWorker.register("sw.js", {
    scope: "./",
    updateViaCache: "none"
  }).catch(() => {});
})();
