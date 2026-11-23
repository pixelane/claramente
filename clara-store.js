(function(root, factory) {
  const core = (typeof require === "function" && typeof module !== "undefined" && module.exports)
    ? require("./clara-core.js")
    : root.ClaraCore;
  const api = factory(core);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ClaraStore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(core) {
  const GUIDED_KEY = "claramente.flow.v1";
  const CANONICAL_KEY = "clara.state.v1";

  function readJson(storage, key) {
    if (!storage) return null;
    try {
      const raw = storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveGuided(storage, state) {
    const normalized = core.normalizeClaramenteState(state);
    storage.setItem(GUIDED_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function loadGuided(storage) {
    const parsed = readJson(storage, GUIDED_KEY);
    if (!parsed) return null;
    const normalized = core.normalizeClaramenteState(parsed);
    if (!normalized.people.length && !normalized.items.length) return null;
    return normalized;
  }

  function loadCanonicalAsGuided(storage) {
    const parsed = readJson(storage, CANONICAL_KEY);
    if (!parsed || !Array.isArray(parsed.people) || !Array.isArray(parsed.expenses)) return null;
    const guided = core.claraStateToClaramente(parsed);
    if (!guided.people.length) return null;
    return guided;
  }

  return {
    GUIDED_KEY,
    CANONICAL_KEY,
    saveGuided,
    loadGuided,
    loadCanonicalAsGuided
  };
});
