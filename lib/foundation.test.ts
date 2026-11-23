import { test } from "node:test";
import assert from "node:assert/strict";
import { fromTemplate, validDocument, validBlock } from "./workspace.ts";
import { templates } from "./data.ts";
import { plainText, emailChecks } from "./email-checks.ts";
test("gallery instances have unique IDs and preserve source identity", () => {
  const first = fromTemplate(templates[0]);
  const second = fromTemplate(templates[0]);
  assert.notEqual(first.id, second.id);
  assert.equal(first.source, second.source);
  assert.equal(fromTemplate(templates[0], { title: "Legacy" }).id, templates[0].id);
});
test("bounded validation rejects duplicate IDs, unsafe sizes, dates and malformed blocks", () => {
  const doc = fromTemplate(templates[0]);
  assert.ok(validDocument(doc));
  assert.equal(validDocument({ ...doc, blocks: [...doc.blocks,doc.blocks[0]] }),false);
  assert.equal(validDocument({ ...doc, modified: "invalid" }),false);
  assert.equal(validDocument({ ...doc, name: " " }),false);
  assert.equal(validBlock({ ...doc.blocks[0], padding: -1 }),false);
  assert.equal(validBlock({ ...doc.blocks[0], text: "x".repeat(20001) }),false);
});
test("email checks and plain text preserve content and destinations", () => {
  const doc = fromTemplate(templates[0]);
  assert.ok(emailChecks(doc).some(warning => warning.includes("subject")));
  const text = plainText({ ...doc, subject: "Welcome" });
  assert.ok(text.startsWith("Welcome"));
  assert.ok(text.includes("https://example.com"));
});
