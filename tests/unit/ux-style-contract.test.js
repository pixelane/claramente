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
  assert.match(claraCss, /\.ticket-consumer-cell/, "style.css should isolate ticket consumer chips");
  assert.match(claraCss, /grid-area:\s*consumers/, "ticket consumer chips should move below product fields on mobile");
  assert.match(claraCss, /repeat\(auto-fit,\s*minmax\(76px,\s*1fr\)\)/, "ticket consumer chips should use a responsive compact grid");
}

run();
