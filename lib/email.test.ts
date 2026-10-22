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
