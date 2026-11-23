const assert = require("node:assert/strict");
const {
  calculateClaramenteContributions,
  calculateClaramenteSettlements,
  calculateSettlements,
  claramenteToClaraState,
  claraStateToClaramente,
  normalizeCanonicalState,
  normalizeClaramenteState,
  validateCanonicalState,
  validateClaramenteState
} = require("../../clara-core.js");
const accounts = require("../fixtures/accounts.json");

const mobileState = {
  people: [
    { id: "p_ana", name: "Ana", isGuest: false },
    { id: "p_luis", name: "Luis", isGuest: false },
    { id: "p_maria", name: "Maria", isGuest: true }
  ],
  items: [
    { id: "prod_pizza", type: "product", name: "Pizza", amountCents: 30000, eatenBy: ["p_ana", "p_luis", "p_maria"] },
    { id: "shared_tip", type: "shared", name: "Propina", amountCents: 5000, splitWith: ["p_ana", "p_luis"] },
    { id: "single_coffee", type: "single", name: "Cafe", amountCents: 4000, ownerId: "p_luis", paidById: "p_ana" }
  ],
  paidMode: "single",
  paidById: "p_ana"
};

function settlementSignature(settlements) {
  return settlements
    .map((payment) => `${payment.from}->${payment.to}:${payment.amountCents}`)
    .sort();
}

function run() {
  const canonical = claramenteToClaraState(mobileState);
  assert.deepEqual(canonical.people, [
    { id: "p_ana", name: "Ana", reminder: "", isGuest: false },
    { id: "p_luis", name: "Luis", reminder: "", isGuest: false },
    { id: "p_maria", name: "Maria", reminder: "", isGuest: true }
  ]);
  assert.deepEqual(canonical.expenses.map((expense) => ({
    id: expense.id,
    description: expense.description,
    amountCents: expense.amountCents,
    paidBy: expense.paidBy,
    splitWith: expense.splitWith
  })), [
    { id: "prod_pizza", description: "Pizza", amountCents: 30000, paidBy: "p_ana", splitWith: ["p_ana", "p_luis", "p_maria"] },
    { id: "shared_tip", description: "Propina", amountCents: 5000, paidBy: "p_ana", splitWith: ["p_ana", "p_luis"] },
    { id: "single_coffee", description: "Cafe", amountCents: 4000, paidBy: "p_ana", splitWith: ["p_luis"] }
  ]);

  const settlements = calculateClaramenteSettlements(mobileState);
  assert.deepEqual(settlements, [
    { from: "p_luis", to: "p_ana", amountCents: 21500 }
  ]);

  const contributions = calculateClaramenteContributions({ ...mobileState, paidMode: "none", paidById: "" });
  assert.deepEqual(Object.fromEntries(contributions), {
    p_ana: 17500,
    p_luis: 21500,
    p_maria: 0
  });

  const cardSettlements = calculateClaramenteSettlements({
    ...mobileState,
    paidMode: "none",
    paidById: "",
    paymentMethod: "card",
    cardPayerId: "p_ana"
  });
  assert.deepEqual(cardSettlements, [
    { from: "p_luis", to: "p_ana", amountCents: 21500 }
  ]);

  const roundTrip = claraStateToClaramente(canonical);
  assert.deepEqual(settlementSignature(calculateClaramenteSettlements(roundTrip)), settlementSignature(settlements));
  assert.equal(validateClaramenteState(roundTrip).length, 0);
  assert.deepEqual(normalizeClaramenteState({ ...mobileState, screen: "items", editing: { type: "item" } }), normalizeClaramenteState(mobileState));

  const nobody = claraStateToClaramente(accounts.nobodyPaid.state);
  assert.equal(nobody.paidMode, "none");
  assert.deepEqual(Object.fromEntries(calculateClaramenteContributions(nobody)), {
    p_ana: 10000,
    p_luis: 12000,
    p_maria: 8000
  });

  const guest = claraStateToClaramente(accounts.guestConsumes.state);
  assert.deepEqual(
    settlementSignature(calculateClaramenteSettlements(guest)),
    settlementSignature(calculateSettlements(accounts.guestConsumes.state).settlements)
  );

  const multiple = claraStateToClaramente({
    version: 1,
    currency: "MXN",
    people: mobileState.people.map((person) => ({ ...person, reminder: "" })),
    expenses: [
      { id: "e1", description: "Tacos", amountCents: 10000, paidBy: "p_ana", splitWith: ["p_ana", "p_luis"], createdAt: 1 },
      { id: "e2", description: "Taxi", amountCents: 6000, paidBy: "p_luis", splitWith: ["p_ana", "p_luis"], createdAt: 2 }
    ],
    tableClose: {},
    updatedAt: 1
  });
  assert.equal(multiple.paidMode, "multiple");
  assert.equal(validateClaramenteState(multiple).length, 0);

  const roundingPeople = [
    { id: "p_ana", name: "Ana", isGuest: false },
    { id: "p_luis", name: "Luis", isGuest: false },
    { id: "p_maria", name: "Maria", isGuest: false }
  ];
  const rounding = {
    people: roundingPeople,
    items: [{ id: "odd", type: "shared", name: "Propina", amountCents: 100, splitWith: ["p_ana", "p_luis", "p_maria"] }],
    paidMode: "single",
    paidById: "p_ana"
  };
  const roundingCanonical = claramenteToClaraState(rounding);
  assert.equal(roundingCanonical.expenses[0].amountCents, 100);
  assert.deepEqual(
    settlementSignature(calculateClaramenteSettlements(claraStateToClaramente(roundingCanonical))),
    settlementSignature(calculateSettlements(roundingCanonical).settlements)
  );

  const dirty = normalizeCanonicalState({
    version: 9,
    currency: "BTC",
    people: [
      { id: "p_ana", name: " Ana ", isGuest: 0 },
      { id: "p_ana", name: "Duplicada", isGuest: false },
      { name: "Sin id", isGuest: false }
    ],
    expenses: [
      { id: "ok", description: " Taxi ", amountCents: 300, paidBy: "p_ana", splitWith: ["p_ana", "missing", "p_ana"], createdAt: 4 },
      { id: "bad", description: "Huérfano", amountCents: 999, paidBy: "missing", splitWith: ["p_ana"], createdAt: 5 }
    ],
    tableClose: { row: { paidCents: -1 }, ok: { paidCents: 10 } }
  });
  assert.deepEqual(dirty.people, [{ id: "p_ana", name: "Ana", reminder: "", isGuest: false }]);
  assert.equal(dirty.currency, "MXN");
  assert.deepEqual(dirty.expenses, [{
    id: "ok",
    description: "Taxi",
    amountCents: 300,
    paidBy: "p_ana",
    splitWith: ["p_ana"],
    createdAt: 4
  }]);
  assert.deepEqual(dirty.tableClose, { ok: { paidCents: 10 } });
  assert.ok(validateCanonicalState({
    ...accounts.crossViewport.state,
    expenses: [
      ...accounts.crossViewport.state.expenses,
      { id: "bad", description: "Invalid", amountCents: 99999, paidBy: "missing", splitWith: ["p_ana"], createdAt: 2 }
    ]
  }).some((error) => error.includes("paidBy no existe")));
  assert.equal(validateCanonicalState(accounts.guestConsumes.state).length, 0);
  assert.ok(validateClaramenteState({ ...mobileState, screen: "paid" }).some((error) => error.includes("screen")));
}

run();
