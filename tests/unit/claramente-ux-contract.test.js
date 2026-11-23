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
  assert.doesNotMatch(claramenteJs, /siguiente prueba/, "start screen should not expose prototype placeholder copy");
  assert.match(claramenteJs, /displayItems\(\)/, "Claramente should render the account through a dedicated display order");
  assert.match(claramenteJs, /\.slice\(\)\.reverse\(\)/, "newly added account items should appear first without changing calculation order");
  assert.match(claramenteJs, /Agregar productos y cargos/, "item screen title should explain that the screen accepts products and shared charges");
  assert.doesNotMatch(claramenteJs, />De alguien</, "item mode tabs should not expose a redundant one-person charge option");
  assert.doesNotMatch(claramenteJs, /renderTypeChoice\("single"/, "type choices should not expose one-person charges as a separate path");
  assert.match(claramenteCss, /grid-template-columns:\s*repeat\(2,\s*1fr\)/, "item mode tabs should be balanced for two visible choices");
  assert.match(claramenteJs, /Lo comieron todos/, "item screen should expose a clear all-consumers action");
  assert.match(claramenteJs, /No todos lo comieron/, "item screen should expose a clear partial-consumers action");
  assert.match(claramenteJs, /¿La cuenta ya se pago\?/, "payment screen should start with the real payment situation question");
  assert.match(claramenteJs, /Todavia no se ha pagado/, "payment mode copy should name the unpaid case clearly");
  assert.match(claramenteJs, /Alguien ya pago/, "payment mode copy should name the reimbursement case clearly");
  assert.match(claramenteJs, /Cada producto lo pago alguien distinto/, "payment mode copy should move split payments into a clear special case");
  assert.match(claramenteJs, /¿Como van a pagar\?/, "unpaid flow should ask for payment method only after the main choice");
  assert.match(claramenteJs, /¿Quien pondra la tarjeta\?/, "card flow should ask who will use the card");
  assert.match(claramenteJs, /Editar cuenta antes de calcular/, "payment screen should give a clear way back to products");
  assert.match(claramenteCss, /\.paid-summary/, "payment screen should include a styled account summary before payment choices");
  assert.match(claramenteCss, /\.payment-section-title/, "payment screen should include section titles for the decision groups");
  assert.match(claramenteJs, /Abrir cuenta guardada/, "a saved account should be recoverable from the start screen");
  assert.match(claramenteJs, /Traer la cuenta de este celular/, "a richer account on this phone should be offered instead of overwritten");
  assert.match(claramenteJs, /recibe /, "a person who is owed money should see that they receive it");
  assert.match(claramenteJs, /¿\$\{item\.name\} es tuyo\?/, "the guest should answer one product at a time");
  assert.match(claramenteJs, /data-guest-answer="0"/, "each product should have an explicit no");
  assert.match(claramenteJs, /showGuestCode\(\)/, "the last answer should open the code without another hunt");
  assert.match(claramenteJs, /if \(demoMode \|\| state\.screen === "guest"/, "the trial account must not replace the saved account");
  const claramenteHtml = fs.readFileSync(path.join(root, "claramente.html"), "utf8");
  assert.match(claramenteHtml, /clara-store\.js/, "the guided flow should load the shared store");
}

run();
