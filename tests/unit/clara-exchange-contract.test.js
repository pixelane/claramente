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

  const short = await exchange.seal("part1", part);
  assert.deepEqual(exchange.splitQr(short), [short]);

  const long = await exchange.seal("list1", exchange.toList({
    billId: "mesa-1",
    people: Array.from({ length: 8 }, (_, index) => ({ id: `p_${index}`, name: `Persona ${index}` })),
    items: Array.from({ length: 12 }, (_, index) => ({
      id: `item_${index}`,
      type: "product",
      name: `Producto de la carta ${index}`,
      amountCents: 1500 + index
    })),
    updatedAt: 4
  }));
  const chunks = exchange.splitQr(long);
  assert.ok(chunks.length > 1);
  chunks.forEach((chunk) => assert.ok(chunk.length <= 280));
  assert.equal(exchange.joinQr(chunks.slice().reverse().join("\n")), long);
  assert.equal((await exchange.openCode(exchange.joinQr(chunks))).kind, "list");
  assert.throws(() => exchange.joinQr(chunks.slice(1)), /QR_INCOMPLETE/);
  const flipped = chunks[0].replace(/.$/, (char) => (char === "a" ? "b" : "a"));
  await assert.rejects(exchange.openCode(exchange.joinQr([flipped].concat(chunks.slice(1)))));
  assert.throws(() => exchange.joinQr([chunks[0], chunks[0].replace(/:([^:]+)$/, ":otra")].concat(chunks.slice(1))), /QR_CONFLICT/);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
