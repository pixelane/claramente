const assert = require("node:assert/strict");
const exchange = require("../../clara-exchange.js");
const qr = require("../../clara-qr.js");

function bill() {
  return {
    billId: "mesa_a1b2c3",
    people: Array.from({ length: 8 }, (_, index) => ({ id: `p_${index}`, name: `Persona ${index}` })),
    items: Array.from({ length: 12 }, (_, index) => ({
      id: `item_${index}`,
      type: "product",
      name: `Producto ${index}`,
      amountCents: 1800 + index
    })),
    updatedAt: 2
  };
}

async function run() {
  const part = await exchange.seal("part1", {
    kind: "part",
    billId: "mesa_a1b2c3",
    personId: "p_1",
    ate: ["item_0", "item_1"]
  });
  const partChunks = exchange.splitQr(part);
  assert.equal(partChunks.length, 1);
  assert.equal(qr.readPixels(qr.toPixels(partChunks[0])), partChunks[0]);
  assert.match(qr.toSvg(partChunks[0]), /^<svg /);

  const list = await exchange.seal("list1", exchange.toList(bill()));
  const chunks = exchange.splitQr(list);
  assert.ok(chunks.length > 1);
  chunks.forEach((chunk) => {
    assert.ok(chunk.length <= 280);
    assert.equal(qr.readPixels(qr.toPixels(chunk)), chunk);
  });
  const opened = await exchange.openCode(exchange.joinQr(chunks));
  assert.equal(opened.items.length, 12);
  assert.equal(opened.items[0].amountCents, 1800);
  assert.equal(qr.readPixels(qr.toPixels(chunks[0].replace(/.$/, (char) => char === "a" ? "b" : "a"))), chunks[0].replace(/.$/, (char) => char === "a" ? "b" : "a"));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
