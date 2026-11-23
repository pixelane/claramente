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

  function hasText(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function canonicalIsRich(canonical) {
    if (!canonical || typeof canonical !== "object") return false;
    const people = Array.isArray(canonical.people) ? canonical.people : [];
    if (people.some((person) => person && hasText(person.reminder))) return true;
    const tableClose = canonical.tableClose;
    return Boolean(tableClose && typeof tableClose === "object" && !Array.isArray(tableClose) && Object.keys(tableClose).length);
  }

  function syncDecision(storage, guided) {
    const existing = readJson(storage, CANONICAL_KEY);
    const normalized = core.normalizeClaramenteState(guided || {});
    if (!existing) return { action: "write", reason: "missing" };
    if (!normalized.people.length && !normalized.items.length) return { action: "keep", reason: "empty" };
    if (canonicalIsRich(existing)) return { action: "keep", reason: "rich" };
    const canonicalAt = Number.isInteger(existing.updatedAt) ? existing.updatedAt : 0;
    if (canonicalAt > normalized.updatedAt) return { action: "keep", reason: "newer" };
    return { action: "write", reason: "guided" };
  }

  function syncCanonicalFromGuided(storage, guided) {
    const decision = syncDecision(storage, guided);
    if (decision.action !== "write") return decision;
    const normalized = core.normalizeClaramenteState(guided);
    const existing = readJson(storage, CANONICAL_KEY);
    const projected = core.claramenteToClaraState(normalized);
    if (existing && typeof existing === "object") {
      if (typeof existing.groupName === "string") projected.groupName = existing.groupName;
      if (typeof existing.currency === "string") projected.currency = existing.currency;
    }
    projected.updatedAt = normalized.updatedAt;
    storage.setItem(CANONICAL_KEY, JSON.stringify(core.normalizeCanonicalState(projected)));
    return decision;
  }

  return {
    GUIDED_KEY,
    CANONICAL_KEY,
    saveGuided,
    loadGuided,
    loadCanonicalAsGuided,
    syncDecision,
    syncCanonicalFromGuided
  };
});
