const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const cssFiles = ["style.css", "claramente.css"];

function readCss(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function run() {
  for (const file of cssFiles) {
    const css = readCss(file);
    assert.match(css, /--radius-card:/, `${file} should expose a card radius token`);
    assert.match(css, /--motion-standard:/, `${file} should expose a standard motion token`);
    assert.match(css, /--state-info:/, `${file} should expose an info state token`);
    assert.match(css, /--state-warning:/, `${file} should expose a warning state token`);
    assert.match(css, /--state-success:/, `${file} should expose a success state token`);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, `${file} should respect reduced motion`);
    assert.match(css, /min-height:\s*(4[8-9]|5\d)px/, `${file} should keep touch targets at least 48px`);
    assert.doesNotMatch(css, /border-radius:\s*(3[2-9]|[4-9]\d)px/, `${file} should avoid over-rounded cards`);
  }

  const claraCss = readCss("style.css");
  const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const testPlan = fs.readFileSync(path.join(root, "TEST_PLAN.md"), "utf8");
  const helpPage = fs.readFileSync(path.join(root, "ayuda.html"), "utf8");
  const appJs = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(claraCss, /\.ticket-consumer-cell/, "style.css should isolate ticket consumer chips");
  assert.match(claraCss, /\.support-callout/, "support tab should distinguish the external help manual from local tools");
  assert.match(claraCss, /\.support-manual-link/, "support tab should style its manual link without inline CSS");
  assert.match(claraCss, /grid-area:\s*consumers/, "ticket consumer chips should move below product fields on mobile");
  assert.match(claraCss, /repeat\(auto-fit,\s*minmax\(76px,\s*1fr\)\)/, "ticket consumer chips should use a responsive compact grid");
  assert.doesNotMatch(serviceWorker, /tesseract|worker\.min|traineddata|wasm/, "service worker should not precache OCR assets when OCR is outside 1.0");
  assert.doesNotMatch(testPlan, /clara-cache-v22/, "manual test plan should not mention stale cache versions");
  assert.match(helpPage, /Abrir Claramente/, "public manual should include an open-app CTA");
  assert.match(helpPage, /Probar con ejemplo/, "public manual should include the example CTA");
  assert.match(helpPage, /Dividir una cuenta ahora/, "public manual should include a direct start CTA");
  assert.match(helpPage, /Usa Claramente para dividir la cuenta sin instalar nada/, "public manual should include short share copy");
  assert.doesNotMatch(helpPage, /seguridad bancaria|privacidad absoluta/i, "public manual should avoid overpromising privacy or security");
  assert.doesNotMatch(helpPage, /class="arrow-note"|class="pay-arrow"/, "public manual should avoid labeled arrow diagrams that overlap and look generic");
  assert.match(helpPage, /class="payment-ledger"/, "public manual should show the payment example as a readable ledger");
  assert.match(indexHtml, /id="ticketStatusLine"[^>]*aria-live="polite"/, "restaurant dialog should expose inline validation feedback");
  assert.doesNotMatch(appJs, /alert\(/, "main Clara flow should use inline feedback instead of blocking alerts");
}

run();
