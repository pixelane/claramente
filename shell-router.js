(function(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ClaramenteShellRouter = api;
  root.ClaraShellRouter = api;
  if (typeof window !== "undefined") {
    api.routeCurrentWindow(window);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  const MOBILE_MAX_WIDTH = 719;

  function getShellRedirect(locationLike) {
    const pathname = locationLike.pathname || "";
    const search = locationLike.search || "";
    const hash = locationLike.hash || "";
    const width = Number(locationLike.width) || 0;
    const page = pathname.split("/").pop() || "index.html";
    const params = new URLSearchParams(search.replace(/^\?/, ""));
    const forcedShell = params.get("shell");

    if (["claramente-full", "clara", "claramente"].includes(forcedShell)) return "";
    if (params.get("prueba") === "qr" || hash.startsWith("#list1:") || hash.startsWith("#part1:") || hash.startsWith("#qr1:")) {
      return page === "claramente.html" ? "" : "claramente.html";
    }
    if (hash && page === "index.html") return "";
    if (page === "index.html" && width > 0 && width <= MOBILE_MAX_WIDTH) return "claramente.html";
    if (page === "claramente.html" && width > MOBILE_MAX_WIDTH) return "index.html";
    return "";
  }

  function routeCurrentWindow(targetWindow) {
    const destination = getShellRedirect({
      pathname: targetWindow.location.pathname,
      search: targetWindow.location.search,
      hash: targetWindow.location.hash,
      width: targetWindow.innerWidth
    });
    if (!destination) return;
    targetWindow.location.replace(destination + targetWindow.location.search + targetWindow.location.hash);
  }

  return {
    getShellRedirect,
    routeCurrentWindow
  };
});
