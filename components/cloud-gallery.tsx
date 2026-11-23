"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { type Document } from "@/lib/workspace";
import { documentHtml } from "@/lib/email";
type Entry = { id: string; name: string; category: string; content: Document };
export function CloudGallery({ preview = false, initialCategory = "All templates" }: { preview?: boolean; initialCategory?: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("curated");
  const [selected, setSelected] = useState<Entry | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    api<{ templates: Entry[] }>("/api/catalog").then(result => {
      setEntries(result.templates);
    }).catch(error => setMessage(error.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (selected) dialog.current?.showModal(); else dialog.current?.close(); }, [selected]);
  let filtered = entries.filter(item => (category === "All templates" || category === item.category) && `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  if (sort === "az") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (preview) filtered = filtered.slice(0, 4);
  return <>
    <div className="gallery-controls"><div className="category-tabs" role="group" aria-label="Filter templates">{["All templates", ...new Set(entries.map(item => item.category))].map(item => <button aria-pressed={item === category} className={item === category ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <label>Search templates<input aria-label="Search templates" value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Sort templates" value={sort} onChange={event => setSort(event.target.value)}><option value="curated">Curated for you</option><option value="az">Name: A–Z</option></select>
    </div>
    {message && <p role="alert">{message}</p>}{loading && <p role="status">Loading templates…</p>}
    <div className="template-grid">{filtered.map(item => <article className="template-card" key={item.id}><button className="template-thumb" aria-label={`Preview ${item.name}`} onClick={() => setSelected(item)}><iframe className="canonical-preview canonical-mini" sandbox="" loading="lazy" tabIndex={-1} title={`Preview ${item.name}`} srcDoc={documentHtml(item.content)} /></button><div className="template-info"><div><h3><button onClick={() => setSelected(item)}>{item.name}</button></h3><p>{item.category}</p></div><Link href={`/editor?template=${item.id}`}>Customize</Link></div></article>)}</div>
    {!loading && !filtered.length && <p>No templates found.</p>}
    <dialog ref={dialog} className="preview-dialog" aria-label="Template preview" onCancel={() => setSelected(null)}>{selected && <><div className="dialog-header"><h3>{selected.name}</h3><button aria-label="Close preview" className="button secondary small" onClick={() => setSelected(null)}>Close</button></div><iframe className="canonical-preview" title={selected.name} sandbox="" srcDoc={documentHtml(selected.content)} /><Link className="button" href={`/editor?template=${selected.id}`}>Use this template</Link></>}</dialog>
  </>;
}
