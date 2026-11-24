"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { cloudMode } from "@/lib/config";
import { EditorLoading, EditorState, type LoadStage } from "./editor-loading";
import { uploadImage } from "@/lib/uploads";
import { EmailChecks } from "./email-checks";
import { AssetLibrary } from "./asset-library";
import "./studio.css";
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
  AlignCenter,
  AlignRight,
  Bookmark,
  CheckCircle2,
  CloudOff,
  Code2,
  History,
  Loader2,
  Monitor,
  MousePointerClick,
  Palette,
  Plus,
  Redo2,
  Settings2,
  SlidersHorizontal,
  Smartphone,
  Upload,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { templates } from "@/lib/data";
import { blockHtml, documentHtml, previewHtml } from "@/lib/email";
import {
  blockKinds,
  defaultBrand,
  fonts,
  applyBrandToBlock,
  fromTemplate,
  newBlock,
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
const BLANK = "blank";
/** An empty email: default settings from the base template, no blocks. */
function blankDocument(base: (typeof templates)[number]): Document {
  return { ...fromTemplate(base), id: crypto.randomUUID(), source: BLANK, name: "Untitled email", blocks: [], status: "Draft", modified: new Date().toISOString() };
}
export function Workspace({
  initialId = "welcome",
  draftId,
}: {
  initialId?: string;
  draftId?: string;
}) {
  const source = templates.find((t) => t.id === initialId) || templates[0];
  // /editor?template=blank starts an empty email instead of a designed template.
  const blank = initialId === BLANK;
  const [doc, setDoc] = useState<Document>(() => fromTemplate(source));
  const [selected, setSelected] = useState("");
  const [brand, setBrand] = useState<BrandKit>(defaultBrand);
  const [past, setPast] = useState<Document[]>([]);
  const [future, setFuture] = useState<Document[]>([]);
  const [device, setDevice] = useState("desktop");
  const [tab, setTab] = useState("Blocks");
  const [savedBlocks, setSavedBlocks] = useState<Block[]>([]);
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
  const [stage, setStage] = useState<LoadStage>("account");
  const [loadError, setLoadError] = useState("");
  const [limit, setLimit] = useState<{ plan: string; count: number } | null>(null);
  const planInfo = useRef<{ plan: string; count: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
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
      setLoadError("");
      setLimit(null);
      setMissing(false);
      try {
        if (cloudMode) {
          setStage("account");
          const account = await api<{ workspaceId: string; plan?: { name: string; document_limit: number } }>("/api/account");
          if (!active) return;
          scope.current = account.workspaceId;
          if (account.plan) planInfo.current = { plan: account.plan.name, count: account.plan.document_limit };
          setStage("resources");
          // Requests run in parallel; progress advances once brand + blocks arrive while the email is still loading.
          const resources = Promise.all([
            api<{ content: BrandKit | null }>("/api/resources/brand"),
            api<{ content: Block[] | null; revision: number }>("/api/resources/blocks"),
          ]).then(result => { if (active) setStage(current => (current === "resources" ? "document" : current)); return result; });
          const [[branding, blocks], saved] = await Promise.all([
            resources,
            draftId ? api<{ document: Document; revision: number }>(`/api/documents/${encodeURIComponent(draftId)}`) : Promise.resolve(null),
          ]);
          if (!active) return;
          if (branding.content) setBrand(branding.content);
          setSavedBlocks(blocks.content || []);
          resourceRevision.current = blocks.revision;
          if (saved) { next = saved.document; revision.current = saved.revision; }
          else {
            setStage("template");
            if (blank) next = blankDocument(source);
            else {
              const catalog = await api<{ templates: { id: string; content: Document }[] }>("/api/catalog");
              const template = catalog.templates.find(item => item.id === initialId);
              if (!template) throw new ApiError(404, "This catalog template is unavailable.");
              next = { ...template.content, id: crypto.randomUUID(), source: template.id, modified: new Date().toISOString(), status: "Draft" };
            }
            if (!active) return;
            const created = await api<{ revision: number }>("/api/documents", { method: "POST", body: JSON.stringify({ document: next, revision: 0 }) });
            revision.current = created.revision;
          }
        } else {
          setStage("document");
          if (draftId) {
            const raw = localStorage.getItem("postly-document-" + draftId);
            const parsed = raw ? JSON.parse(raw) : null;
            if (!validDocument(parsed)) { setMissing(true); return; }
            next = parsed;
          } else if (blank) {
            next = blankDocument(source);
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
        window.history.replaceState(null, "", `/editor?draft=${encodeURIComponent(next.id)}&template=${encodeURIComponent(blank ? BLANK : source.id)}`);
      } catch (error) {
        if (!active) return;
        // Signed out: go to sign in and come back to this exact email afterwards.
        if (error instanceof ApiError && error.status === 401) {
          setStage("signin");
          location.replace(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
          return;
        }
        // 402: creating this new email would exceed the plan's saved-email limit.
        if (error instanceof ApiError && error.status === 402) setLimit(planInfo.current || { plan: "current", count: 0 });
        else if (error instanceof ApiError && error.status === 404) setMissing(true);
        else setLoadError(error instanceof ApiError ? error.message : "We couldn’t reach Postly. Check your connection and try again.");
      }
      if (active) setLoaded(true);
    }
    void load();
    return () => { active = false; };
  }, [draftId, initialId, source, blank, attempt]);
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
  // Autosave runs after each edit; Cmd/Ctrl+S saves immediately.
  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
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
    } catch (error) {
      setSaveFailed(true);
      if (error instanceof ApiError && error.status === 409) setConflict(true);
      setNotice(error instanceof Error ? error.message : "Unable to save. Export your work to keep a copy.");
    } finally { pendingSave.current = false; setSaving(false); }
  }, [loaded, missing, conflict]);
  saveRef.current = () => void save();
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
    change({ ...doc, blocks: doc.blocks.map((b) => applyBrandToBlock(b, brand)) });
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
  if (!loaded) return <EditorLoading stage={stage} creating={cloudMode && !draftId} blank={blank} />;
  if (missing) return <EditorState kind="missing" />;
  if (limit) return <EditorState kind="limit" plan={limit.plan} limit={limit.count} />;
  if (loadError) return <EditorState kind="error" message={loadError} onRetry={() => { setLoaded(false); setAttempt(value => value + 1); }} />;
  const textKinds = !["Image", "Divider", "Spacer", "Two columns", "Three columns"].includes(block?.kind || "");
  const imageKinds = ["Image", "Logo", "Product"].includes(block?.kind || "");
  const typeKinds = !["Image", "Divider", "Spacer"].includes(block?.kind || "");
  const saveState = saving ? "saving" : saveFailed ? "failed" : dirty ? "dirty" : doc.status === "Saved" ? "saved" : "draft";
  const BlockIcon = block ? blockIcons[block.kind] : null;
  const colorField = (label: string, value: string, onChange: (value: string) => void) => (
    <label className="sx-color">
      <span>{label}</span>
      <span className="sx-color-input">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <code>{value.toUpperCase()}</code>
      </span>
    </label>
  );
  return (
    <section className="sx" aria-label="Email editor">
      <header className="sx-top">
        <div className="sx-title">
          <input
            aria-label="Email name"
            maxLength={200}
            value={doc.name}
            placeholder="Untitled email"
            onChange={(e) => change({ ...doc, name: e.target.value })}
          />
          <span className={`sx-status is-${saveState}`} role="status" aria-live="polite">
            {saveState === "saving" && <><Loader2 size={13} className="sx-spin" /> Saving…</>}
            {saveState === "failed" && <><CloudOff size={13} /> Not saved <button type="button" onClick={save}>Retry</button></>}
            {saveState === "dirty" && <><span className="sx-dot" /> Unsaved changes</>}
            {saveState === "saved" && <><CheckCircle2 size={13} /> {cloudMode ? "Saved" : "Saved on this device"}</>}
            {saveState === "draft" && <><span className="sx-dot" /> Draft</>}
          </span>
        </div>
        <div className="sx-actions">
          <div className="sx-history" role="group" aria-label="History">
            <button
              type="button"
              aria-label="Undo"
              title="Undo"
              disabled={!past.length}
              onClick={() => {
                setFuture((f) => [doc, ...f]);
                setDoc(past[past.length - 1]);
                setPast((p) => p.slice(0, -1));
                setDirty(true);
              }}
            >
              <Undo2 size={17} />
            </button>
            <button
              type="button"
              aria-label="Redo"
              title="Redo"
              disabled={!future.length}
              onClick={() => {
                setPast((p) => [...p, doc]);
                setDoc(future[0]);
                setFuture((f) => f.slice(1));
                setDirty(true);
              }}
            >
              <Redo2 size={17} />
            </button>
          </div>
          <button type="button" className="button secondary small" onClick={() => setPreview(true)}>
            <Eye size={16} /> <span>Preview</span>
          </button>
          <button type="button" className="button small" onClick={download}>
            <Download size={16} /> <span>Export HTML</span>
          </button>
        </div>
      </header>
      {recovery && <div className="sx-banner" role="status"><span>An unsaved copy of your recent changes is available.</span><button className="button secondary small" onClick={() => { change(recovery); setRecovery(null); }}>Restore changes</button><button className="sx-text-button" onClick={() => { localStorage.removeItem(`postly-recovery-${scope.current}-${doc.id}`); setRecovery(null); }}>Discard</button></div>}
      {conflict && <div className="sx-banner is-error" role="alert"><span>This email was changed somewhere else. Export your work before reloading.</span><button className="button secondary small" onClick={() => location.reload()}>Reload saved email</button></div>}
      <div className="sx-grid">
        <aside className="sx-library" aria-label="Block library">
          <div className="sx-tabs" role="group" aria-label="Library view">
            {["Blocks", "Saved", "Outline"].map((t) => (
              <button key={t} type="button" aria-pressed={t === tab} className={t === tab ? "active" : ""} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="sx-library-body">
            {tab === "Blocks" ? (
              <>
                {([["Content", blockKinds.filter((k) => !k.includes("columns"))], ["Layouts", blockKinds.filter((k) => k.includes("columns"))]] as const).map(([group, kinds]) => (
                  <div key={group} className="sx-group">
                    <p className="sx-group-title">{group}</p>
                    <div className="sx-blocks">
                      {kinds.map((kind) => {
                        const Icon = blockIcons[kind];
                        return (
                          <button key={kind} type="button" onClick={() => add(newBlock(kind, brand))} title={`Add ${kind}`}>
                            <Icon size={18} />
                            <span>{kind}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <p className="sx-hint">Blocks are added below the selected block.</p>
              </>
            ) : tab === "Saved" ? (
              savedBlocks.length ? (
                <ul className="sx-list">
                  {savedBlocks.map((b, i) => (
                    <li key={b.id}>
                      <button type="button" onClick={() => add({ ...b, id: crypto.randomUUID() })}>
                        <strong>{b.kind}</strong>
                        <span>{b.text.slice(0, 40) || b.alt || "—"}</span>
                      </button>
                      <button
                        type="button"
                        className="sx-icon"
                        aria-label={`Delete saved block ${i + 1}`}
                        onClick={async () => {
                          const next = savedBlocks.filter((x) => x.id !== b.id);
                          try {
                            if (cloudMode) {
                              const result = await api<{ revision: number }>("/api/resources/blocks", { method: "PUT", body: JSON.stringify({ content: next, revision: resourceRevision.current }) });
                              resourceRevision.current = result.revision;
                            } else localStorage.setItem("postly-blocks", JSON.stringify(next));
                            setSavedBlocks(next);
                          } catch (error) { setNotice(error instanceof Error ? error.message : "Could not remove block."); }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="sx-empty-note">
                  <Bookmark size={20} />
                  <p>Save any block to reuse it across emails. Select a block, then choose <strong>Save as reusable block</strong>.</p>
                </div>
              )
            ) : (
              <ol className="sx-outline">
                {doc.blocks.map((b, i) => {
                  const Icon = blockIcons[b.kind];
                  return (
                    <li key={b.id}>
                      <button type="button" className={selected === b.id ? "active" : ""} onClick={() => setSelected(b.id)}>
                        <span className="sx-outline-n">{i + 1}</span>
                        <Icon size={15} />
                        <span>{b.kind}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <div className="sx-brand">
            <button type="button" className="button secondary small" onClick={applyBrand}>
              <Palette size={15} /> Apply Brand Kit
            </button>
            <Link href="/brand">Edit</Link>
          </div>
        </aside>
        <div className="studio-canvas-area sx-canvas">
          <div className="studio-canvas-toolbar">
            <div className="device-switch">
              <button aria-label="Desktop preview" aria-pressed={device === "desktop"} className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}>
                <Monitor size={17} />
              </button>
              <button aria-label="Mobile preview" aria-pressed={device === "mobile"} className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}>
                <Smartphone size={17} />
              </button>
            </div>
            <span>{device === "mobile" ? "Mobile · 375px" : `Desktop · ${doc.width}px`} · {doc.blocks.length} blocks</span>
            <button className="sx-text-button" onClick={() => setShowCode(!showCode)}>
              <Code2 size={14} /> {showCode ? "Canvas" : "HTML"}
            </button>
          </div>
          <div className={`studio-canvas-scroll ${device === "mobile" ? "mobile-preview" : ""}`} style={{ background: doc.background }} onClick={(e) => { if (e.target === e.currentTarget) setSelected(""); }}>
            {showCode ? (
              <pre className="studio-code">{documentHtml(doc)}</pre>
            ) : (
              <div className="studio-email" style={{ width: device === "mobile" ? 375 : doc.width }}>
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
                      <button className="icon-button" aria-label={`Move ${b.kind} up`} disabled={i === 0} onClick={() => move(b.id, i - 1)}>
                        <ArrowUp size={14} />
                      </button>
                      <button className="icon-button" aria-label={`Move ${b.kind} down`} disabled={i === doc.blocks.length - 1} onClick={() => move(b.id, i + 1)}>
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Duplicate ${b.kind}`}
                        onClick={() => {
                          const blocks = [...doc.blocks];
                          blocks.splice(i + 1, 0, { ...b, id: crypto.randomUUID() });
                          change({ ...doc, blocks });
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <button className="icon-button" aria-label={`Remove ${b.kind}`} onClick={() => change({ ...doc, blocks: doc.blocks.filter((x) => x.id !== b.id) })}>
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
                      <span className="block-render" inert dangerouslySetInnerHTML={{ __html: blockHtml(b) }} />
                    </div>
                  </div>
                ))}
                {!doc.blocks.length && (
                  <div className="studio-empty">
                    <Plus size={28} />
                    <h3>A fresh canvas.</h3>
                    <p>Add your first block from the library.</p>
                    <button className="button secondary" onClick={() => add(newBlock("Heading", brand))}>
                      Add heading
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <aside className="sx-inspector" aria-label={block ? `${block.kind} settings` : "Email settings"}>
          {block && BlockIcon ? (
            <>
              <div className="sx-panel-head">
                <span className="sx-panel-icon"><BlockIcon size={16} /></span>
                <h2>{block.kind}</h2>
                <button type="button" className="sx-icon" aria-label="Close block settings" onClick={() => setSelected("")}>
                  <X size={16} />
                </button>
              </div>
              <div className="sx-fields">
                <section>
                  <h3>Content</h3>
                  {textKinds &&
                    textField(
                      block.kind === "Heading" ? "Headline" : block.kind === "Button" ? "Button text" : block.kind === "Social links" ? "Social links (one URL per line)" : "Text",
                      "text",
                      block.kind !== "Button",
                    )}
                  {imageKinds && (
                    <>
                      {textField("Image URL", "src")}
                      <div className="sx-upload">
                        <label className="button secondary small">
                          <Upload size={15} /> Upload image
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (!file) return;
                              if (file.size > 1500000 || !/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
                                setNotice("Choose a PNG, JPEG, WebP or GIF under 1.5 MB.");
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
                        {cloudMode && <AssetLibrary onSelect={src => patch({ src })} />}
                      </div>
                      {textField("Alt text", "alt")}
                    </>
                  )}
                  {["Button", "Image", "Logo", "Product"].includes(block.kind) && textField(block.kind === "Button" ? "Button link" : "Link", "url")}
                  {(block.kind === "Two columns" || block.kind === "Three columns") &&
                    block.columns.map((c, i) => (
                      <label key={i}>
                        Column {i + 1}
                        <textarea
                          aria-label={`Column ${i + 1}`}
                          value={c}
                          onChange={(e) => patch({ columns: block.columns.map((v, j) => (i === j ? e.target.value : v)) })}
                        />
                      </label>
                    ))}
                  {block.kind === "Divider" || block.kind === "Spacer" ? <p className="sx-hint">Adjust spacing and color below.</p> : null}
                </section>
                <section>
                  <h3>Style</h3>
                  <div className="sx-field">
                    <span>Alignment</span>
                    <div className="sx-segmented" role="group" aria-label="Alignment">
                      {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([value, Icon]) => (
                        <button key={value} type="button" aria-label={`Align ${value}`} aria-pressed={block.align === value} className={block.align === value ? "active" : ""} onClick={() => patch({ align: value })}>
                          <Icon size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sx-pair">
                    {!["Image", "Spacer"].includes(block.kind) && colorField(block.kind === "Button" ? "Text" : block.kind === "Divider" ? "Line" : "Text color", block.color, (color) => patch({ color }))}
                    {colorField(block.kind === "Button" ? "Button" : "Background", block.background, (background) => patch({ background }))}
                  </div>
                  {typeKinds && numberField("Font size", "size", 8, 72)}
                  {imageKinds && numberField("Image width (%)", "width", 10, 100)}
                  {block.kind === "Spacer" && numberField("Height (px)", "padding", 0, 80)}
                </section>
                <details className="sx-more">
                  <summary><SlidersHorizontal size={14} /> More styling</summary>
                  <div className="sx-more-body">
                    {typeKinds && (
                      <>
                        <label>
                          Font
                          <select value={block.font} onChange={(e) => patch({ font: e.target.value })}>
                            {fonts.map((f) => <option key={f}>{f}</option>)}
                          </select>
                        </label>
                        <div className="sx-pair">
                          {numberField("Weight", "weight", 100, 900, 100)}
                          {numberField("Line height", "lineHeight", 1, 3, 0.1)}
                        </div>
                      </>
                    )}
                    <div className="sx-pair">
                      {block.kind !== "Spacer" && numberField("Padding", "padding", 0, 80)}
                      {numberField("Corner radius", "radius", 0, 50)}
                    </div>
                    <div className="sx-pair">
                      {numberField("Border", "border", 0, 10)}
                      {numberField(block.kind === "Button" ? "Button padding" : "Spacing", "gap", 0, 64)}
                    </div>
                  </div>
                </details>
                <div className="sx-block-actions">
                  <button type="button" className="sx-text-button" onClick={saveBlock}>
                    <Bookmark size={14} /> Save as reusable block
                  </button>
                  <button
                    type="button"
                    className="sx-text-button is-danger"
                    onClick={() => { change({ ...doc, blocks: doc.blocks.filter((x) => x.id !== block.id) }); setSelected(""); }}
                  >
                    <Trash2 size={14} /> Delete block
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="sx-panel-head">
                <span className="sx-panel-icon"><Settings2 size={16} /></span>
                <h2>Email settings</h2>
              </div>
              <div className="sx-fields">
                <section>
                  <h3>Inbox</h3>
                  <label>
                    Subject
                    <input maxLength={200} placeholder="What’s this email about?" value={doc.subject || ""} onChange={e => change({ ...doc, subject: e.target.value })} />
                  </label>
                  <label>
                    Preview text
                    <input maxLength={300} placeholder="Shown next to the subject in most inboxes" value={doc.preheader || ""} onChange={e => change({ ...doc, preheader: e.target.value })} />
                  </label>
                </section>
                <section>
                  <h3>Appearance</h3>
                  {colorField("Background", doc.background, (background) => change({ ...doc, background }))}
                </section>
                <details className="sx-more">
                  <summary><SlidersHorizontal size={14} /> More settings</summary>
                  <div className="sx-more-body">
                    <label>
                      Content width (px)
                      <input type="number" min={320} max={800} value={doc.width} onChange={(e) => change({ ...doc, width: Math.min(800, Math.max(320, Number(e.target.value))) })} />
                    </label>
                    <label>
                      Category
                      <select value={doc.category} onChange={(e) => change({ ...doc, category: e.target.value })}>
                        {Array.from(new Set(templates.map((t) => t.category))).map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                  </div>
                </details>
                <EmailChecks document={doc} />
                {cloudMode && (
                  <details className="sx-more" onToggle={async (e) => {
                    if (!(e.currentTarget as HTMLDetailsElement).open) return;
                    try { const result = await api<{ versions: typeof versions }>(`/api/documents/${encodeURIComponent(doc.id)}/versions`); setVersions(result.versions); }
                    catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load history."); }
                  }}>
                    <summary><History size={14} /> Version history</summary>
                    <div className="sx-more-body">
                      {versions.length ? versions.map(version => (
                        <div key={version.revision} className="sx-version">
                          <span>Revision {version.revision}<small>{new Date(version.created_at).toLocaleString()}</small></span>
                          <button type="button" className="sx-text-button" onClick={() => change({ ...version.content, id: doc.id })}>Restore</button>
                        </div>
                      )) : <p className="sx-hint">Earlier saves appear here.</p>}
                    </div>
                  </details>
                )}
                <p className="sx-hint sx-tip"><MousePointerClick size={14} /> Select a block on the canvas to edit it.</p>
              </div>
            </>
          )}
        </aside>
      </div>
      {notice && (
        <div className="workspace-notice" role="status">
          <Check size={16} />
          {notice}
          <button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice("")}>
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
            <button className="button secondary small" onClick={() => setDevice(device === "mobile" ? "desktop" : "mobile")}>
              {device === "mobile" ? "Desktop" : "Mobile"}
            </button>
            <button className="icon-button" aria-label="Close preview" onClick={() => setPreview(false)}>
              <X />
            </button>
          </div>
        </div>
        <iframe
          title="Exported email preview"
          sandbox=""
          srcDoc={previewHtml(doc)}
          style={{ width: device === "mobile" ? 375 : Math.min(doc.width + 48, 848) }}
        />
      </dialog>
    </section>
  );
}
