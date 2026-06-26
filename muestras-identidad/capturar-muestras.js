const { chromium } = require("playwright");
const path = require("node:path");

(async () => {
  const root = path.resolve(__dirname, "..");
  const pages = [
    ["recibo-de-mesa.html", "recibo-de-mesa.png"],
    ["libreta-de-cuenta.html", "libreta-de-cuenta.png"],
    ["mesa-solar.html", "mesa-solar.png"]
  ];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
  for (const [html, png] of pages) {
    const fileUrl = `file:///${path.join(root, "muestras-identidad", html).replace(/\\/g, "/")}`;
    await page.goto(fileUrl);
    await page.screenshot({ path: path.join(root, "muestras-identidad", png), fullPage: true });
    console.log(png);
  }
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
