(function () {
  const CACHE_NAME = "clara-cache-v39";
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
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
