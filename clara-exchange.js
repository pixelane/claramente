(function(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ClaraExchange = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function() {
  function bytesToBase64Url(bytes) {
    let binary = "";
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(value) {
    const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function toList(state) {
    const source = state && typeof state === "object" ? state : {};
    return {
      kind: "list",
      billId: typeof source.billId === "string" ? source.billId : "",
      people: (Array.isArray(source.people) ? source.people : []).map((person) => ({
        id: person.id,
        name: person.name
      })),
      items: (Array.isArray(source.items) ? source.items : []).map((item) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        amountCents: item.amountCents
      })),
      updatedAt: Number.isInteger(source.updatedAt) ? source.updatedAt : 0
    };
  }

  function assertList(payload) {
    if (!payload || payload.kind !== "list" || typeof payload.billId !== "string" || !payload.billId) {
      throw new Error("INVALID_LIST");
    }
    if ("expenses" in payload || "claims" in payload || "paidById" in payload) throw new Error("FULL_ACCOUNT");
    if (!Array.isArray(payload.people) || !Array.isArray(payload.items)) throw new Error("INVALID_LIST");
    payload.items.forEach((item) => {
      if (!item || typeof item.id !== "string" || !Number.isInteger(item.amountCents) || item.amountCents <= 0) {
        throw new Error("INVALID_LIST");
      }
    });
  }

  function assertPart(payload) {
    if (!payload || payload.kind !== "part" || typeof payload.billId !== "string" || typeof payload.personId !== "string") {
      throw new Error("INVALID_PART");
    }
    if ("items" in payload || "expenses" in payload || "people" in payload || "amountCents" in payload) {
      throw new Error("FULL_ACCOUNT");
    }
    if (!Array.isArray(payload.ate) || payload.ate.some((id) => typeof id !== "string")) throw new Error("INVALID_PART");
  }

  async function seal(prefix, payload) {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      new TextEncoder().encode(JSON.stringify(payload))
    );
    return `${prefix}:${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(cipher))}:${bytesToBase64Url(keyBytes)}`;
  }

  async function openCode(raw) {
    const code = String(raw || "").trim();
    const splitAt = code.indexOf(":");
    const prefix = splitAt === -1 ? "" : code.slice(0, splitAt);
    const body = splitAt === -1 ? "" : code.slice(splitAt + 1);
    if (prefix !== "list1" && prefix !== "part1") throw new Error("UNKNOWN_CODE");
    const [cipherText, keyText] = body.split(":");
    const [ivText, dataText] = String(cipherText || "").split(".");
    if (!ivText || !dataText || !keyText) throw new Error("INVALID_CODE");
    const cryptoKey = await crypto.subtle.importKey("raw", base64UrlToBytes(keyText), "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(ivText) },
      cryptoKey,
      base64UrlToBytes(dataText)
    );
    const payload = JSON.parse(new TextDecoder().decode(plain));
    if (prefix === "list1") assertList(payload);
    if (prefix === "part1") assertPart(payload);
    return payload;
  }

  function applyPart(state, part) {
    assertPart(part);
    if (!state || part.billId !== state.billId) return { ok: false, reason: "bill" };
    if (!(Array.isArray(state.people) ? state.people : []).some((person) => person.id === part.personId)) {
      return { ok: false, reason: "person" };
    }
    const itemIds = new Set((state.items || []).map((item) => item.id));
    const ate = part.ate.filter((id) => itemIds.has(id));
    const claims = { ...(state.claims || {}), [part.personId]: ate };
    const items = (state.items || []).map((item) => {
      if (item.type === "shared") return item;
      if (item.type === "product") {
        const eatenBy = (item.eatenBy || []).filter((id) => id !== part.personId);
        if (ate.includes(item.id)) eatenBy.push(part.personId);
        return { ...item, eatenBy };
      }
      if (item.type === "single" && ate.includes(item.id) && (!item.ownerId || item.ownerId === part.personId)) {
        return { ...item, ownerId: part.personId };
      }
      return item;
    });
    return {
      ok: true,
      state: { ...state, claims, items, updatedAt: Date.now() }
    };
  }

  function rectify(state) {
    const issues = [];
    const claims = state && state.claims && typeof state.claims === "object" ? state.claims : {};
    (state && state.people || []).forEach((person) => {
      if (!Object.prototype.hasOwnProperty.call(claims, person.id)) {
        issues.push({ type: "missing", personId: person.id });
      }
    });
    (state && state.items || []).forEach((item) => {
      if (item.type === "product" && (!item.eatenBy || item.eatenBy.length === 0)) {
        issues.push({ type: "unclaimed", itemId: item.id });
      }
      if (item.type !== "single") return;
      const claimers = Object.entries(claims)
        .filter(([, ate]) => Array.isArray(ate) && ate.includes(item.id))
        .map(([personId]) => personId);
      if (claimers.length > 1) issues.push({ type: "two-owners", itemId: item.id, personIds: claimers });
      if (item.ownerId && Array.isArray(claims[item.ownerId]) && !claims[item.ownerId].includes(item.id)) {
        issues.push({ type: "released", itemId: item.id, personId: item.ownerId });
      }
    });
    return issues;
  }

  return { toList, seal, openCode, applyPart, rectify };
});
