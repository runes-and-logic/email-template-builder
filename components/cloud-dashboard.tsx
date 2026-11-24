"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  LayoutTemplate,
  Loader2,
  MoreHorizontal,
  Palette,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { readDocuments, type Document } from "@/lib/workspace";
import { EmailThumbnail } from "./email-thumbnail";
import "./dashboard.css";

type Saved = Document & { revision: number };
type Usage = { documents: number; limit: number; storage: number; storageLimit: number; plan: string };
type Toast = { tone: "info" | "error"; text: string; undo?: () => void } | null;
const PAGE_SIZE = 12;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function editedAgo(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  return "just now";
}
const megabytes = (bytes: number) => `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)} MB`;

function CardMenu({ onRename, onDuplicate, onDelete, disabled, canDuplicate }: {
  onRename: () => void; onDuplicate: () => void; onDelete: () => void; disabled: boolean; canDuplicate: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => { if (!(event instanceof KeyboardEvent) || event.key === "Escape") { if (event instanceof PointerEvent && root.current?.contains(event.target as Node)) return; setOpen(false); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const run = (fn: () => void) => () => { setOpen(false); fn(); };
  return (
    <div className="db-menu" ref={root}>
      <button type="button" className="db-menu-button" aria-label="Email actions" aria-expanded={open} disabled={disabled} onClick={() => setOpen(value => !value)}><MoreHorizontal size={18} /></button>
      {open && (
        <div className="db-menu-panel" role="menu">
          <button type="button" role="menuitem" onClick={run(onRename)}><PenLine size={15} /> Rename</button>
          <button type="button" role="menuitem" disabled={!canDuplicate} onClick={run(onDuplicate)}><Copy size={15} /> Duplicate</button>
          <button type="button" role="menuitem" className="is-danger" onClick={run(onDelete)}><Trash2 size={15} /> Move to Trash</button>
        </div>
      )}
    </div>
  );
}

export function CloudDashboard() {
  const [documents, setDocuments] = useState<Saved[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [trash, setTrash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [toast, setToast] = useState<Toast>(null);
  const [renaming, setRenaming] = useState("");
  const [draftName, setDraftName] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [localCount, setLocalCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const reload = useCallback(() => setRefresh(value => value + 1), []);

  // Documents for the current view; signed-out visitors go to sign in and come back here.
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      try {
        const result = await api<{ documents: Saved[]; count: number }>(`/api/documents?${new URLSearchParams({ page: String(page), search: search.trim(), status, trash: String(trash) })}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setDocuments(result.documents || []);
        setCount(result.count || 0);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) { location.replace(`/login?next=${encodeURIComponent("/dashboard")}`); return; }
        setLoadError(error instanceof Error ? error.message : "We couldn’t load your emails.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search ? 250 : 0);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [search, status, page, trash, refresh]);

  // Plan usage (emails + image storage); refreshed after anything that changes it.
  useEffect(() => {
    api<{ plan: { name: string; document_limit: number; asset_limit: number }; usage: { documents: number; assets: number } }>("/api/account")
      .then(data => setUsage({ documents: data.usage.documents, limit: data.plan.document_limit, storage: data.usage.assets || 0, storageLimit: data.plan.asset_limit, plan: data.plan.name }))
      .catch(() => {});
  }, [refresh]);

  useEffect(() => { try { setLocalCount(readDocuments().length); } catch { setLocalCount(0); } }, []);

  useEffect(() => {
    if (!toast || toast.tone === "error") return;
    const timer = setTimeout(() => setToast(null), toast.undo ? 7000 : 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const atLimit = !!usage && usage.documents >= usage.limit;

  async function run(task: () => Promise<void>, success?: Toast) {
    setBusy(true);
    try { await task(); reload(); if (success) setToast(success); }
    catch (error) { setToast({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong. Please try again." }); }
    finally { setBusy(false); }
  }
  const persist = (document: Document, revision: number) => api("/api/documents", { method: "POST", body: JSON.stringify({ document, revision }) });
  const setDeleted = (doc: Saved, deleted: boolean, revision = doc.revision) =>
    api<{ revision: number }>(`/api/documents/${encodeURIComponent(doc.id)}`, { method: "PATCH", body: JSON.stringify({ revision, deleted }) });

  // Same route as the header's "New email": the editor creates the blank email and opens it.
  function createBlank() {
    setCreating(true);
    location.assign("/editor?template=blank");
  }

  function moveToTrash(doc: Saved) {
    void run(async () => {
      const { revision } = await setDeleted(doc, true);
      setToast({
        tone: "info",
        text: `“${doc.name}” moved to Trash.`,
        // Undo restores using the revision the server returned for the trashed email.
        undo: () => void run(async () => { await setDeleted(doc, false, revision); }, { tone: "info", text: `“${doc.name}” restored.` }),
      });
    });
  }

  function saveName(doc: Saved) {
    const name = draftName.trim();
    setRenaming("");
    if (!name || name === doc.name) return;
    void run(async () => { await persist({ ...doc, name: name.slice(0, 200) }, doc.revision); }, { tone: "info", text: "Email renamed." });
  }

  function importBrowserEmails() {
    void run(async () => {
      const local = readDocuments();
      let imported = 0;
      for (const document of local) {
        // Keep IDs so retrying an import cannot create duplicate cloud records.
        try { await persist(document, 0); imported++; }
        catch (error) { throw new Error(`${imported} of ${local.length} imported. ${error instanceof Error ? error.message : "Import stopped."} Your browser copies are kept.`); }
      }
      setLocalCount(0);
      setToast({ tone: "info", text: `${imported} ${imported === 1 ? "email" : "emails"} imported. Your browser copies are kept.` });
    });
  }

  const filtered = !!search.trim() || !!status;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="container db-page">
      <header className="db-head">
        <div>
          <h1>My Templates</h1>
          <p>{usage ? `${usage.documents} ${usage.documents === 1 ? "email" : "emails"} in your workspace` : "Your emails, saved to your workspace."}</p>
        </div>
        <div className="db-head-actions">
          <Link className="button secondary small" href="/brand"><Palette size={15} /> Brand Kit</Link>
          <Link className="button secondary small" href="/templates"><LayoutTemplate size={15} /> Browse templates</Link>
          <button type="button" className="button small" disabled={creating || atLimit} onClick={createBlank} title={atLimit ? "You’ve reached your plan’s email limit" : undefined}>
            {creating ? <Loader2 size={15} className="db-spin" /> : <Plus size={15} />} New email
          </button>
        </div>
      </header>

      {usage && (
        <section className="db-usage" aria-label="Plan usage">
          <div className="db-meter">
            <div className="db-meter-top"><span>Emails</span><strong>{usage.documents} <em>of {usage.limit}</em></strong></div>
            <div className={`db-bar ${usage.documents / usage.limit >= 0.9 ? "is-high" : ""}`}><i style={{ width: `${Math.min(100, (usage.documents / usage.limit) * 100)}%` }} /></div>
          </div>
          <div className="db-meter">
            <div className="db-meter-top"><span>Image storage</span><strong>{megabytes(usage.storage)} <em>of {megabytes(usage.storageLimit)}</em></strong></div>
            <div className={`db-bar ${usage.storage / usage.storageLimit >= 0.9 ? "is-high" : ""}`}><i style={{ width: `${Math.min(100, (usage.storage / usage.storageLimit) * 100)}%` }} /></div>
          </div>
          <div className="db-plan">
            <span>{usage.plan} plan</span>
            <Link href="/pricing">See plans</Link>
          </div>
        </section>
      )}

      {atLimit && !trash && (
        <div className="db-banner is-warn" role="status">
          <AlertCircle size={17} />
          <p>You’ve used all {usage?.limit} emails on your plan. Move emails you no longer need to Trash to make room.</p>
        </div>
      )}
      {localCount > 0 && !trash && (
        <div className="db-banner" role="status">
          <Download size={17} />
          <p>We found {localCount} {localCount === 1 ? "email" : "emails"} saved in this browser from before you signed in.</p>
          <button type="button" className="button secondary small" disabled={busy} onClick={importBrowserEmails}>Import to workspace</button>
        </div>
      )}

      <div className="db-toolbar">
        <div className="db-tabs" role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={!trash} className={!trash ? "active" : ""} onClick={() => { setTrash(false); setPage(0); }}><FileText size={15} /> Emails</button>
          <button type="button" role="tab" aria-selected={trash} className={trash ? "active" : ""} onClick={() => { setTrash(true); setPage(0); }}><Trash2 size={15} /> Trash</button>
        </div>
        <div className="db-filters">
          <label className="db-search">
            <Search size={16} aria-hidden="true" />
            <input aria-label="Search emails" placeholder={trash ? "Search Trash" : "Search emails"} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={14} /></button>}
          </label>
          {!trash && (
            <div className="db-segment" role="group" aria-label="Filter by status">
              {[["", "All"], ["Draft", "Drafts"], ["Saved", "Saved"]].map(([value, label]) => (
                <button key={label} type="button" aria-pressed={status === value} className={status === value ? "active" : ""} onClick={() => { setStatus(value); setPage(0); }}>{label}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      {trash && <p className="db-trash-note">Emails in Trash don’t count toward your plan. Restore one to keep editing it.</p>}

      {loadError ? (
        <div className="db-empty is-error" role="alert">
          <AlertCircle size={26} />
          <h2>Your emails didn’t load</h2>
          <p>{loadError}</p>
          <button type="button" className="button small" onClick={reload}><RefreshCw size={15} /> Try again</button>
        </div>
      ) : loading ? (
        <div className="db-grid" role="status" aria-label="Loading emails">
          {Array.from({ length: 4 }, (_, i) => <div className="db-skeleton" key={i}><div /><span /><span /></div>)}
        </div>
      ) : !documents.length ? (
        <div className="db-empty">
          {trash ? <Trash2 size={26} /> : filtered ? <Search size={26} /> : <FileText size={26} />}
          <h2>{trash ? "Trash is empty" : filtered ? "No emails match your filters" : "Create your first email"}</h2>
          <p>{trash ? "Emails you move to Trash appear here." : filtered ? "Try a different search or status." : "Start from a designed template, or a blank canvas."}</p>
          {!trash && (filtered
            ? <button type="button" className="button secondary small" onClick={() => { setSearch(""); setStatus(""); }}>Clear filters</button>
            : <div className="db-empty-actions"><Link className="button small" href="/templates"><LayoutTemplate size={15} /> Browse templates</Link><button type="button" className="button secondary small" disabled={creating} onClick={createBlank}><Plus size={15} /> Blank email</button></div>)}
        </div>
      ) : (
        <div className="db-grid">
          {!trash && !filtered && page === 0 && (
            <button type="button" className="db-new" disabled={creating || atLimit} onClick={createBlank}>
              <span>{creating ? <Loader2 size={22} className="db-spin" /> : <Plus size={22} />}</span>
              <strong>New blank email</strong>
              <em>{atLimit ? "Plan limit reached" : "Start from an empty canvas"}</em>
            </button>
          )}
          {documents.map(doc => (
            <article key={doc.id} className={`db-card thumb-host ${trash ? "is-trash" : ""}`}>
              {trash ? (
                <div className="db-thumb"><EmailThumbnail doc={doc} label={doc.name} /></div>
              ) : (
                <Link className="db-thumb" href={`/editor?draft=${encodeURIComponent(doc.id)}`} aria-label={`Open ${doc.name}`}>
                  <EmailThumbnail doc={doc} label={doc.name} />
                  <span className={`db-status is-${doc.status.toLowerCase()}`}>{doc.status}</span>
                </Link>
              )}
              <div className="db-meta">
                <div className="db-meta-text">
                  {renaming === doc.id ? (
                    <input className="db-rename" autoFocus maxLength={200} value={draftName} aria-label="Email name"
                      onChange={e => setDraftName(e.target.value)} onBlur={() => saveName(doc)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveName(doc); } if (e.key === "Escape") setRenaming(""); }} />
                  ) : (
                    <h2>{trash ? doc.name : <Link href={`/editor?draft=${encodeURIComponent(doc.id)}`}>{doc.name}</Link>}</h2>
                  )}
                  <p>{doc.category} · Edited {editedAgo(doc.modified)}</p>
                </div>
                {trash ? (
                  <button type="button" className="button secondary small" disabled={busy || atLimit} title={atLimit ? "Make room on your plan to restore this email" : undefined}
                    onClick={() => void run(async () => { await setDeleted(doc, false); }, { tone: "info", text: `“${doc.name}” restored.` })}>
                    <ArchiveRestore size={15} /> Restore
                  </button>
                ) : (
                  <CardMenu disabled={busy} canDuplicate={!atLimit}
                    onRename={() => { setRenaming(doc.id); setDraftName(doc.name); }}
                    onDuplicate={() => void run(async () => { await persist({ ...doc, id: crypto.randomUUID(), name: `${doc.name.slice(0, 193)} (copy)`, status: "Draft" }, 0); }, { tone: "info", text: "Email duplicated." })}
                    onDelete={() => moveToTrash(doc)} />
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !loadError && count > PAGE_SIZE && (
        <nav className="db-pages" aria-label="Pages">
          <button type="button" className="button secondary small" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={15} /> Previous</button>
          <span>Page {page + 1} of {pages}</span>
          <button type="button" className="button secondary small" disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={15} /></button>
        </nav>
      )}

      {toast && (
        <div className={`db-toast tone-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
          {toast.tone === "error" && <AlertCircle size={16} />}
          <p>{toast.text}</p>
          {toast.undo && <button type="button" className="db-toast-action" onClick={() => { const undo = toast.undo; setToast(null); undo?.(); }}>Undo</button>}
          <button type="button" className="db-toast-close" aria-label="Dismiss" onClick={() => setToast(null)}><X size={15} /></button>
        </div>
      )}
    </div>
  );
}
