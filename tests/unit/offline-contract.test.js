const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function cacheVersions(file) {
  return Array.from(read(file).matchAll(/clara-cache-v\d+/g), (match) => match[0]);
}

function scriptOrder(html) {
  return Array.from(html.matchAll(/<script src="([^"]+)"/g), (match) => match[1]);
}

function run() {
  const versionFiles = ["sw.js", "app.js", "index.html", "clara-sw-register.js"];
  const versions = versionFiles.map((file) => cacheVersions(file));
  versions.forEach((found, index) => {
    assert.deepEqual(found, ["clara-cache-v41"], `${versionFiles[index]} should name only clara-cache-v41`);
  });

  for (const htmlFile of ["index.html", "claramente.html"]) {
    const order = scriptOrder(read(htmlFile));
    assert.equal(order[0], "clara-sw-register.js", `${htmlFile} should register the worker before routing`);
    assert.ok(order.indexOf("clara-sw-register.js") < order.indexOf("shell-router.js"));
  }

  const sw = read("sw.js");
  assert.match(sw, /const MAX_RUNTIME_BYTES = 150 \* 1024/);
  assert.match(sw, /caches\.delete\(RUNTIME_CACHE\)/);
  assert.match(sw, /claramente\.html/);
  assert.doesNotMatch(read("app.js"), /serviceWorker\.register/);
  assert.match(read("clara-sw-register.js"), /updateViaCache: "none"/);
  assert.match(read("claramente.js"), /No pude guardar en este celular/);
  assert.match(read("sw.js"), /\.\/clara-sw-register\.js/);
}

run();
