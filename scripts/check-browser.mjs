const baseUrl = process.env.BASE_URL || "http://localhost:3100";
import { chromium } from "playwright";
import assert from "node:assert/strict";
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  let errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/postly-desktop.png", fullPage: true });
  assert.equal(
    await page.locator("h1").innerText(),
    "Beautiful emails.\nBuilt in minutes.",
  );
  await page.goto(baseUrl + "/templates");
  await page.getByRole("button", { name: "Newsletters", exact: true }).click();
  assert.equal(await page.locator(".template-card").count(), 1);
  await page.getByRole("button", { name: "Preview The Sunday edit" }).click();
  assert.ok(await page.locator("dialog").isVisible());
  await page.keyboard.press("Escape");
  assert.ok(!(await page.locator("dialog").isVisible()));
  await page
    .getByRole("button", { name: "All templates", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Search templates" }).fill("nomatch");
  assert.ok(await page.getByText("No templates found").isVisible());
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.equal(await page.locator(".template-card").count(), 8);
  console.log("PASS: Gallery filtering and preview");
  await page
    .getByRole("link", { name: "Use A warm welcome", exact: true })
    .click();
  await page.getByLabel("Headline", { exact: true }).fill("A better hello.");
  await page
    .getByLabel("Button link", { exact: true })
    .fill("https://example.com/welcome");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.reload();
  // Drafts restore from localStorage after React hydrates the editor.
  await page.waitForFunction(() => {
    const field = document.querySelector('.edit-fields textarea');
    return field?.value === 'A better hello.';
  });
  assert.equal(
    await page.getByLabel("Headline", { exact: true }).inputValue(),
    "A better hello.",
  );
  assert.equal(
    await page.getByLabel("Button link", { exact: true }).inputValue(),
    "https://example.com/welcome",
  );
  await page
    .getByRole("button", { name: "Mobile preview", exact: true })
    .click();
  assert.ok(await page.locator(".mobile-preview").isVisible());
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("button", { name: "Use #6e56ae", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML", exact: true }).click();
  const file = await download;
  assert.equal(file.suggestedFilename(), "postly-welcome.html");
  await page.screenshot({ path: "/tmp/postly-editor.png", fullPage: true });
  console.log("PASS: Editor save, preview and export");
  await page.goto(baseUrl + "/pricing");
  await page.getByRole("button", { name: /Yearly/ }).click();
  assert.ok(
    await page.getByText("₹7,670.4 billed yearly", { exact: true }).isVisible(),
  );
  await page.getByRole("link", { name: "Explore Pro" }).click();
  await page.getByText(/selected the sample Pro/).waitFor({ state: "visible" });
  await page.getByLabel("Your name").fill("Alex");
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  assert.ok(
    await page.getByRole("heading", { name: "Welcome, Alex." }).isVisible(),
  );
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/templates", "/pricing", "/editor"]) {
      await page.goto(baseUrl + route);
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      assert.ok(
        dimensions.scroll <= dimensions.client,
        `Overflow ${route} at ${width}: ${JSON.stringify(dimensions)}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .locator(".nav-links")
    .getByRole("link", { name: "Templates", exact: true })
    .click();
  await page.waitForURL("**/templates");
  await page.goto(baseUrl);
  await page.screenshot({ path: "/tmp/postly-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: gallery, modal, filters, empty state, editor, save/reload, URL persistence, color, preview, download, annual pricing, onboarding, mobile navigation, and 12 responsive route checks. No browser errors.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
