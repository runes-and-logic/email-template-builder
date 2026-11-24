import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const baseUrl = process.env.BASE_URL || "http://localhost:3100";
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {}),
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// The editor autosaves; Cmd/Ctrl+S saves immediately. Wait until the status reports the save.
async function saveDraft() {
  await page.keyboard.press("ControlOrMeta+s");
  await page.locator(".sx-status").filter({ hasText: /^\s*Saved/ }).waitFor();
}
try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Start Creating" }).waitFor();
  await page.screenshot({ path: "/tmp/postly-desktop.png", fullPage: true });
  await page.goto(baseUrl + "/templates");
  await page.getByRole("button", { name: "Newsletters", exact: true }).click();
  assert.equal(await page.locator(".template-card").count(), 1);
  await page.getByRole("button", { name: "Preview The Sunday edit" }).click();
  assert.ok(await page.locator("dialog").isVisible());
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Abandoned Cart Emails", exact: true })
    .click();
  assert.equal(await page.locator(".template-card").count(), 1);
  await page
    .getByRole("button", { name: "All templates", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Search templates" }).fill("nomatch");
  await page.getByText("No templates found").waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.equal(await page.locator(".template-card").count(), 11);
  console.log("PASS: Gallery categories, search, preview, empty state");
  // Legacy draft migration and compatibility.
  await page.evaluate(() =>
    localStorage.setItem(
      "postly-draft-welcome",
      JSON.stringify({
        brand: "Legacy brand",
        title: "Legacy headline",
        subtitle: "Legacy message",
        cta: "Legacy action",
        color: "#123456",
        url: "https://example.com/legacy",
      }),
    ),
  );
  await page.goto(baseUrl + "/editor?template=welcome");
  await page
    .getByRole("button", { name: "Edit Heading block 2", exact: true })
    .click();
  await page.getByLabel("Headline", { exact: true }).fill("A better hello.");
  await page
    .getByRole("button", { name: "Edit Button block 4", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Button link", { exact: true }).inputValue(),
    "https://example.com/legacy",
  );
  await page
    .getByLabel("Button link", { exact: true })
    .fill("https://example.com/updated");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(
    await page.getByLabel("Button link", { exact: true }).inputValue(),
    "https://example.com/legacy",
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await saveDraft();
  await page.reload();
  await page
    .getByRole("button", { name: "Edit Heading block 2", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector(".sx-fields textarea")?.value ===
      "A better hello.",
  );
  await page.getByRole("button", { name: "Save as reusable block", exact: true }).click();
  await page.getByRole("button", { name: "Saved", exact: true }).click();
  await page.getByRole("button", { name: "Heading A better hello." }).click();
  assert.equal(await page.locator(".studio-block").count(), 7);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await page.locator(".studio-block").count(), 6);
  await page.getByRole("button", { name: "Blocks", exact: true }).click();
  await page.getByRole("button", { name: "Two columns", exact: true }).click();
  await page.getByLabel("Column 1").fill("First product");
  await page.getByLabel("Column 2").fill("Second product");
  await page
    .getByRole("button", { name: "Move Two columns up", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Move Two columns down", exact: true })
    .click();
  await page.getByRole("button", { name: "Paragraph", exact: true }).click();
  await page.getByLabel("Text", { exact: true }).fill("Drag me");
  const dragged = page.locator(".studio-block").filter({ hasText: "Drag me" });
  await dragged
    .getByRole("button", { name: "Drag Paragraph", exact: true })
    .dragTo(page.locator(".studio-block").filter({ hasText: "First product" }));
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".studio-block")]
      .at(-1)
      ?.textContent.includes("First product"),
  );
  assert.equal(
    await page
      .locator(".studio-block")
      .nth(6)
      .getByRole("button", { name: /Edit Paragraph/ })
      .count(),
    1,
  );
  await page
    .getByRole("button", { name: "Remove Paragraph", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Mobile preview", exact: true })
    .click();
  assert.ok(await page.locator(".mobile-preview").isVisible());
  await page
    .getByRole("button", { name: "Preview", exact: true })
    .click();
  assert.ok(
    await page.getByRole("dialog", { name: "Email preview" }).isVisible(),
  );
  await page.keyboard.press("Escape");
  await saveDraft();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export HTML", exact: true }).click();
  const download = await downloadPromise;
  const html = await readFile(await download.path(), "utf8");
  assert.ok(html.includes("A better hello."));
  assert.ok(html.includes("First product"));
  assert.ok(html.includes("https://example.com/updated"));
  assert.ok(html.includes("https://images.unsplash.com/"));
  await page.screenshot({ path: "/tmp/postly-editor.png", fullPage: true });
  console.log(
    "PASS: Legacy drafts, block editing, URL undo/redo, persistence, reusable blocks, columns, drag and keyboard reorder, preview and HTML download",
  );
  const firstDraft = new URL(page.url()).searchParams.get("draft");
  assert.ok(firstDraft && firstDraft !== "welcome");
  await page.goto(baseUrl + "/dashboard");
  // Drafts are read from browser storage after hydration; wait for them before counting.
  await page.locator(".saved-card").nth(1).waitFor();
  assert.equal(await page.locator(".saved-card").count(), 2, "Original legacy draft is migrated alongside the new gallery instance");
  assert.ok(await page.evaluate(() => localStorage.getItem("postly-draft-welcome")), "Legacy original is preserved");
  await page.evaluate(() => { localStorage.removeItem("postly-draft-welcome"); localStorage.removeItem("postly-document-welcome"); });
  await page.reload();
  await page
    .getByRole("heading", { name: "A warm welcome", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  assert.equal(await page.locator(".saved-card").count(), 2);
  const copy = page.locator(".saved-card").filter({
    has: page.getByRole("heading", {
      name: "A warm welcome (copy)",
      exact: true,
    }),
  });
  await copy.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByLabel("New template name").fill("Renamed campaign");
  await page.getByRole("button", { name: "Save name" }).click();
  await page.getByLabel("Search saved templates").fill("Renamed");
  assert.equal(await page.locator(".saved-card").count(), 1);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete template", exact: true })
    .click();
  await page.getByText("No matching templates.").waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.equal(await page.locator(".saved-card").count(), 1);
  await page.screenshot({ path: "/tmp/postly-dashboard.png", fullPage: true });
  console.log("PASS: Dashboard duplicate, rename, search, confirmed delete");
  await page
    .getByRole("button", { name: "Create new template", exact: true })
    .click();
  await page.waitForURL("**/editor?draft=*");
  for (const kind of [
    "Heading",
    "Paragraph",
    "Image",
    "Button",
    "Divider",
    "Spacer",
    "Social links",
    "Logo",
    "Footer",
    "Product",
  ]) {
    await page.getByRole("button", { name: kind, exact: true }).click();
  }
  await page.getByRole("button", { name: "Two columns", exact: true }).click();
  await page
    .getByRole("button", { name: "Three columns", exact: true })
    .click();
  assert.equal(await page.locator(".studio-block").count(), 12);
  await page
    .getByRole("button", { name: "Edit Image block 3", exact: true })
    .click();
  await page
    .getByLabel("Upload image", { exact: true })
    .setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await page.waitForFunction(() =>
    document
      .querySelector('.sx-fields input[aria-label="Image URL"]')
      ?.value.startsWith("data:image/png;base64,"),
  );
  await page
    .getByRole("button", { name: "Edit Heading block 1", exact: true })
    .click();
  await page.getByLabel("Headline", { exact: true }).fill("Every block works");
  await page.locator("summary", { hasText: "More styling" }).click();
  await page.getByLabel("Spacing", { exact: true }).fill("12");
  await saveDraft();
  await page.reload();
  await page
    .getByRole("button", { name: "Edit Heading block 1", exact: true })
    .click();
  await page.locator("summary", { hasText: "More styling" }).click();
  assert.equal(
    await page.getByLabel("Spacing", { exact: true }).inputValue(),
    "12",
  );
  assert.equal(await page.locator(".studio-block").count(), 12);
  console.log(
    "PASS: New template, all 12 block types, image upload, spacing, structure persistence",
  );
  await page.goto(baseUrl + "/brand");
  await page.getByLabel("Business name", { exact: true }).fill("Acme Studio");
  await page
    .getByLabel("Website", { exact: true })
    .fill("https://example.com/acme");
  await page.getByLabel("Primary hex value", { exact: true }).fill("#447755");
  await page.getByLabel("Primary hex value", { exact: true }).press("Enter");
  await page
    .getByRole("button", { name: "Save Brand Kit", exact: true })
    .click();
  await page.reload();
  await page.waitForFunction(
    () =>
      document.querySelector('.bk-field input[placeholder="Your business"]')?.value === "Acme Studio",
  );
  await page.goto(baseUrl + "/editor?template=welcome");
  await page
    .getByRole("button", { name: "Apply Brand Kit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit Logo block 1", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Text", { exact: true }).inputValue(),
    "Acme Studio",
  );
  await saveDraft();
  await page.goto(baseUrl + "/editor?template=launch");
  await page
    .getByRole("button", { name: "Apply Brand Kit", exact: true })
    .click();
  await saveDraft();
  const launchId = new URL(page.url()).searchParams.get("draft");
  const launchDoc = await page.evaluate(id => JSON.parse(localStorage.getItem("postly-document-" + id)), launchId);
  assert.equal(
    launchDoc.blocks.find((b) => b.kind === "Logo").text,
    "Acme Studio",
  );
  assert.equal(
    launchDoc.blocks.find((b) => b.kind === "Button").background,
    "#447755",
  );
  console.log("PASS: Brand Kit persistence and reuse across templates");
  await page.getByRole("button", { name: "Edit Heading block 2", exact: true }).click();
  await page.getByLabel("Headline", { exact: true }).fill("Recovered after navigation");
  await page.locator(".et").getByRole("link", { name: "Templates", exact: true }).click();
  await page.goto(baseUrl + `/editor?draft=${launchId}`);
  await page.getByRole("button", { name: "Restore changes", exact: true }).click();
  await page.getByRole("button", { name: "Edit Heading block 2", exact: true }).click();
  assert.equal(await page.getByLabel("Headline", { exact: true }).inputValue(), "Recovered after navigation");
  await saveDraft();
  console.log("PASS: Unique gallery instances, preserved migration originals, and recovery after navigation");
  await page.goto(baseUrl + "/pricing");
  await page.getByRole("button", { name: /Yearly/ }).click();
  await page.getByText("₹7,670.4 billed yearly", { exact: true }).waitFor();
  await page.getByRole("link", { name: "Explore Pro", exact: true }).click();
  await page.getByLabel("Your name").fill("Alex");
  await page.getByRole("button", { name: "Enter demo workspace" }).click();
  await page.getByRole("heading", { name: "Welcome, Alex." }).waitFor();
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/templates",
      "/pricing",
      "/editor",
      "/dashboard",
      "/brand",
    ]) {
      await page.goto(baseUrl + route, { waitUntil: "networkidle" });
      const dims = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      assert.ok(
        dims.scroll <= dims.client,
        `Overflow ${route} at ${width}: ${JSON.stringify(dims)}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator('.sh-drawer a[href="/templates"]').click();
  await page.waitForURL("**/templates");
  await page.goto(baseUrl + "/editor");
  await page.screenshot({
    path: "/tmp/postly-editor-mobile.png",
    fullPage: true,
  });
  await page.goto(baseUrl);
  await page.screenshot({ path: "/tmp/postly-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: Pricing, onboarding, mobile navigation, 18 responsive route checks, no browser errors",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/postly-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
}
