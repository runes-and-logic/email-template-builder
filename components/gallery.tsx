"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  X,
  LayoutGrid,
  Check,
  Eye,
} from "lucide-react";
import { templates, templateCategories, type Template } from "@/lib/data";
import { cloudMode } from "@/lib/config";
import { CloudGallery } from "./cloud-gallery";
import { EmailPreview } from "./email-preview";
export function Gallery(props: { preview?: boolean; initialCategory?: string }) {
  return cloudMode ? <CloudGallery {...props} /> : <LocalGallery {...props} />;
}
function LocalGallery({
  preview = false,
  initialCategory = "All templates",
}: {
  preview?: boolean;
  initialCategory?: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("curated");
  const [selected, setSelected] = useState<Template | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const categories = [
    "All templates",
    ...(preview ? templateCategories.slice(0, 3) : templateCategories),
  ];
  let filtered = templates.filter(
    (t) =>
      (category === "All templates" || t.category === category) &&
      `${t.name} ${t.category} ${t.subtitle}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  if (sort === "az")
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  if (preview) filtered = filtered.slice(0, 4);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selected]);
  return (
    <>
      <div className="gallery-controls">
        <div
          className="category-tabs"
          role="group"
          aria-label="Filter templates"
        >
          {categories.map((c) => (
            <button
              className={category === c ? "active" : ""}
              aria-pressed={category === c}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c === "All templates" && <LayoutGrid size={13} />} {c}
            </button>
          ))}
        </div>
        {preview ? (
          <Link className="text-link" href="/templates">
            View all templates <ArrowUpRight size={15} />
          </Link>
        ) : (
          <div className="search-sort">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Search templates"
                placeholder="Find your next email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Sort templates"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="curated">Curated for you</option>
              <option value="az">Name: A–Z</option>
            </select>
          </div>
        )}
      </div>
      <div className="template-grid">
        {filtered.map((t) => (
          <article className="template-card" key={t.id}>
            <button
              className={`template-thumb thumb-${t.theme}`}
              onClick={() => setSelected(t)}
              aria-label={`Preview ${t.name}`}
            >
              <div className="thumbnail-email">
                <EmailPreview template={t} mini />
              </div>
              <span className="preview-overlay">
                <Eye size={15} /> Preview template
              </span>
            </button>
            <div className="template-info">
              <div>
                <h3>
                  <button onClick={() => setSelected(t)}>{t.name}</button>
                </h3>
                <p>{t.category}</p>
                <p className="template-description">{t.subtitle}</p>
              </div>
              <Link
                href={`/editor?template=${t.id}`}
                className="template-use"
                aria-label={`Use ${t.name}`}
              >
                <span>Customize</span>
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={32} />
          <h3>No templates found</h3>
          <p>Try a different phrase or explore another category.</p>
          <button
            className="button secondary"
            onClick={() => {
              setSearch("");
              setCategory("All templates");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="template-dialog-title"
        className="preview-dialog"
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setSelected(null);
        }}
      >
        {selected && (
          <>
            <div className="dialog-header">
              <div>
                <h3 id="template-dialog-title">{selected.name}</h3>
                <p>{selected.category} · Responsive email template</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label="Close preview"
              >
                <X />
              </button>
            </div>
            <div className="dialog-email">
              <EmailPreview template={selected} />
            </div>
            <div className="dialog-footer">
              <span>
                <Check size={14} /> Ready to make your own
              </span>
              <Link className="button" href={`/editor?template=${selected.id}`}>
                Use this template <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
