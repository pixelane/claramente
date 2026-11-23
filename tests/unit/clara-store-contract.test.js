const assert = require("node:assert/strict");
const { calculateClaramenteSettlements, calculateSettlements } = require("../../clara-core.js");
const store = require("../../clara-store.js");
const accounts = require("../fixtures/accounts.json");

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    }
  };
}

function run() {
  const storage = memoryStorage();
  const saved = store.saveGuided(storage, {
    screen: "items",
    itemMode: "product",
    editing: { type: "item", id: "pizza" },
    people: [
      { id: "p_ana", name: "Ana", isGuest: false },
      { id: "p_luis", name: "Luis", isGuest: false }
    ],
    items: [
      { id: "pizza", type: "product", name: "Pizza", amountCents: 100, eatenBy: ["p_ana", "p_luis"] }
    ],
    paidMode: "single",
    paidById: "p_ana",
    paymentMethod: "cash",
    cardPayerId: ""
  });

  assert.equal(Object.prototype.hasOwnProperty.call(saved, "screen"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "editing"), false);
  assert.deepEqual(store.loadGuided(storage), saved);
  assert.equal(storage.getItem(store.CANONICAL_KEY), null);

  storage.setItem(store.GUIDED_KEY, "{");
  assert.equal(store.loadGuided(storage), null);

  const canonicalStorage = memoryStorage({
    [store.CANONICAL_KEY]: JSON.stringify(accounts.guestConsumes.state)
  });
  const imported = store.loadCanonicalAsGuided(canonicalStorage);
  assert.equal(imported.people.find((person) => person.id === "p_maria").isGuest, true);
  assert.deepEqual(
    calculateClaramenteSettlements(imported),
    calculateSettlements(accounts.guestConsumes.state).settlements
  );
  assert.equal(store.loadGuided(canonicalStorage), null);
}

run();
