"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Copy,
  FileText,
  Plus,
  Search,
  Trash2,
  Pencil,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { cloudMode } from "@/lib/config";
import { CloudDashboard } from "./cloud-dashboard";
import { templates } from "@/lib/data";
import { previewHtml } from "@/lib/email";
import {
  fromTemplate,
  readDocuments,
  storeDocument,
  type Document,
} from "@/lib/workspace";
export function Dashboard() { return cloudMode ? <CloudDashboard /> : <LocalDashboard />; }
function LocalDashboard() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All categories");
  const [notice, setNotice] = useState("");
  const [rename, setRename] = useState("");
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState("");
  useEffect(() => {
    try {
      // Bring legacy drafts into the dashboard without removing the original records.
      for (const t of templates) {
        const raw = localStorage.getItem("postly-draft-" + t.id);
        if (raw && !localStorage.getItem("postly-document-" + t.id)) {
          try {
          const value = JSON.parse(raw);
          if (
            typeof value.title === "string" &&
            typeof value.brand === "string"
          )
            storeDocument(fromTemplate(t, value));
          } catch { /* A damaged legacy record must not hide healthy documents. */ }
        }
      }
      setDocs(readDocuments());
    } catch {
      setNotice(
        "Some saved data could not be read. Browser storage may be unavailable.",
      );
    }
    setLoading(false);
  }, []);
  function persist(next: Document) {
    try {
      storeDocument(next);
      setDocs((all) =>
        [next, ...all.filter((d) => d.id !== next.id)].sort((a, b) =>
          b.modified.localeCompare(a.modified),
        ),
      );
      return true;
    } catch {
      setNotice("Could not save. Browser storage is full or unavailable.");
      return false;
    }
  }
  const filtered = docs.filter(
    (d) =>
      (status === "All" || d.status === status) &&
      (category === "All categories" || d.category === category) &&
      `${d.name} ${d.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <section className="workspace-heading container">
        <div>
          <span className="eyebrow">YOUR CREATIVE WORKSPACE</span>
          <h1>My Templates</h1>
          <p>
            A home for your next great email. Saved on this browser, ready when
            you are.
          </p>
        </div>
        <div className="studio-actions">
          <Link className="button secondary" href="/brand">
            Brand Kit
          </Link>
          <button
            className="button"
            onClick={() => {
              const doc = {
                ...fromTemplate(templates[0]),
                id: crypto.randomUUID(),
                name: "Untitled email",
                blocks: [],
              };
              if (persist(doc)) location.assign(`/editor?draft=${doc.id}`);
            }}
          >
            <Plus size={17} />
            Create new template
          </button>
        </div>
      </section>
      <section className="container dashboard-content">
        <div className="dashboard-stats">
          <div>
            <FileText size={19} />
            <strong>{docs.length}</strong>
            <span>Templates</span>
          </div>
          <div>
            <Clock size={19} />
            <strong>{docs.filter((d) => d.status === "Draft").length}</strong>
            <span>Drafts</span>
          </div>
          <div>
            <span className="status-dot" />
            <strong>Local workspace</strong>
            <span>No account or subscription needed</span>
          </div>
        </div>
        <div className="dashboard-filters">
          <div className="studio-tabs">
            {["All", "Saved", "Draft"].map((s) => (
              <button
                key={s}
                className={s === status ? "active" : ""}
                aria-pressed={s === status}
                onClick={() => setStatus(s)}
              >
                {s === "All"
                  ? "Recently edited"
                  : s === "Draft"
                    ? "Drafts"
                    : "Saved templates"}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search saved templates"
              placeholder="Search your templates"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter saved category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["All categories", ...new Set(docs.map((d) => d.category))].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </div>
        {notice && (
          <p className="inline-notice" role="status">
            {notice}
          </p>
        )}
        {loading ? (
          <div className="dashboard-loading" role="status">
            Opening your workspace…
          </div>
        ) : filtered.length ? (
          <div className="dashboard-grid">
            {filtered.map((d) => (
              <article className="saved-card" key={d.id}>
                <Link
                  href={`/editor?draft=${d.id}&template=${d.source}`}
                  className="saved-preview"
                  aria-label={`Open ${d.name}`}
                >
                  <iframe loading="lazy"
                    title={`Preview of ${d.name}`}
                    srcDoc={previewHtml(d)}
                    sandbox=""
                    tabIndex={-1}
                  />
                  <span>
                    Continue editing <ArrowUpRight size={15} />
                  </span>
                </Link>
                <div className="saved-card-body">
                  <span className="saved-category">
                    {d.category} · {d.status}
                  </span>
                  {rename === d.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (
                          name.trim() &&
                          persist({
                            ...d,
                            name: name.trim(),
                            modified: new Date().toISOString(),
                          })
                        )
                          setRename("");
                      }}
                    >
                      <input
                        autoFocus
                        aria-label="New template name"
                        value={name}
                        required
                        onChange={(e) => setName(e.target.value)}
                      />
                      <button className="button secondary small">
                        Save name
                      </button>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setRename("")}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <h2>
                      <Link href={`/editor?draft=${d.id}&template=${d.source}`}>
                        {d.name}
                      </Link>
                    </h2>
                  )}
                  <p>
                    Edited{" "}
                    {new Date(d.modified).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className="saved-actions">
                    <button
                      onClick={() => {
                        setRename(d.id);
                        setName(d.name);
                      }}
                    >
                      <Pencil size={14} />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        if (
                          persist({
                            ...d,
                            id: crypto.randomUUID(),
                            name: d.name + " (copy)",
                            modified: new Date().toISOString(),
                            status: "Draft",
                          })
                        )
                          setNotice(
                            "Template duplicated, including all blocks and styles.",
                          );
                      }}
                    >
                      <Copy size={14} />
                      Duplicate
                    </button>
                    <button onClick={() => setDeleting(d.id)}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                  {deleting === d.id && (
                    <div className="delete-confirm">
                      <p>Delete “{d.name}” from this browser?</p>
                      <button
                        className="button secondary small"
                        onClick={() => setDeleting("")}
                      >
                        Keep template
                      </button>
                      <button
                        className="button small"
                        onClick={() => {
                          try {
                            localStorage.removeItem("postly-document-" + d.id);
                            localStorage.removeItem("postly-draft-" + d.id);
                            setDocs((all) => all.filter((x) => x.id !== d.id));
                            setDeleting("");
                            setNotice("Template deleted.");
                          } catch {
                            setNotice("Could not delete this template.");
                          }
                        }}
                      >
                        Delete template
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <div className="empty-icon">
              <FileText size={30} />
            </div>
            <span className="eyebrow">
              A LITTLE INSPIRATION GOES A LONG WAY
            </span>
            <h2>
              {docs.length
                ? "No matching templates."
                : "Your first email starts here."}
            </h2>
            <p>
              {docs.length
                ? "Try another search or category."
                : "Choose a professionally designed template, make it yours, and save it here for next time."}
            </p>
            <Link className="button" href="/templates">
              Explore templates <ArrowUpRight size={16} />
            </Link>
            {docs.length > 0 && (
              <button
                className="text-link"
                onClick={() => {
                  setSearch("");
                  setStatus("All");
                  setCategory("All categories");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        <p className="workspace-storage-note">
          Templates and images are stored only in this browser. Clearing browser
          data removes them. Export HTML to keep a copy.
        </p>
      </section>
    </>
  );
}
