import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHmac } from "node:crypto";
const base = process.env.BASE_URL || "http://localhost:3100";
const fixturePort = Number(process.env.PROXY_FIXTURE_PORT || 3002);
const requests = [];
const fixture = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks);
  requests.push({ url: request.url, method: request.method, headers: request.headers, raw });
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Set-Cookie", ["session=refreshed; HttpOnly; Path=/; SameSite=Lax", "workspace=team; HttpOnly; Path=/; SameSite=Lax"]);
  if (request.url.startsWith("/auth/callback")) {
    response.writeHead(302, { Location: `${base}/dashboard` }); response.end(); return;
  }
  response.setHeader("Content-Type", "application/json");
  response.statusCode = request.url.startsWith("/api/denied") ? 403 : 200;
  response.end(JSON.stringify({ backend: "fixture", method: request.method }));
});
await new Promise((resolve, reject) => { fixture.once("error", reject); fixture.listen(fixturePort, "127.0.0.1", resolve); });
try {
  const payload = JSON.stringify({ title: "An unchanged email", content: "<h1>Hello</h1>" });
  const result = await fetch(`${base}/api/documents/email-one?search=hello%20world&page=2`, { method: "PATCH", headers: { "Content-Type": "application/json", Origin: base, Cookie: "session=existing; workspace=team" }, body: payload });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).backend, "fixture");
  assert.equal(result.headers.getSetCookie().length, 2);
  assert.ok(result.headers.getSetCookie()[0].includes("HttpOnly"));
  const forwarded = requests.at(-1);
  assert.equal(forwarded.method, "PATCH");
  assert.equal(forwarded.headers.cookie, "session=existing; workspace=team");
  assert.equal(forwarded.headers.origin, base);
  assert.equal(forwarded.raw.toString(), payload);
  const query = new URL(forwarded.url, "http://fixture").searchParams;
  assert.equal(query.get("search"), "hello world"); assert.equal(query.get("page"), "2");
  const raw = '{ "event": "subscription.activated", "emoji": "✉" }\n';
  const signature = createHmac("sha256", "fixture-secret").update(raw).digest("hex");
  await fetch(`${base}/api/webhooks/razorpay`, { method: "POST", headers: { "Content-Type": "application/json", "x-razorpay-signature": signature }, body: raw });
  assert.equal(createHmac("sha256", "fixture-secret").update(requests.at(-1).raw).digest("hex"), signature);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("first-")); controller.enqueue(new TextEncoder().encode("second")); controller.close(); } });
  await fetch(`${base}/api/assets`, { method: "POST", body: stream, duplex: "half", headers: { "Content-Type": "application/octet-stream" } });
  assert.equal(requests.at(-1).raw.toString(), "first-second");
  const denied = await fetch(`${base}/api/denied`);
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("cache-control"), "private, no-store");
  const callback = await fetch(`${base}/auth/callback?code=fixture-code`, { redirect: "manual" });
  assert.equal(callback.status, 302);
  assert.equal(callback.headers.get("location"), `${base}/dashboard`);
  assert.equal(callback.headers.getSetCookie().length, 2);
  assert.equal(requests.at(-1).url, "/auth/callback?code=fixture-code");
  console.log("PASS: frontend/backend proxy preserves methods, JSON, raw signatures, streams, cookies, queries, errors, and auth redirects");
} finally { await new Promise(resolve => fixture.close(resolve)); }
