const assert = require("node:assert/strict");
const exchange = require("../../clara-exchange.js");

function host() {
  return {
    billId: "mesa-1",
    people: [
      { id: "p_ana", name: "Ana", isGuest: false },
      { id: "p_luis", name: "Luis", isGuest: false }
    ],
    items: [
      { id: "tacos", type: "product", name: "Tacos", amountCents: 12000, eatenBy: ["p_ana"], paidById: "" },
      { id: "propina", type: "shared", name: "Propina", amountCents: 2000, splitWith: ["p_ana", "p_luis"], paidById: "" },
      { id: "cafe", type: "single", name: "Cafe", amountCents: 4500, ownerId: "p_ana", paidById: "p_ana" }
    ],
    claims: {},
    updatedAt: 1
  };
}

async function run() {
  const list = exchange.toList(host());
  const listCode = await exchange.seal("list1", list);
  const openedList = await exchange.openCode(listCode);
  assert.equal(openedList.kind, "list");
  assert.equal(openedList.items.find((item) => item.id === "tacos").amountCents, 12000);
  assert.equal(Object.prototype.hasOwnProperty.call(openedList.items[0], "eatenBy"), false);

  const part = { kind: "part", billId: "mesa-1", personId: "p_luis", ate: ["tacos", "fantasma"] };
  const partCode = await exchange.seal("part1", part);
  const openedPart = await exchange.openCode(partCode);
  const applied = exchange.applyPart(host(), openedPart);
  assert.equal(applied.ok, true);
  assert.deepEqual(applied.state.items[0].eatenBy, ["p_ana", "p_luis"]);
  assert.deepEqual(applied.state.items[1].splitWith, ["p_ana", "p_luis"]);
  assert.deepEqual(applied.state.claims.p_luis, ["tacos"]);

  const cleared = exchange.applyPart(applied.state, { kind: "part", billId: "mesa-1", personId: "p_luis", ate: [] });
  assert.deepEqual(cleared.state.items[0].eatenBy, ["p_ana"]);
  assert.deepEqual(cleared.state.claims.p_luis, []);

  const first = exchange.applyPart(host(), { kind: "part", billId: "mesa-1", personId: "p_luis", ate: ["cafe"] });
  const second = exchange.applyPart(first.state, { kind: "part", billId: "mesa-1", personId: "p_ana", ate: ["cafe"] });
  assert.equal(second.state.items[2].ownerId, "p_ana");
  assert.ok(exchange.rectify(second.state).some((issue) => issue.type === "two-owners"));
  assert.equal(exchange.applyPart(host(), { kind: "part", billId: "otra", personId: "p_luis", ate: ["tacos"] }).ok, false);

  await assert.rejects(async () => {
    const code = await exchange.seal("part1", {
      kind: "part",
      billId: "mesa-1",
      personId: "p_luis",
      ate: ["tacos"],
      amountCents: 1
    });
    await exchange.openCode(code);
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
