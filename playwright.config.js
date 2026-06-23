const path = require("node:path");
const { defineConfig } = require("playwright/test");

const node = process.execPath;
const server = path.join(__dirname, "tests", "e2e", "server.js");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: `"${node}" "${server}"`,
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  }
});
