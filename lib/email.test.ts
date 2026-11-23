import { test } from "node:test";
import assert from "node:assert/strict";
import { emailHtml, escapeHtml } from "./email.ts";
const base = {
  brand: "Acme",
  title: "Hello",
  subtitle: "Welcome",
  cta: "Explore",
  color: "#abcdef",
  url: "https://example.com",
};
test("HTML export escapes user content and attribute values", () => {
  const html = emailHtml({
    ...base,
    title: '<script>alert("x")</script>',
    url: 'https://example.com/?a=" onclick="x',
  });
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("a=&quot; onclick=&quot;x"));
  assert.equal(escapeHtml("&<>\"'"), "&amp;&lt;&gt;&quot;&#39;");
});
test("unsafe protocols and invalid colors cannot enter the export", () => {
  const html = emailHtml({
    ...base,
    url: "javascript:alert(1)",
    color: "red;position:absolute",
  });
  assert.ok(html.includes('href="#"'));
  assert.ok(!html.includes("javascript:"));
  assert.ok(!html.includes("position:absolute"));
  assert.ok(html.includes("#6654c0"));
});
test("export contains responsive layout, destination and edited content", () => {
  const html = emailHtml(base);
  assert.ok(html.includes("width=device-width"));
  assert.ok(html.includes("max-width:600px"));
  assert.ok(html.includes('role="presentation"'));
  assert.ok(html.includes('href="https://example.com"'));
  assert.ok(html.includes("Hello"));
  assert.ok(html.includes("#abcdef"));
});

import { blockHtml, documentHtml, safeUrl } from "./email.ts";
import { makeBlock, validDocument } from "./workspace.ts";
import type { Document } from "./workspace.ts";
test("block exports reject injected content, CSS, protocols and SVG uploads", () => {
  const b = {
    ...makeBlock("Button"),
    text: '<img onerror="bad">',
    url: "javascript:alert(1)",
    background: "red;position:fixed",
    font: "Arial;display:none",
    align: "left;position:fixed",
    padding: Infinity,
  };
  const html = blockHtml(b as Parameters<typeof blockHtml>[0]);
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(!html.includes("position:fixed"));
  assert.ok(!html.includes("Infinity"));
  assert.equal(safeUrl("data:image/svg+xml;base64,abc", true), "");
  assert.equal(
    safeUrl("https://example.com/image.png", true),
    "https://example.com/image.png",
  );
  assert.equal(
    safeUrl("data:image/png;base64,YWJj", true),
    "data:image/png;base64,YWJj",
  );
});
test("structured documents export all blocks in order with responsive columns and persisted styles", () => {
  const heading = {
    ...makeBlock("Heading"),
    text: "Saved heading",
    color: "#123456",
    size: 42,
  };
  const columns = {
    ...makeBlock("Two columns"),
    columns: ["First <unsafe>", "Second"],
  };
  const image = {
    ...makeBlock("Image"),
    src: "https://example.com/a.png",
    alt: 'A "nice" image',
    width: 75,
  };
  const doc: Document = {
    version: 2,
    id: "test",
    source: "welcome",
    name: "Test <title>",
    category: "Welcome",
    modified: new Date().toISOString(),
    status: "Saved",
    blocks: [heading, columns, image],
    width: 640,
    background: "#eeeeee",
  };
  assert.ok(validDocument(JSON.parse(JSON.stringify(doc))));
  const html = documentHtml(doc);
  assert.ok(
    html.indexOf("Saved heading") < html.indexOf("First &lt;unsafe&gt;"),
  );
  assert.ok(html.includes("max-width:640px"));
  assert.ok(html.includes("font-size:42px"));
  assert.ok(html.includes("color:#123456"));
  assert.ok(html.includes("width:75%"));
  assert.ok(html.includes("A &quot;nice&quot; image"));
  assert.ok(html.includes("@media(max-width:480px)"));
  assert.ok(!validDocument({ ...doc, blocks: [{ kind: "Unknown" }] }));
});
