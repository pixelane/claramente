const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function run() {
  const mobileCss = read("claramente.css");
  const desktopCss = read("style.css");
  const mobile = read("claramente.js");
  const desktop = read("app.js");
  const mobileHtml = read("claramente.html");
  const desktopHtml = read("index.html");

  assert.match(mobileCss, /font-size:\s*1\.0625rem/, "guided text must scale with the system font");
  assert.doesNotMatch(mobileCss, /font-size:\s*\d+px/, "guided text must not use a fixed pixel size");
  assert.match(mobileCss, /safe-area-inset-bottom/, "the sticky action must clear the phone gesture bar");
  assert.match(mobileCss, /\.mini-button \{[^}]*min-height:\s*48px/, "edit and remove must be 48px");
  assert.match(mobileCss, /\.icon-button \{[^}]*min-height:\s*48px/, "close buttons must be 48px");
  assert.match(mobileCss, /\.back-button \{[^}]*min-height:\s*48px/, "back must be 48px");

  assert.match(desktopCss, /safe-area-inset-bottom/, "the desktop shell nav must clear the phone gesture bar");
  assert.match(desktopCss, /\.mode-toggle span \{[^}]*min-height:\s*48px/, "mode switches must be 48px");
  assert.match(desktopCss, /\.file-upload-label \{[^}]*min-height:\s*48px/, "upload must be 48px");
  assert.match(desktopCss, /\.delete-ticket-item-btn \{[^}]*min-height:\s*48px/, "ticket remove must be 48px");

  assert.doesNotMatch(mobile, /type="number"/, "money fields must not use the number spinner");
  assert.doesNotMatch(desktop, /type="number"/, "desktop money fields must not use the number spinner");
  assert.doesNotMatch(desktopHtml, /type="number"/, "desktop markup money fields must not use the number spinner");
  assert.match(mobile, /inputmode="decimal"/, "money fields must open a decimal keyboard");
  assert.match(mobile, /setCustomValidity\(/, "a field error must use the browser validity state");
  assert.match(mobile, /aria-invalid/, "an invalid field must be marked for assistive tech");
  assert.doesNotMatch(mobile, /data-go="items" \$\{canContinue \? "" : "disabled"\}/, "a blocked step must stay tappable and explain why");
  assert.doesNotMatch(mobileHtml, /Escanear codigo/, "the scan sheet must not say codigo");
  assert.match(mobileHtml, /closedby="any"/, "sheets must close from the phone back gesture and a tap outside");

  assert.doesNotMatch(desktop, /button\[type='submit'\]"\)\.disabled/, "the expense button must stay tappable and explain the missing step");
}

run();
