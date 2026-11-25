"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Eye,
  LayoutGrid,
  Monitor,
  PenLine,
  RefreshCw,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { previewHtml } from "@/lib/email";
import { templateHeadline, type CatalogEntry } from "@/lib/catalog";
import { EmailThumbnail } from "./email-thumbnail";
import { Sk } from "./skeleton";
import "./template-gallery.css";

type Entry = CatalogEntry;
const ALL = "All templates";

function blockSummary(entry: Entry) {
  return Array.from(new Set(entry.content.blocks.map(block => block.kind)));
}

function PreviewDialog({ entries, index, onClose, onMove }: {
  entries: Entry[]; index: number; onClose: () => void; onMove: (next: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const entry = entries[index];
  const html = useMemo(() => (entry ? previewHtml(entry.content) : ""), [entry]);
  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && index < entries.length - 1) onMove(index + 1);
      if (event.key === "ArrowLeft" && index > 0) onMove(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, entries.length, onMove]);
  if (!entry) return null;
  const kinds = blockSummary(entry);
  return (
    <dialog
      ref={dialog}
      className="tg-dialog"
      aria-labelledby="tg-dialog-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === dialog.current) onClose(); }}
    >
      <div className="tg-dialog-stage">
        <div className="tg-dialog-toolbar">
          <div className="tg-device" role="group" aria-label="Preview size">
            <button type="button" aria-pressed={device === "desktop"} className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}><Monitor size={15} /> Desktop</button>
            <button type="button" aria-pressed={device === "mobile"} className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone size={15} /> Mobile</button>
          </div>
          <span className="tg-counter">{index + 1} of {entries.length}</span>
        </div>
        <div className="tg-dialog-canvas">
          <iframe key={entry.id} title={`${entry.name} preview`} sandbox="" srcDoc={html} style={{ width: device === "mobile" ? 375 : Math.min(entry.content.width + 40, 680) }} />
        </div>
      </div>
      <aside className="tg-dialog-side">
        <button type="button" className="tg-close" aria-label="Close preview" onClick={onClose}><X size={18} /></button>
        <span className="tg-badge">{entry.category}</span>
        <h2 id="tg-dialog-title">{entry.name}</h2>
        <p>A responsive, table-based email you can make your own: edit every block, apply your Brand Kit, then export HTML.</p>
        <div className="tg-included">
          <h3>What’s inside</h3>
          <ul>{kinds.map(kind => <li key={kind}>{kind}</li>)}</ul>
        </div>
        <Link className="button tg-use" href={`/editor?template=${entry.id}`} rel="nofollow"><PenLine size={16} /> Use this template</Link>
        <div className="tg-nav">
          <button type="button" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Previous template"><ArrowLeft size={16} /> Previous</button>
          <button type="button" disabled={index === entries.length - 1} onClick={() => onMove(index + 1)} aria-label="Next template">Next <ArrowRight size={16} /></button>
        </div>
      </aside>
    </dialog>
  );
}

export function CloudGallery({ preview = false, initialCategory = ALL, initialTemplates }: {
  preview?: boolean; initialCategory?: string; initialTemplates?: Entry[] | null;
}) {
  // Server-rendered templates (when provided) appear immediately and are visible to search engines.
  const [entries, setEntries] = useState<Entry[]>(initialTemplates || []);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(!initialTemplates);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("curated");
  const [open, setOpen] = useState(-1);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    api<{ templates: Entry[] }>("/api/catalog")
      .then(result => setEntries(result.templates))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (!initialTemplates) load(); }, [initialTemplates, load]);

  // Full page: read ?q= on arrival and keep ?category= / ?q= in the address so views can be shared.
  const [linked, setLinked] = useState("");
  useEffect(() => {
    if (preview) return;
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setSearch(q);
    setLinked(params.get("preview") || "");
  }, [preview]);
  useEffect(() => {
    if (preview) return;
    const params = new URLSearchParams(location.search);
    if (category && category !== ALL) params.set("category", category); else params.delete("category");
    if (search.trim()) params.set("q", search.trim()); else params.delete("q");
    params.delete("preview");
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
  }, [category, search, preview]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach(item => map.set(item.category, (map.get(item.category) || 0) + 1));
    return map;
  }, [entries]);
  const categories = [ALL, ...counts.keys()];
  let filtered = entries.filter(item =>
    (category === ALL || category === item.category) &&
    `${item.name} ${item.category}`.toLowerCase().includes(search.trim().toLowerCase()));
  if (sort === "az") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (preview) filtered = filtered.slice(0, 4);

  const clear = () => { setSearch(""); setCategory(ALL); };
  // Keep ?preview=<id> in the address while a preview is open, so it can be shared.
  const show = useCallback((next: number, list: Entry[]) => {
    setOpen(next);
    if (preview) return;
    const params = new URLSearchParams(location.search);
    if (next >= 0 && list[next]) params.set("preview", list[next].id); else params.delete("preview");
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}`);
  }, [preview]);
  useEffect(() => {
    if (!linked || loading) return;
    const index = filtered.findIndex(item => item.id === linked);
    if (index >= 0) show(index, filtered);
    setLinked("");
  }, [linked, loading, filtered, show]);
  const move = useCallback((next: number) => show(next, filtered), [show, filtered]);

  return <>
    {!failed && (
      <div className={`tg-toolbar ${preview ? "is-compact" : ""}`}>
        {!preview && (
          <div className="tg-toolbar-row">
            <label className="tg-search">
              <Search size={17} aria-hidden="true" />
              <input aria-label="Search templates" placeholder="Search templates" value={search} onChange={event => setSearch(event.target.value)} />
              {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}
            </label>
            <div className="tg-toolbar-end">
              <span className="tg-result" aria-live="polite">{loading ? <Sk w={84} h={12} /> : `${filtered.length} ${filtered.length === 1 ? "template" : "templates"}`}</span>
              <select aria-label="Sort templates" value={sort} onChange={event => setSort(event.target.value)}>
                <option value="curated">Curated</option>
                <option value="az">Name A–Z</option>
              </select>
            </div>
          </div>
        )}
        <div className="tg-chips-row">
          <div className="tg-chips" role="group" aria-label="Filter by category">
            {(preview ? categories.slice(0, 4) : categories).map(item => (
              <button type="button" key={item} aria-pressed={item === category} className={item === category ? "active" : ""} onClick={() => setCategory(item)}>
                {item === ALL && <LayoutGrid size={14} />}
                {item}
                {!preview && <span>{item === ALL ? entries.length : counts.get(item)}</span>}
              </button>
            ))}
          </div>
          {preview && <Link className="text-link" href="/templates">View all templates <ArrowUpRight size={15} /></Link>}
        </div>
      </div>
    )}

    {failed && (
      <div className="service-fallback" role="alert">
        <LayoutGrid size={22} />
        <div><h3>Templates are taking a short break.</h3><p>We couldn’t load the template catalog right now. You can try again, or start designing from a blank canvas.</p></div>
        <div className="service-fallback-actions">
          <button className="button secondary small" onClick={load}><RefreshCw size={14} /> Try again</button>
          <Link className="button small" href="/editor"><PenLine size={14} /> Open the editor</Link>
        </div>
      </div>
    )}

    {loading && (
      <div className="tg-grid" role="status" aria-label="Loading templates">
        {Array.from({ length: preview ? 4 : 8 }, (_, i) => <div className="tg-skeleton" key={i}><div /><span /><span /></div>)}
      </div>
    )}

    {!loading && !failed && filtered.length > 0 && (
      <section aria-labelledby="tg-results-title">
      <h2 id="tg-results-title" className="tg-sr">{category === ALL ? "All email templates" : `${category} templates`}</h2>
      <div className="tg-grid">
        {filtered.map((item, index) => (
          <article className="tg-card thumb-host" key={item.id}>
            <div className="tg-thumb">
              <EmailThumbnail doc={item.content} label={item.name} />
              <div className="tg-hover">
                <button type="button" className="button secondary small" onClick={() => show(index, filtered)}><Eye size={15} /> Preview</button>
                <Link className="button small" href={`/editor?template=${item.id}`} rel="nofollow"><PenLine size={15} /> Use template</Link>
              </div>
              <button type="button" className="tg-thumb-hit" aria-label={`Preview ${item.name}`} onClick={() => show(index, filtered)} />
            </div>
            <div className="tg-meta">
              <h3>
                <a href={`/templates?preview=${item.id}`} title={templateHeadline(item) || undefined} onClick={event => { event.preventDefault(); show(index, filtered); }}>{item.name}</a>
              </h3>
              <p>{item.category}</p>
            </div>
          </article>
        ))}
      </div>
      </section>
    )}

    {!loading && !failed && !filtered.length && (
      <div className="tg-empty">
        <Search size={24} />
        <h3>No templates match “{search || category}”.</h3>
        <p>Try another word or category.</p>
        <button type="button" className="button secondary small" onClick={clear}>Show all templates</button>
      </div>
    )}

    {open >= 0 && <PreviewDialog entries={filtered} index={open} onClose={() => show(-1, filtered)} onMove={move} />}
  </>;
}
