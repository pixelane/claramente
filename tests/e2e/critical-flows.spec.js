const { test, expect } = require("playwright/test");
const accounts = require("../fixtures/accounts.json");

async function openFixture(page, fixture, viewport) {
  if (viewport) await page.setViewportSize(viewport);
  await page.addInitScript((state) => {
    window.localStorage.setItem("clara.state.v1", JSON.stringify(state));
  }, fixture.state);
  await page.goto("/index.html?shell=clara");
  if (viewport && viewport.width < 720) {
    const paymentsButton = page.locator('.nav-item[data-tab="tab-settlements"]');
    await expect(paymentsButton).toBeVisible();
    await paymentsButton.click();
    await expect(page.getByRole("heading", { name: "Pagos de la mesa" })).toBeVisible();
  }
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("elige la shell correcta por dispositivo", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  await expect(page).toHaveURL(/claramente\.html$/);
  await expect(page.getByRole("heading", { name: "Vamos a dividir la cuenta" })).toBeVisible();

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/claramente.html");
  await expect(page).toHaveURL(/index\.html$/);
  await expect(page.getByRole("heading", { name: "Clara" })).toBeVisible();
});

test("muestra aportaciones cuando todavia nadie pago", async ({ page }) => {
  const fixture = accounts.nobodyPaid;
  await openFixture(page, fixture);

  await expect(page.getByRole("heading", { name: "Pagos de la mesa" })).toBeVisible();
  await expect(page.getByText(fixture.expected.missingTotal, { exact: true })).toBeVisible();
  for (const contribution of fixture.expected.contributions) {
    const row = page.locator(".close-row").filter({ hasText: contribution.person });
    await expect(row).toContainText(contribution.amount);
  }
});

test("excluye del pago a un invitado que consumio", async ({ page }) => {
  const fixture = accounts.guestConsumes;
  await openFixture(page, fixture);

  await expect(page.getByText(fixture.expected.settlement, { exact: true })).toBeVisible();
  await expect(page.getByText(fixture.expected.amount, { exact: true }).first()).toBeVisible();
  const mariaBalance = page.locator(".balance-row").filter({ hasText: "Maria" });
  await expect(mariaBalance).toContainText(fixture.expected.guestBalance);
});

test("conserva el mismo resultado en movil tableta y PC", async ({ page }) => {
  const fixture = accounts.crossViewport;
  const viewports = [
    { name: "movil", width: 390, height: 844 },
    { name: "tableta", width: 768, height: 1024 },
    { name: "PC", width: 1440, height: 900 }
  ];

  for (const viewport of viewports) {
    await test.step(viewport.name, async () => {
      await openFixture(page, fixture, viewport);
      for (const settlement of fixture.expected.settlements) {
        await expect(page.getByText(settlement, { exact: true })).toBeVisible();
      }
      await expect(page.getByText(fixture.expected.amount, { exact: true })).toHaveCount(2);
    });
  }
});
