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

  const multiple = {
    people: [
      { id: "p_ana", name: "Ana", isGuest: false },
      { id: "p_luis", name: "Luis", isGuest: false }
    ],
    items: [
      { id: "tacos", type: "product", name: "Tacos", amountCents: 10000, eatenBy: ["p_ana", "p_luis"], paidById: "p_ana" },
      { id: "taxi", type: "shared", name: "Taxi", amountCents: 6000, splitWith: ["p_ana", "p_luis"], paidById: "p_luis" }
    ],
    paidMode: "multiple",
    paymentMethod: "cash",
    paidById: "",
    updatedAt: 20
  };
  const roundTripStorage = memoryStorage();
  store.saveGuided(roundTripStorage, multiple);
  assert.deepEqual(
    calculateClaramenteSettlements(store.loadGuided(roundTripStorage)),
    calculateClaramenteSettlements(multiple)
  );
  assert.equal(store.syncCanonicalFromGuided(roundTripStorage, multiple).action, "write");
  const written = JSON.parse(roundTripStorage.getItem(store.CANONICAL_KEY));
  assert.equal(written.expenses[0].paidBy, "p_ana");
  assert.equal(written.expenses[1].paidBy, "p_luis");
  assert.equal(written.updatedAt, 20);

  const rich = memoryStorage({
    [store.CANONICAL_KEY]: JSON.stringify({
      ...accounts.guestConsumes.state,
      people: accounts.guestConsumes.state.people.map((person) => (
        person.id === "p_ana" ? { ...person, reminder: "Transferencia" } : person
      )),
      updatedAt: 5
    })
  });
  assert.deepEqual(store.syncCanonicalFromGuided(rich, { ...multiple, updatedAt: 50 }), { action: "keep", reason: "rich" });
  assert.match(rich.getItem(store.CANONICAL_KEY), /Transferencia/);

  const closed = memoryStorage({
    [store.CANONICAL_KEY]: JSON.stringify({
      ...accounts.crossViewport.state,
      tableClose: { "p_luis:p_ana:e_cena": { paidCents: 100 } },
      updatedAt: 5
    })
  });
  assert.equal(store.syncCanonicalFromGuided(closed, multiple).reason, "rich");

  const newer = memoryStorage({
    [store.CANONICAL_KEY]: JSON.stringify({ ...accounts.crossViewport.state, groupName: "Cena", updatedAt: 80 })
  });
  assert.deepEqual(store.syncCanonicalFromGuided(newer, multiple), { action: "keep", reason: "newer" });
  assert.equal(store.syncCanonicalFromGuided(newer, { ...multiple, updatedAt: 90 }).action, "write");
  assert.equal(JSON.parse(newer.getItem(store.CANONICAL_KEY)).groupName, "Cena");

  const named = memoryStorage({
    [store.CANONICAL_KEY]: JSON.stringify({ ...accounts.crossViewport.state, groupName: "Cena", updatedAt: 1 })
  });
  assert.equal(store.syncCanonicalFromGuided(named, { people: [], items: [], updatedAt: 100 }).reason, "empty");
  assert.equal(JSON.parse(named.getItem(store.CANONICAL_KEY)).groupName, "Cena");
}

run();
