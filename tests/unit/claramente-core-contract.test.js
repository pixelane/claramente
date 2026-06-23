const assert = require("node:assert/strict");
const {
  calculateClaramenteContributions,
  calculateClaramenteSettlements,
  claramenteToClaraState
} = require("../../clara-core.js");

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
}

run();
