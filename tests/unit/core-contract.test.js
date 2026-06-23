const assert = require("node:assert/strict");
const { calculateSettlements } = require("../../clara-core.js");
const accounts = require("../fixtures/accounts.json");

function balanceObject(balances) {
  return Object.fromEntries(Array.from(balances.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function run() {
  const guestResult = calculateSettlements(accounts.guestConsumes.state);
  assert.deepEqual(guestResult.settlements, [
    { from: "p_luis", to: "p_ana", amountCents: 15000 }
  ]);
  assert.equal(guestResult.balances.get("p_maria"), 0);

  const viewportResult = calculateSettlements(accounts.crossViewport.state);
  assert.deepEqual(viewportResult.settlements, [
    { from: "p_luis", to: "p_ana", amountCents: 10000 },
    { from: "p_maria", to: "p_ana", amountCents: 10000 }
  ]);
  assert.deepEqual(balanceObject(viewportResult.balances), {
    p_ana: 20000,
    p_luis: -10000,
    p_maria: -10000
  });

  const ignoredInvalidExpense = calculateSettlements({
    ...accounts.crossViewport.state,
    expenses: [
      ...accounts.crossViewport.state.expenses,
      { id: "bad", description: "Invalid", amountCents: 99999, paidBy: "missing", splitWith: ["p_ana"], createdAt: 2 }
    ]
  });
  assert.deepEqual(ignoredInvalidExpense.settlements, viewportResult.settlements);
}

run();
