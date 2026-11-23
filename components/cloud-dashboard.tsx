"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { documentHtml } from "@/lib/email";
import { fromTemplate, readDocuments, type Document } from "@/lib/workspace";
import { templates } from "@/lib/data";
type Saved = Document & { revision: number };
export function CloudDashboard() {
  const [documents, setDocuments] = useState<Saved[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [trash, setTrash] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [rename, setRename] = useState<Saved | null>(null);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<Saved | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api<{ documents: Saved[]; count: number }>(`/api/documents?${new URLSearchParams({ page: String(page), search, status, trash: String(trash) })}`, { signal: controller.signal });
        if (!controller.signal.aborted) { setDocuments(result.documents); setCount(result.count); }
      } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Unable to load emails."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 200);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [search, status, page, trash, refresh]);
  async function action(run: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await run(); setRefresh(value => value + 1); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Operation failed."); }
    finally { setBusy(false); }
  }
  async function persist(document: Document, revision: number) {
    await api("/api/documents", { method: "POST", body: JSON.stringify({ document, revision }) });
  }
  return <>
    <section className="workspace-heading container"><div><span className="eyebrow">YOUR CREATIVE WORKSPACE</span><h1>My Templates</h1><p>Saved securely to your workspace.</p></div>
      <div className="studio-actions"><Link className="button secondary" href="/account">Account & billing</Link><Link className="button secondary" href="/brand">Brand Kit</Link><button className="button" disabled={busy} onClick={() => void action(async () => {
        const document = { ...fromTemplate(templates[0]), name: "Untitled email", blocks: [] };
        await persist(document, 0); location.assign(`/editor?draft=${document.id}`);
      })}>Create new template</button></div>
    </section>
    <section className="container dashboard-content">
      <div className="dashboard-filters"><label>Search emails<input aria-label="Search saved templates" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label>
        <select aria-label="Filter by status" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="">All statuses</option><option>Saved</option><option>Draft</option></select>
        <button className="button secondary small" onClick={() => { setTrash(value => !value); setPage(0); }}>{trash ? "Back to emails" : "Trash"}</button>
        <button className="text-link" disabled={busy} onClick={() => void action(async () => {
          const local = readDocuments(); let imported = 0;
          for (const document of local) {
            // Keep IDs so retrying an import cannot create duplicate cloud records.
            try { await persist(document, 0); imported++; }
            catch (error) { setMessage(`${imported} imported. ${error instanceof Error ? error.message : "Import stopped."} Browser originals are retained.`); return; }
          }
          setMessage(`${imported} emails imported. Browser originals are retained.`);
        })}>Import browser emails</button>
      </div>
      {message && <p className="inline-notice" role="status">{message}</p>}
      {loading ? <p role="status">Loading emails…</p> : !documents.length ? <p>No emails found. <Link href="/templates">Explore templates</Link></p> : <div className="dashboard-grid">
        {documents.map(document => <article className="saved-card" key={document.id}>
          <Link href={`/editor?draft=${document.id}`} className="saved-preview" aria-label={`Open ${document.name}`}><iframe loading="lazy" sandbox="" title={`Preview ${document.name}`} srcDoc={documentHtml(document)} tabIndex={-1} /></Link>
          <div className="saved-card-body"><span>{document.category} · {document.status}</span><h2>{document.name}</h2><p>Edited {new Date(document.modified).toLocaleString()}</p>
            {trash ? <button className="button secondary small" disabled={busy} onClick={() => void action(async () => { await api(`/api/documents/${document.id}`, { method: "PATCH", body: JSON.stringify({ revision: document.revision, deleted: false }) }); })}>Restore template</button> : <div className="saved-actions">
              <button disabled={busy} onClick={() => { setRename(document); setName(document.name); }}>Rename</button>
              <button disabled={busy} onClick={() => void action(async () => { await persist({ ...document, id: crypto.randomUUID(), name: document.name.slice(0,193) + " (copy)", status: "Draft" }, 0); })}>Duplicate</button>
              <button disabled={busy} onClick={() => setDeleting(document)}>Delete</button>
            </div>}
          </div>
        </article>)}
      </div>}
      <div className="studio-actions"><button className="button secondary small" disabled={page === 0 || loading} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page + 1} · {count} emails</span><button className="button secondary small" disabled={(page + 1) * 12 >= count || loading} onClick={() => setPage(value => value + 1)}>Next</button></div>
      {rename && <form className="inline-notice" onSubmit={event => { event.preventDefault(); void action(async () => { await persist({ ...rename, name: name.trim() }, rename.revision); setRename(null); }); }}><label>New template name<input autoFocus required maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label><button className="button small" disabled={busy}>Save name</button><button type="button" className="text-link" onClick={() => setRename(null)}>Cancel</button></form>}
      {deleting && <div className="inline-notice" role="alert"><p>Move “{deleting.name}” to Trash? You can restore it later.</p><button className="button small" disabled={busy} onClick={() => void action(async () => { await api(`/api/documents/${deleting.id}`, { method: "PATCH", body: JSON.stringify({ revision: deleting.revision, deleted: true }) }); setDeleting(null); })}>Delete template</button><button className="text-link" onClick={() => setDeleting(null)}>Keep template</button></div>}
    </section>
  </>;
}
