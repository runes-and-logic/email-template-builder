"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, LayoutGrid, PenLine, RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api";
import { type Document } from "@/lib/workspace";
import { documentHtml } from "@/lib/email";
type Entry = { id: string; name: string; category: string; content: Document };
export function CloudGallery({ preview = false, initialCategory = "All templates" }: { preview?: boolean; initialCategory?: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("curated");
  const [selected, setSelected] = useState<Entry | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    api<{ templates: Entry[] }>("/api/catalog")
      .then(result => setEntries(result.templates))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  useEffect(() => { if (selected) dialog.current?.showModal(); else dialog.current?.close(); }, [selected]);
  const categories = ["All templates", ...new Set(entries.map(item => item.category))];
  let filtered = entries.filter(item => (category === "All templates" || category === item.category) && `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  if (sort === "az") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (preview) filtered = filtered.slice(0, 4);
  return <>
    {!failed && <div className="gallery-controls">
      <div className="category-tabs" role="group" aria-label="Filter templates">
        {(preview ? categories.slice(0, 4) : categories).map(item => <button aria-pressed={item === category} className={item === category ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item === "All templates" && <LayoutGrid size={13} />} {item}</button>)}
      </div>
      {preview
        ? <Link className="text-link" href="/templates">View all templates <ArrowUpRight size={15} /></Link>
        : <div className="search-sort">
          <label className="cloud-search"><Search size={16} /><input aria-label="Search templates" placeholder="Find your next email…" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <select aria-label="Sort templates" value={sort} onChange={event => setSort(event.target.value)}><option value="curated">Curated for you</option><option value="az">Name: A–Z</option></select>
        </div>}
    </div>}
    {failed && <div className="service-fallback" role="alert">
      <LayoutGrid size={22} />
      <div><h3>Templates are taking a short break.</h3><p>We couldn’t load the template catalog right now. You can try again, or start designing from a blank canvas.</p></div>
      <div className="service-fallback-actions">
        <button className="button secondary small" onClick={load}><RefreshCw size={14} /> Try again</button>
        <Link className="button small" href="/editor"><PenLine size={14} /> Start from blank</Link>
      </div>
    </div>}
    {loading && <div className="template-grid" role="status" aria-label="Loading templates">{Array.from({ length: 4 }, (_, i) => <div className="skeleton-card" key={i}><div /><span /><span /></div>)}</div>}
    {!loading && !failed && <div className="template-grid">{filtered.map(item => <article className="template-card" key={item.id}>
      <button className="template-thumb" aria-label={`Preview ${item.name}`} onClick={() => setSelected(item)}>
        <iframe className="canonical-preview canonical-mini" sandbox="" loading="lazy" tabIndex={-1} title={`Preview ${item.name}`} srcDoc={documentHtml(item.content)} />
        <span className="preview-overlay"><Eye size={15} /> Preview template</span>
      </button>
      <div className="template-info"><div><h3><button onClick={() => setSelected(item)}>{item.name}</button></h3><p>{item.category}</p></div><Link className="template-use" href={`/editor?template=${item.id}`} aria-label={`Use ${item.name}`}><span>Customize</span><ArrowUpRight size={17} /></Link></div>
    </article>)}</div>}
    {!loading && !failed && !filtered.length && <div className="service-fallback"><Search size={22} /><div><h3>No templates match that search.</h3><p>Try a different word or category, or start from a blank canvas.</p></div><div className="service-fallback-actions"><button className="button secondary small" onClick={() => { setSearch(""); setCategory("All templates"); }}>Clear filters</button></div></div>}
    <dialog ref={dialog} className="preview-dialog" aria-label="Template preview" onCancel={() => setSelected(null)}>{selected && <><div className="dialog-header"><h3>{selected.name}</h3><button aria-label="Close preview" className="button secondary small" onClick={() => setSelected(null)}>Close</button></div><iframe className="canonical-preview" title={selected.name} sandbox="" srcDoc={documentHtml(selected.content)} /><Link className="button" href={`/editor?template=${selected.id}`}>Use this template</Link></>}</dialog>
  </>;
}
