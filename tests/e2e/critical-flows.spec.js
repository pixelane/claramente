const { test, expect } = require("playwright/test");
const accounts = require("../fixtures/accounts.json");

async function openFixture(page, fixture, viewport) {
  if (viewport) await page.setViewportSize(viewport);
  await page.addInitScript((state) => {
    window.localStorage.removeItem("clara.state.claramente");
    window.localStorage.setItem("clara.state.v1", JSON.stringify(state));
  }, fixture.state);
  try {
    await page.goto("/index.html?shell=claramente-full");
  } catch (error) {
    if (!String(error).includes("net::ERR_ABORTED")) throw error;
  }
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("load");
  await expect(page.locator("#tab-settlements")).toBeAttached();
  if (viewport && viewport.width < 720) {
    await page.getByRole("button", { name: "Pagos" }).click();
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
  await expect(page.getByRole("heading", { name: "Claramente" })).toBeVisible();
});


test("no abre el teclado al cambiar de pantalla en movil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/claramente.html");
  await page.getByRole("button", { name: "Agregar personas" }).click();
  await expect(page.getByRole("heading", { name: "Quienes estan en la mesa?" })).toBeVisible();
  await expect(page.locator("input:focus")).toHaveCount(0);
});

test("el boton atras del navegador vuelve dentro del flujo movil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/claramente.html");
  await page.getByRole("button", { name: "Agregar personas" }).click();
  await expect(page.getByRole("heading", { name: "Quienes estan en la mesa?" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/claramente\.html$/);
  await expect(page.getByRole("heading", { name: "Vamos a dividir la cuenta" })).toBeVisible();
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

test("muestra pagos hacia la tarjeta cuando todavia nadie pago", async ({ page }) => {
  const fixture = accounts.cardPayerPending;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((state) => {
    window.localStorage.setItem("clara.state.claramente", JSON.stringify(state));
  }, fixture.state);
  await page.goto("/claramente.html");
  await expect(page.getByRole("heading", { name: /cuenta ya se pag[oó]/i })).toBeVisible();

  await page.getByRole("button", { name: /Todavia no se ha pagado/ }).click();
  await page.getByRole("button", { name: /^Tarjeta$/ }).click();
  await page.getByRole("button", { name: /^Marta Usa tarjeta/ }).click();
  await page.getByRole("button", { name: "Calcular cuenta" }).click();

  for (const payment of fixture.expected.payments) {
    await expect(page.getByText(payment, { exact: true })).toBeVisible();
  }
  await expect(page.getByText(fixture.expected.hiddenContribution, { exact: true })).toHaveCount(0);
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
      const paymentsPanel = page.locator("#tab-settlements");
      for (const settlement of fixture.expected.settlements) {
        await expect(paymentsPanel.getByText(settlement, { exact: true })).toBeVisible();
      }
      await expect(paymentsPanel.getByText(fixture.expected.amount, { exact: true })).toHaveCount(2);
    });
  }
});

test.describe("PWA offline", () => {
  test.use({ serviceWorkers: "allow" });

  test("abre la ayuda despues de una primera carga online", async ({ page, context }) => {
    await page.goto("/index.html");
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller && registration.active) {
        await new Promise((resolve) => {
          navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
          location.reload();
        });
      }
    });
    await page.waitForLoadState("load");
    await context.setOffline(true);
    await page.goto("/ayuda.html");
    await expect(page.getByRole("heading", { name: /Como leer y compartir una cuenta/ })).toBeVisible();
    await context.setOffline(false);
  });
});
