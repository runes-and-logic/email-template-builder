"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Document } from "@/lib/workspace";
type Records = { rows: Record<string, unknown>[]; count: number; role: string; sections: string[]; section: string };
export function PlatformAdmin() {
  const [section, setSection] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Records | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      api<Records>(`/api/admin?${new URLSearchParams({ section, search, page: String(page) })}`, { signal: controller.signal }).then(result => { setData(result); }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [section, search, page, refresh]);
  useEffect(() => {
    if (section === "templates" || data?.section === "templates") api<{ documents: Document[] }>("/api/documents").then(result => setDocuments(result.documents)).catch(error => setMessage(error.message));
  }, [section, data?.section]);
  async function submit(input: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try { await api("/api/admin", { method: "POST", body: JSON.stringify(input) }); setRefresh(value => value + 1); setMessage("Changes saved and audited."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
    finally { setBusy(false); }
  }
  const active = section || data?.section;
  return <div className="container prose-page platform-admin"><h1>Platform administration</h1><p><Link href="/account">Back to account</Link>{data && ` · ${data.role}`}</p>
    {message && <p className="inline-notice" role="status">{message}</p>}
    <nav className="studio-actions" aria-label="Administration sections">{data?.sections.map(item => <button key={item} className="button secondary small" aria-pressed={item === active} onClick={() => { setSection(item); setPage(0); setSearch(""); }}>{item}</button>)}</nav>
    {data && <label>Search records<input value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label>}
    {loading ? <p role="status">Loading records…</p> : data && <><div className="admin-table-scroll"><table><thead><tr>{Object.keys(data.rows[0] || {}).map(key => <th key={key}>{key.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{data.rows.map((row, index) => <tr key={String(row.id || row.user_id || row.workspace_id || index)}>{Object.entries(row).map(([key, value]) => <td key={key}>{value === null ? "—" : String(value)}</td>)}</tr>)}</tbody></table></div><div className="studio-actions"><button className="button secondary small" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><span>{data.count} records · page {page + 1}</span><button className="button secondary small" disabled={(page + 1) * 20 >= data.count} onClick={() => setPage(value => value + 1)}>Next</button></div></>}
    {active === "templates" && <form onSubmit={event => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const document = documents.find(item => item.id === form.get("document"));
      if (document) void submit({ section: "templates", document, templateId: form.get("templateId"), published: form.get("published") === "on" });
    }}><h2>Publish an email to the catalog</h2><p>Create and save an email in your workspace, then publish it here. Reuse a catalog ID to update or unpublish an existing entry.</p><label>Saved email<select name="document" required>{documents.map(document => <option key={document.id} value={document.id}>{document.name}</option>)}</select></label><label>Catalog ID<input name="templateId" required pattern="[A-Za-z0-9_-]+" maxLength={100} /></label><label><input type="checkbox" name="published" defaultChecked /> Published</label><button className="button" disabled={busy || !documents.length}>Save catalog template</button></form>}
    {active === "plans" && <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); void submit({ section: "plans", plan: form.get("plan"), documentLimit: Number(form.get("documentLimit")), assetLimit: Number(form.get("assetLimit")) * 1048576, monthlyId: form.get("monthlyId"), yearlyId: form.get("yearlyId") }); }}><h2>Plan configuration</h2><p>Provider plan prices must match the prices displayed to customers. Existing subscriptions retain their provider plan.</p><label>Plan<select name="plan"><option>free</option><option>starter</option><option>pro</option><option>business</option></select></label><label>Template limit<input name="documentLimit" type="number" min={1} required /></label><label>Storage limit (MB)<input name="assetLimit" type="number" min={1} required /></label><label>Razorpay monthly plan ID<input name="monthlyId" /></label><label>Razorpay yearly plan ID<input name="yearlyId" /></label><button className="button" disabled={busy}>Save plan configuration</button></form>}
    {active === "roles" && <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); void submit({ section: "roles", email: form.get("email"), role: form.get("role") }); }}><h2>Administrator access</h2><label>Verified account email<input name="email" type="email" required /></label><label>Role<select name="role">{["operations","billing","support","content","super_admin","remove"].map(role => <option key={role}>{role}</option>)}</select></label><button className="button" disabled={busy}>Update access</button></form>}
  </div>;
}
