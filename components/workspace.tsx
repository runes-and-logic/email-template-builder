"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { cloudMode } from "@/lib/config";
import { uploadImage } from "@/lib/uploads";
import { EmailChecks } from "./email-checks";
import { AssetLibrary } from "./asset-library";
import Link from "next/link";
import {
  AlignLeft,
  Heading1,
  ImageIcon,
  MousePointer2,
  Minus,
  Square,
  Columns2,
  Columns3,
  Link2,
  Stamp,
  PanelBottom,
  ShoppingBag,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  Eye,
  GripVertical,
  Layers,
  Monitor,
  Plus,
  Redo2,
  Save,
  Smartphone,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { templates } from "@/lib/data";
import { blockHtml, documentHtml } from "@/lib/email";
import {
  blockKinds,
  defaultBrand,
  fonts,
  fromTemplate,
  makeBlock,
  readBrand,
  storeDocument,
  validBlock,
  validDocument,
  type Block,
  type BrandKit,
  type Document,
} from "@/lib/workspace";
const blockIcons = {
  Heading: Heading1,
  Paragraph: AlignLeft,
  Image: ImageIcon,
  Button: MousePointer2,
  Divider: Minus,
  Spacer: Square,
  "Two columns": Columns2,
  "Three columns": Columns3,
  "Social links": Link2,
  Logo: Stamp,
  Footer: PanelBottom,
  Product: ShoppingBag,
};
export function Workspace({
  initialId = "welcome",
  draftId,
}: {
  initialId?: string;
  draftId?: string;
}) {
  const source = templates.find((t) => t.id === initialId) || templates[0];
  const [doc, setDoc] = useState<Document>(() => fromTemplate(source));
  const [selected, setSelected] = useState("");
  const [brand, setBrand] = useState<BrandKit>(defaultBrand);
  const [past, setPast] = useState<Document[]>([]);
  const [future, setFuture] = useState<Document[]>([]);
  const [device, setDevice] = useState("desktop");
  const [tab, setTab] = useState("Content");
  const [savedBlocks, setSavedBlocks] = useState<Block[]>([]);
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [versions, setVersions] = useState<{ revision: number; content: Document; created_at: string }[]>([]);
  const [recovery, setRecovery] = useState<Document | null>(null);
  const revision = useRef(0);
  const resourceRevision = useRef(0);
  const scope = useRef("demo");
  const latest = useRef(doc);
  latest.current = doc;
  const pendingSave = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      await Promise.resolve();
      if (!active) return;
      let next = fromTemplate(source);
      try {
        if (cloudMode) {
          const account = await api<{ workspaceId: string }>("/api/account");
          scope.current = account.workspaceId;
          const [branding, blocks, saved] = await Promise.all([
            api<{ content: BrandKit | null }>("/api/resources/brand"),
            api<{ content: Block[] | null; revision: number }>("/api/resources/blocks"),
            draftId ? api<{ document: Document; revision: number }>(`/api/documents/${encodeURIComponent(draftId)}`) : Promise.resolve(null),
          ]);
          if (!active) return;
          if (branding.content) setBrand(branding.content);
          setSavedBlocks(blocks.content || []);
          resourceRevision.current = blocks.revision;
          if (saved) { next = saved.document; revision.current = saved.revision; }
          else {
            const catalog = await api<{ templates: { id: string; content: Document }[] }>("/api/catalog");
            const template = catalog.templates.find(item => item.id === initialId);
            if (!template) throw new ApiError(404, "This catalog template is unavailable.");
            next = { ...template.content, id: crypto.randomUUID(), source: template.id, modified: new Date().toISOString(), status: "Draft" };
            if (!active) return;
            const created = await api<{ revision: number }>("/api/documents", { method: "POST", body: JSON.stringify({ document: next, revision: 0 }) });
            revision.current = created.revision;
          }
        } else {
          if (draftId) {
            const raw = localStorage.getItem("postly-document-" + draftId);
            const parsed = raw ? JSON.parse(raw) : null;
            if (!validDocument(parsed)) { setMissing(true); return; }
            next = parsed;
          } else {
            const legacy = localStorage.getItem("postly-draft-" + initialId);
            if (legacy) {
              const data = JSON.parse(legacy);
              if (typeof data.title === "string" && typeof data.brand === "string") next = { ...fromTemplate(source, data), id: crypto.randomUUID() };
            }
          }
          setBrand(readBrand());
          const blocks = JSON.parse(localStorage.getItem("postly-blocks") || "[]");
          if (Array.isArray(blocks)) setSavedBlocks(blocks.filter(validBlock));
          if (!draftId) storeDocument(next);
        }
        if (!active) return;
        const recoveryKey = `postly-recovery-${scope.current}-${next.id}`;
        try {
          const raw = localStorage.getItem(recoveryKey);
          if (raw) {
            const saved = JSON.parse(raw);
            if (validDocument(saved) && (!draftId || saved.id === draftId) && saved.modified > next.modified) setRecovery(saved);
          }
        } catch { setNotice("Browser recovery is unavailable. Cloud saves are still available."); }
        setDoc(next);
        window.history.replaceState(null, "", `/editor?draft=${encodeURIComponent(next.id)}&template=${encodeURIComponent(source.id)}`);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 404) setMissing(true);
        else { setMissing(true); setNotice(error instanceof Error ? error.message : "Unable to load this email."); }
      } finally { if (active) setLoaded(true); }
    }
    void load();
    return () => { active = false; };
  }, [draftId, initialId, source]);
  // Recovery writes precede the network save and remain available on failed/conflicting requests.
  useEffect(() => {
    if (!loaded || !dirty || missing) return;
    try {
      localStorage.setItem(`postly-recovery-${scope.current}-${doc.id}`, JSON.stringify({ ...doc, modified: new Date().toISOString() }));
    } catch { setNotice("Recovery storage is unavailable. Save or export your work."); }
  }, [doc, dirty, loaded, missing, draftId, initialId]);
  useEffect(() => {
    if (preview) dialog.current?.showModal();
    else dialog.current?.close();
  }, [preview]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const block = doc.blocks.find((b) => b.id === selected);
  function change(next: Document) {
    setPast((p) => [...p.slice(-49), doc]);
    setFuture([]);
    setDoc(next);
    setDirty(true);
  }
  function patch(values: Partial<Block>) {
    if (block)
      change({
        ...doc,
        blocks: doc.blocks.map((b) =>
          b.id === block.id ? { ...b, ...values } : b,
        ),
      });
  }
  function add(b: Block) {
    const index = doc.blocks.findIndex((item) => item.id === selected);
    const blocks = [...doc.blocks];
    blocks.splice(index < 0 ? blocks.length : index + 1, 0, b);
    change({ ...doc, blocks });
    setSelected(b.id);
  }
  function move(id: string, target: number) {
    const blocks = [...doc.blocks];
    const index = blocks.findIndex((b) => b.id === id);
    if (index < 0 || target < 0 || target >= blocks.length || index === target)
      return;
    const [item] = blocks.splice(index, 1);
    blocks.splice(target, 0, item);
    change({ ...doc, blocks });
  }
  const save = useCallback(async () => {
    if (!loaded || missing || conflict || pendingSave.current) return;
    const snapshot = latest.current;
    const next = { ...snapshot, status: "Saved" as const, modified: new Date().toISOString() };
    if (!validDocument(next)) { setNotice("Check the email name and content limits before saving."); return; }
    pendingSave.current = true;
    setSaveFailed(false);
    setSaving(true);
    try {
      if (cloudMode) {
        const result = await api<{ revision: number }>("/api/documents", { method: "POST", body: JSON.stringify({ document: next, revision: revision.current }) });
        revision.current = result.revision;
      } else storeDocument(next);
      if (latest.current === snapshot) {
        setDoc(next);
        setDirty(false);
        try { localStorage.removeItem(`postly-recovery-${scope.current}-${snapshot.id}`); } catch { /* Saved document is already durable. */ }
      }
      setNotice(cloudMode ? "Saved to your workspace." : "Saved in this browser. Find it in My Templates.");
    } catch (error) {
      setSaveFailed(true);
      if (error instanceof ApiError && error.status === 409) setConflict(true);
      setNotice(error instanceof Error ? error.message : "Unable to save. Export your work to keep a copy.");
    } finally { pendingSave.current = false; setSaving(false); }
  }, [loaded, missing, conflict]);
  useEffect(() => {
    if (!loaded || !dirty || saving || conflict || saveFailed || recovery) return;
    const timeout = setTimeout(() => void save(), 1200);
    return () => clearTimeout(timeout);
  }, [doc, dirty, loaded, saving, conflict, saveFailed, recovery, save]);
  function download() {
    const href = URL.createObjectURL(
      new Blob([documentHtml(doc)], { type: "text/html" }),
    );
    const a = document.createElement("a");
    a.href = href;
    a.download = `postly-${doc.id}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    setNotice("HTML exported with your blocks and styles.");
  }
  async function saveBlock() {
    if (!block) return;
    try {
      const blocks = [...savedBlocks, { ...block, id: crypto.randomUUID() }];
      if (cloudMode) {
        const result = await api<{ revision: number }>("/api/resources/blocks", { method: "PUT", body: JSON.stringify({ content: blocks, revision: resourceRevision.current }) });
        resourceRevision.current = result.revision;
      } else localStorage.setItem("postly-blocks", JSON.stringify(blocks));
      setSavedBlocks(blocks);
      setNotice("Block added to your reusable library.");
    } catch {
      setNotice("Unable to save block. Browser storage may be full.");
    }
  }
  function applyBrand() {
    change({
      ...doc,
      blocks: doc.blocks.map((b) => ({
        ...b,
        font: b.kind === "Heading" ? brand.heading : brand.body,
        ...(b.kind === "Button"
          ? { background: brand.primary, url: brand.website }
          : {}),
        ...(b.kind === "Logo"
          ? { text: brand.name, src: brand.logo, url: brand.website }
          : {}),
        ...(b.kind === "Footer"
          ? {
              text: `Sent with care by ${brand.name}.`,
              background: brand.secondary,
            }
          : {}),
        ...(b.kind === "Social links" ? { text: brand.socials } : {}),
      })),
    });
    setNotice("Brand Kit applied. Your other content is preserved.");
  }
  const textField = (
    label: string,
    key: "text" | "url" | "src" | "alt",
    multi = false,
  ) => (
    <label>
      {label}
      {multi ? (
        <textarea
          aria-label={label}
          value={block?.[key] || ""}
          onChange={(e) => patch({ [key]: e.target.value })}
        />
      ) : (
        <input
          aria-label={label}
          value={block?.[key] || ""}
          onChange={(e) => patch({ [key]: e.target.value })}
        />
      )}
    </label>
  );
  const numberField = (
    label: string,
    key:
      | "size"
      | "weight"
      | "lineHeight"
      | "padding"
      | "radius"
      | "width"
      | "border"
      | "gap",
    min: number,
    max: number,
    step = 1,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={block?.[key] ?? min}
        onChange={(e) =>
          patch({ [key]: Math.min(max, Math.max(min, Number(e.target.value))) })
        }
      />
    </label>
  );
  if (!loaded)
    return (
      <section className="dashboard-loading" role="status">
        Opening your email workspace…
      </section>
    );
  if (missing) return <section className="container prose-page" role="alert"><h1>Email unavailable</h1><p>{notice || "This email was not found. Your existing work has not been replaced."}</p><Link className="button" href="/dashboard">Back to My Templates</Link></section>;
  if (!loaded) return <p className="container" role="status">Opening your workspace…</p>;
  return (
    <section className="studio" aria-label="Email editor" aria-busy={!loaded}>
      <header className="studio-top">
        <div>
          <Link href="/dashboard" className="studio-back">
            ← My Templates
          </Link>
          <input
            aria-label="Template name"
            maxLength={200}
            value={doc.name}
            onChange={(e) => change({ ...doc, name: e.target.value })}
          />
          <span className="workspace-meta">
            {dirty
              ? "Unsaved changes"
              : doc.status === "Saved"
                ? cloudMode ? "Saved to workspace" : "Saved locally"
                : "Draft · not yet saved"}
          </span>
        </div>
        <div className="studio-actions">
          <button
            className="icon-button"
            aria-label="Undo"
            disabled={!past.length}
            onClick={() => {
              setFuture((f) => [doc, ...f]);
              setDoc(past[past.length - 1]);
              setPast((p) => p.slice(0, -1));
              setDirty(true);
            }}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Redo"
            disabled={!future.length}
            onClick={() => {
              setPast((p) => [...p, doc]);
              setDoc(future[0]);
              setFuture((f) => f.slice(1));
              setDirty(true);
            }}
          >
            <Redo2 size={18} />
          </button>
          <button
            className="button secondary small"
            onClick={() => setPreview(true)}
          >
            <Eye size={16} />
            Preview email
          </button>
          <button
            className="button secondary small"
            onClick={save}
            disabled={!loaded || saving || missing || conflict}
          >
            <Save size={16} />
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button className="button small" onClick={download}>
            <Download size={16} />
            Export HTML
          </button>
        </div>
      </header>
      {recovery && <div className="inline-notice" role="status">An unsaved recovery copy is available. <button className="button secondary small" onClick={() => { change(recovery); setRecovery(null); }}>Recover changes</button><button className="text-link" onClick={() => { localStorage.removeItem(`postly-recovery-${scope.current}-${doc.id}`); setRecovery(null); }}>Discard recovery</button></div>}
      {conflict && <div className="inline-notice" role="alert">This email changed elsewhere. Export your current work before reloading. <button className="button secondary small" onClick={() => location.reload()}>Reload saved email</button></div>}
      <div className="email-metadata"><label>Subject<input maxLength={200} value={doc.subject || ""} onChange={e => change({ ...doc, subject: e.target.value })} /></label><label>Preview text<input maxLength={300} value={doc.preheader || ""} onChange={e => change({ ...doc, preheader: e.target.value })} /></label></div>
      <EmailChecks document={doc} />
      {cloudMode && <details className="version-history"><summary onClick={async () => {
        try { const result = await api<{ versions: typeof versions }>(`/api/documents/${encodeURIComponent(doc.id)}/versions`); setVersions(result.versions); }
        catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load history."); }
      }}>Version history</summary>{versions.map(version => <p key={version.revision}>Revision {version.revision} · {new Date(version.created_at).toLocaleString()} <button className="text-link" onClick={() => change({ ...version.content, id: doc.id })}>Restore as new revision</button></p>)}</details>}
      <div className="studio-grid">
        <aside className="studio-library">
          <div className="studio-panel-title">
            <Layers size={17} /> Build your email
          </div>
          <div className="studio-tabs" role="group" aria-label="Block library">
            {["Content", "Layouts", "Saved", "Sections"].map((t) => (
              <button
                key={t}
                aria-pressed={t === tab}
                className={t === tab ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Content" || tab === "Layouts" ? (
            <>
              <p className="studio-hint">
                Click to add after the selected block.
              </p>
              <div className="studio-blocks">
                {blockKinds
                  .filter((k) =>
                    tab === "Layouts"
                      ? k.includes("columns")
                      : !k.includes("columns"),
                  )
                  .map((kind) => {
                    const Icon = blockIcons[kind];
                    return (
                      <button
                        key={kind}
                        onClick={() => add(makeBlock(kind, brand))}
                      >
                        <Icon size={18} />
                        {kind}
                      </button>
                    );
                  })}
              </div>
            </>
          ) : tab === "Saved" ? (
            <div className="studio-saved">
              {savedBlocks.length ? (
                savedBlocks.map((b, i) => (
                  <div key={b.id}>
                    <button
                      onClick={() => add({ ...b, id: crypto.randomUUID() })}
                    >
                      {b.kind}: {b.text.slice(0, 32) || b.alt}
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete saved block ${i + 1}`}
                      onClick={async () => {
                        try {
                          const next = savedBlocks.filter((x) => x.id !== b.id);
                          try {
                            if (cloudMode) {
                              const result = await api<{ revision: number }>("/api/resources/blocks", { method: "PUT", body: JSON.stringify({ content: next, revision: resourceRevision.current }) });
                              resourceRevision.current = result.revision;
                            } else localStorage.setItem("postly-blocks", JSON.stringify(next));
                          } catch (error) { setNotice(error instanceof Error ? error.message : "Could not remove block."); return; }
                          setSavedBlocks(next);
                        } catch {
                          setNotice("Could not update saved blocks.");
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="studio-hint">
                  Your reusable blocks live here. Select a block and choose
                  “Save block”.
                </p>
              )}
            </div>
          ) : (
            <div className="section-list">
              {doc.blocks.map((b, i) => (
                <button
                  key={b.id}
                  className={selected === b.id ? "active" : ""}
                  onClick={() => setSelected(b.id)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {b.kind}
                </button>
              ))}
            </div>
          )}
          <div className="studio-brand">
            <span className="eyebrow">CONSISTENTLY YOU</span>
            <h3>Your brand, every email.</h3>
            <p>Apply your saved logo, colors, fonts and links.</p>
            <button className="button secondary small" onClick={applyBrand}>
              Apply Brand Kit
            </button>
            <Link href="/brand">Edit Brand Kit ↗</Link>
          </div>
        </aside>
        <div className="studio-canvas-area">
          <div className="studio-canvas-toolbar">
            <div className="device-switch">
              <button
                aria-label="Desktop preview"
                aria-pressed={device === "desktop"}
                className={device === "desktop" ? "active" : ""}
                onClick={() => setDevice("desktop")}
              >
                <Monitor size={17} />
              </button>
              <button
                aria-label="Mobile preview"
                aria-pressed={device === "mobile"}
                className={device === "mobile" ? "active" : ""}
                onClick={() => setDevice("mobile")}
              >
                <Smartphone size={17} />
              </button>
            </div>
            <span>
              {device === "mobile"
                ? "Mobile · 375px"
                : `Desktop · ${doc.width}px`}
            </span>
            <button
              className="text-link"
              onClick={() => setShowCode(!showCode)}
            >
              {showCode ? "Show canvas" : "View HTML"}
            </button>
          </div>
          <div
            className={`studio-canvas-scroll ${device === "mobile" ? "mobile-preview" : ""}`}
            style={{ background: doc.background }}
          >
            {showCode ? (
              <pre className="studio-code">{documentHtml(doc)}</pre>
            ) : (
              <div
                className="studio-email"
                style={{ width: device === "mobile" ? 375 : doc.width }}
              >
                {doc.blocks.map((b, i) => (
                  <div
                    key={b.id}
                    className={`studio-block ${selected === b.id ? "selected" : ""}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (drag.current) move(drag.current, i);
                      drag.current = null;
                    }}
                  >
                    <div className="block-controls">
                      <button
                        className="icon-button"
                        draggable
                        onDragStart={(e) => {
                          drag.current = b.id;
                          e.dataTransfer.setData("text/plain", b.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        aria-label={`Drag ${b.kind}`}
                      >
                        <GripVertical size={14} />
                      </button>
                      <span>{b.kind}</span>
                      <button
                        className="icon-button"
                        aria-label={`Move ${b.kind} up`}
                        disabled={i === 0}
                        onClick={() => move(b.id, i - 1)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${b.kind} down`}
                        disabled={i === doc.blocks.length - 1}
                        onClick={() => move(b.id, i + 1)}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Duplicate ${b.kind}`}
                        onClick={() => {
                          const blocks = [...doc.blocks];
                          blocks.splice(i + 1, 0, {
                            ...b,
                            id: crypto.randomUUID(),
                          });
                          change({ ...doc, blocks });
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${b.kind}`}
                        onClick={() =>
                          change({
                            ...doc,
                            blocks: doc.blocks.filter((x) => x.id !== b.id),
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(b.id);
                        }
                      }}
                      className="block-select"
                      aria-label={`Edit ${b.kind} block ${i + 1}`}
                      aria-pressed={selected === b.id}
                      onClick={() => setSelected(b.id)}
                    >
                      <span
                        className="block-render"
                        inert
                        dangerouslySetInnerHTML={{ __html: blockHtml(b) }}
                      />
                    </div>
                  </div>
                ))}
                {!doc.blocks.length && (
                  <div className="studio-empty">
                    <Plus size={28} />
                    <h3>A fresh canvas.</h3>
                    <p>Add your first content block from the library.</p>
                    <button
                      className="button secondary"
                      onClick={() => add(makeBlock("Heading", brand))}
                    >
                      Add heading
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="studio-canvas-footer">
            {doc.blocks.length} blocks{" "}
            <span>{cloudMode ? "Saved to your workspace · Export or send a test email" : "Stored on this device · No email delivery"}</span>
          </div>
        </div>
        <aside className="studio-inspector">
          <div className="studio-panel-title">
            {block ? `${block.kind} settings` : "Email settings"}
          </div>
          <div className="inspector-fields edit-fields">
            {block ? (
              <>
                <button className="text-link" onClick={() => setSelected("")}>
                  ← Email settings
                </button>
                {![
                  "Image",
                  "Divider",
                  "Spacer",
                  "Two columns",
                  "Three columns",
                ].includes(block.kind) &&
                  textField(
                    block.kind === "Heading"
                      ? "Headline"
                      : block.kind === "Button"
                        ? "Button text"
                        : block.kind === "Social links"
                          ? "Social URLs (one per line)"
                          : "Text",
                    "text",
                    true,
                  )}
                {["Image", "Logo", "Product"].includes(block.kind) && (
                  <>
                    {textField("Image URL", "src")}
                    {textField("Alt text", "alt")}
                    {cloudMode && <AssetLibrary onSelect={src => patch({ src })} />}
                    <label>
                      Upload image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (
                            file.size > 1500000 ||
                            !/^image\/(png|jpeg|webp|gif)$/.test(file.type)
                          ) {
                            setNotice(
                              "Choose a PNG, JPEG, WebP or GIF under 1.5 MB.",
                            );
                            return;
                          }
                          const id = block.id;
                          uploadImage(file).then(src => {
                            const current = latest.current;
                            if (!current.blocks.some(item => item.id === id)) return;
                            setPast(past => [...past.slice(-49), current]);
                            setFuture([]);
                            setDoc({ ...current, blocks: current.blocks.map(item => item.id === id ? { ...item, src } : item) });
                            setDirty(true);
                          }).catch(error => setNotice(error instanceof Error ? error.message : "Image upload failed."));
                        }}
                      />
                    </label>
                    <p className="field-help">
                      {cloudMode ? "Uploads use public HTTPS URLs for email compatibility." : "Uploaded images are embedded. For broad email compatibility, use a publicly hosted HTTPS image URL."}
                    </p>
                    {numberField("Image width (%)", "width", 10, 100)}
                  </>
                )}
                {["Button", "Image", "Logo", "Product"].includes(block.kind) &&
                  textField(
                    block.kind === "Button" ? "Button link" : "Link URL",
                    "url",
                  )}
                {(block.kind === "Two columns" ||
                  block.kind === "Three columns") &&
                  block.columns.map((c, i) => (
                    <label key={i}>
                      Column {i + 1}
                      <textarea
                        aria-label={`Column ${i + 1}`}
                        value={c}
                        onChange={(e) =>
                          patch({
                            columns: block.columns.map((v, j) =>
                              i === j ? e.target.value : v,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                {!["Image", "Divider", "Spacer"].includes(block.kind) && (
                  <>
                    <label>
                      Font family
                      <select
                        value={block.font}
                        onChange={(e) => patch({ font: e.target.value })}
                      >
                        {fonts.map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </label>
                    <div className="field-pair">
                      {numberField("Font size", "size", 8, 72)}
                      {numberField("Font weight", "weight", 100, 900, 100)}
                    </div>
                    {numberField("Line height", "lineHeight", 1, 3, 0.1)}
                  </>
                )}
                <label>
                  Alignment
                  <select
                    value={block.align}
                    onChange={(e) =>
                      patch({ align: e.target.value as Block["align"] })
                    }
                  >
                    {["left", "center", "right"].map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
                <div className="field-pair">
                  <label>
                    Text color
                    <input
                      type="color"
                      value={block.color}
                      onChange={(e) => patch({ color: e.target.value })}
                    />
                  </label>
                  <label>
                    Background
                    <input
                      type="color"
                      value={block.background}
                      onChange={(e) => patch({ background: e.target.value })}
                    />
                  </label>
                </div>
                <div className="field-pair">
                  {numberField("Padding (px)", "padding", 0, 80)}
                  {numberField("Radius (px)", "radius", 0, 50)}
                </div>
                <div className="field-pair">
                  {numberField("Border (px)", "border", 0, 10)}
                  {numberField(
                    block.kind === "Button" ? "Button padding" : "Spacing (px)",
                    "gap",
                    0,
                    64,
                  )}
                </div>
                <button className="button secondary small" onClick={saveBlock}>
                  <Save size={15} />
                  Save block
                </button>
              </>
            ) : (
              <>
                <p className="field-help">
                  Select a block on the canvas to edit its content and
                  appearance.
                </p>
                <label>
                  Email background
                  <input
                    type="color"
                    value={doc.background}
                    onChange={(e) =>
                      change({ ...doc, background: e.target.value })
                    }
                  />
                </label>
                <label>
                  Content width (px)
                  <input
                    type="number"
                    min={320}
                    max={800}
                    value={doc.width}
                    onChange={(e) =>
                      change({
                        ...doc,
                        width: Math.min(
                          800,
                          Math.max(320, Number(e.target.value)),
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Category
                  <select
                    value={doc.category}
                    onChange={(e) =>
                      change({ ...doc, category: e.target.value })
                    }
                  >
                    {Array.from(new Set(templates.map((t) => t.category))).map(
                      (c) => (
                        <option key={c}>{c}</option>
                      ),
                    )}
                  </select>
                </label>
                <div className="inspector-empty">
                  <Eye size={26} />
                  <h3>Every detail, in view.</h3>
                  <p>Use Preview email to see the exact HTML you’ll export.</p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
      {notice && (
        <div className="workspace-notice" role="status">
          <Check size={16} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="email-preview-modal"
        onCancel={() => setPreview(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setPreview(false);
        }}
        aria-label="Email preview"
      >
        <div className="dialog-header">
          <h3>{doc.name}</h3>
          <div className="studio-actions">
            <button
              className="button secondary small"
              onClick={() =>
                setDevice(device === "mobile" ? "desktop" : "mobile")
              }
            >
              {device === "mobile" ? "Desktop" : "Mobile"}
            </button>
            <button
              className="icon-button"
              aria-label="Close preview"
              onClick={() => setPreview(false)}
            >
              <X />
            </button>
          </div>
        </div>
        <iframe
          title="Exported email preview"
          sandbox=""
          srcDoc={documentHtml(doc)}
          style={{
            width: device === "mobile" ? 375 : Math.min(doc.width + 48, 848),
          }}
        />
      </dialog>
    </section>
  );
}
