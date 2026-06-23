const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const claramenteJs = fs.readFileSync(path.join(root, "claramente.js"), "utf8");
const claramenteCss = fs.readFileSync(path.join(root, "claramente.css"), "utf8");

function run() {
  assert.match(claramenteCss, /\.back-button\[hidden\]/, "start screen back button must stay hidden even with custom button display styles");
  assert.doesNotMatch(claramenteJs, /<div class="welcome-mark"/, "start screen should not show a confusing decorative plus or coin mark");
  assert.match(claramenteJs, /Empieza agregando personas/, "start screen should explain the first real task");
  assert.match(claramenteJs, /displayItems\(\)/, "Claramente should render the account through a dedicated display order");
  assert.match(claramenteJs, /\.slice\(\)\.reverse\(\)/, "newly added account items should appear first without changing calculation order");
  assert.match(claramenteJs, /Agregar productos y cargos/, "item screen title should explain that the screen accepts products and shared charges");
  assert.doesNotMatch(claramenteJs, />De alguien</, "item mode tabs should not expose a redundant one-person charge option");
  assert.doesNotMatch(claramenteJs, /renderTypeChoice\("single"/, "type choices should not expose one-person charges as a separate path");
  assert.match(claramenteCss, /grid-template-columns:\s*repeat\(2,\s*1fr\)/, "item mode tabs should be balanced for two visible choices");
  assert.match(claramenteJs, /Nadie ha pagado todavia/, "payment mode copy should name the no-payment case clearly");
  assert.match(claramenteJs, /Una persona pago toda la cuenta/, "payment mode copy should make the single payer option easy to find");
  assert.match(claramenteJs, /Pagos separados por producto/, "payment mode copy should avoid vague category names");
  assert.match(claramenteJs, /Editar cuenta antes de calcular/, "payment screen should give a clear way back to products");
  assert.match(claramenteCss, /\.paid-summary/, "payment screen should include a styled account summary before payment choices");
}

run();
