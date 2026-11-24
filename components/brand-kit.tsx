"use client";
/* eslint-disable @next/next/no-img-element -- Brand logos support user-uploaded data URLs and arbitrary public image hosts. */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe,
  ImagePlus,
  Link2,
  Loader2,
  Monitor,
  PenLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import { cloudMode } from "@/lib/config";
import { api, ApiError } from "@/lib/api";
import { uploadImage } from "@/lib/uploads";
import { previewHtml, safeUrl } from "@/lib/email";
import { isPlaceholderUrl } from "@/lib/email-checks";
import { brandSampleDocument, defaultBrand, fonts, readBrand, validBrand, type BrandKit } from "@/lib/workspace";
import "./brand-kit.css";

const HEX = /^#[0-9a-f]{6}$/i;
const PALETTES: { name: string; primary: string; secondary: string }[] = [
  { name: "Violet", primary: "#6e56ae", secondary: "#f1edf7" },
  { name: "Forest", primary: "#3d5748", secondary: "#eef3ee" },
  { name: "Clay", primary: "#b45f2c", secondary: "#fbefe5" },
  { name: "Harbor", primary: "#2f5f8f", secondary: "#e8f0f8" },
  { name: "Rose", primary: "#a8435a", secondary: "#fbecef" },
  { name: "Ink", primary: "#252131", secondary: "#f3f1f5" },
];

/** WCAG contrast of white button text on the primary color. */
function contrastWithWhite(hex: string) {
  if (!HEX.test(hex)) return 0;
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (luminance + 0.05);
}

type Status = "loading" | "ready" | "error" | "signin";
type Notice = { tone: "success" | "error"; text: string } | null;

function Section({ icon, title, hint, children }: { icon: ReactNode; title: string; hint: string; children: ReactNode }) {
  return (
    <section className="bk-section">
      <header>
        <span className="bk-section-icon">{icon}</span>
        <div><h2>{title}</h2><p>{hint}</p></div>
      </header>
      <div className="bk-section-body">{children}</div>
    </section>
  );
}

function ColorInput({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = (next: string) => {
    const hex = next.startsWith("#") ? next : `#${next}`;
    if (HEX.test(hex)) onChange(hex.toLowerCase());
    else setText(value);
  };
  return (
    <div className="bk-color">
      <span className="bk-label">{label}</span>
      <div className="bk-color-input">
        <input type="color" value={HEX.test(value) ? value : "#000000"} onChange={e => onChange(e.target.value)} aria-label={`${label} picker`} />
        <input type="text" value={text} maxLength={7} spellCheck={false} aria-label={`${label} hex value`}
          onChange={e => setText(e.target.value)} onBlur={e => commit(e.target.value.trim())}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit((e.target as HTMLInputElement).value.trim()); } }} />
      </div>
      <span className="bk-hint">{hint}</span>
    </div>
  );
}

function FontPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <fieldset className="bk-fonts">
      <legend className="bk-label">{label}</legend>
      <div className="bk-font-grid">
        {fonts.map(font => (
          <label key={font} className={value === font ? "active" : ""}>
            <input type="radio" name={label} value={font} checked={value === font} onChange={() => onChange(font)} />
            <span className="bk-font-sample" style={{ fontFamily: font }}>Aa</span>
            <span className="bk-font-name">{font}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function BrandKitEditor() {
  const [brand, setBrand] = useState<BrandKit>(defaultBrand);
  const [saved, setSaved] = useState(JSON.stringify(defaultBrand));
  const [status, setStatus] = useState<Status>("loading");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [conflict, setConflict] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [attempt, setAttempt] = useState(0);
  const revision = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = status === "ready" && JSON.stringify(brand) !== saved;

  // Load: workspace kit in cloud mode, browser storage in demo mode. Signed out → sign in, then come back.
  useEffect(() => {
    let active = true;
    setStatus("loading");
    if (!cloudMode) {
      let kit = defaultBrand;
      try { kit = readBrand(); } catch { setNotice({ tone: "error", text: "Saved branding couldn’t be read. You can create a new kit." }); }
      setBrand(kit); setSaved(JSON.stringify(kit)); setStatus("ready");
      return;
    }
    api<{ content: BrandKit | null; revision: number }>("/api/resources/brand")
      .then(result => {
        if (!active) return;
        const kit = result.content && validBrand(result.content) ? result.content : defaultBrand;
        revision.current = result.revision;
        setBrand(kit); setSaved(JSON.stringify(kit)); setStatus("ready");
      })
      .catch(error => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          setStatus("signin");
          location.replace(`/login?next=${encodeURIComponent("/brand")}`);
          return;
        }
        setLoadError(error instanceof Error ? error.message : "We couldn’t load your Brand Kit.");
        setStatus("error");
      });
    return () => { active = false; };
  }, [attempt]);

  const update = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => {
    setBrand(current => ({ ...current, [key]: value }));
    setNotice(null);
  };

  const website = brand.website.trim();
  const websiteError = website && !safeUrl(website) ? "Use a full web address starting with https://" : "";
  const websitePlaceholder = !websiteError && website && isPlaceholderUrl(website);
  const nameError = !brand.name.trim() ? "Add your business name." : "";
  const contrast = contrastWithWhite(brand.primary);
  const socials = brand.socials.split("\n");

  const save = useCallback(async () => {
    if (!dirty || saving || conflict) return;
    const next = { ...brand, name: brand.name.trim(), website: brand.website.trim(), socials: brand.socials.split("\n").map(s => s.trim()).filter(Boolean).join("\n") };
    if (!next.name || (next.website && !safeUrl(next.website)) || !validBrand(next)) {
      setNotice({ tone: "error", text: "Check the highlighted fields before saving." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      if (cloudMode) {
        const result = await api<{ revision: number }>("/api/resources/brand", { method: "PUT", body: JSON.stringify({ content: next, revision: revision.current }) });
        revision.current = result.revision;
      } else localStorage.setItem("postly-brand", JSON.stringify(next));
      setBrand(next);
      setSaved(JSON.stringify(next));
      setNotice({ tone: "success", text: "Brand Kit saved. Use Apply Brand Kit in the editor to style an email." });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setConflict(true);
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Unable to save your Brand Kit." });
    } finally {
      setSaving(false);
    }
  }, [brand, dirty, saving, conflict]);

  // Cmd/Ctrl+S saves; warn before leaving with unsaved changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void save(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  }, [save, dirty]);

  useEffect(() => {
    if (notice?.tone !== "success") return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleFile(file?: File) {
    if (!file) return;
    if (file.size > 1500000 || !/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setNotice({ tone: "error", text: "Use a PNG, JPEG, WebP or GIF smaller than 1.5 MB." });
      return;
    }
    setUploading(true);
    try { update("logo", await uploadImage(file)); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Logo upload failed." }); }
    finally { setUploading(false); }
  }

  const preview = useMemo(() => previewHtml(brandSampleDocument(brand)), [brand]);
  const logoSrc = safeUrl(brand.logo, true);

  if (status === "loading" || status === "signin") {
    return (
      <div className="container bk-page" aria-busy="true">
        <div className="bk-head"><div className="bk-skel w-30" /><div className="bk-skel w-50 tall" /></div>
        <div className="bk-layout">
          <div className="bk-form">{[0, 1, 2].map(i => <div key={i} className="bk-section bk-skel-card"><div className="bk-skel w-40" /><div className="bk-skel w-90 field" /><div className="bk-skel w-70 field" /></div>)}</div>
          <div className="bk-preview"><div className="bk-skel preview" /></div>
        </div>
        <p className="tg-sr" role="status">{status === "signin" ? "Taking you to sign in…" : "Loading your Brand Kit…"}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container bk-page">
        <div className="bk-state" role="alert">
          <AlertCircle size={26} />
          <h1>Your Brand Kit didn’t load</h1>
          <p>{loadError} Your saved branding is safe.</p>
          <div><button type="button" className="button" onClick={() => setAttempt(a => a + 1)}><RefreshCw size={16} /> Try again</button><Link className="button secondary" href="/dashboard">My Templates</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container bk-page">
      <div className="bk-head">
        <div>
          <nav className="bk-crumbs" aria-label="Breadcrumb"><Link href="/dashboard">My Templates</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">Brand Kit</span></nav>
          <h1>Brand Kit</h1>
          <p>Set your logo, colors and fonts once. Apply them to any email from the editor.</p>
        </div>
        <div className="bk-actions">
          <span className={`bk-status ${saving ? "is-saving" : dirty ? "is-dirty" : "is-saved"}`} role="status" aria-live="polite">
            {saving ? <><Loader2 size={13} className="bk-spin" /> Saving…</> : dirty ? <><span className="bk-dot" /> Unsaved changes</> : <><CheckCircle2 size={13} /> All changes saved</>}
          </span>
          {dirty && !saving && <button type="button" className="button secondary small" onClick={() => { setBrand(JSON.parse(saved)); setNotice(null); }}><RotateCcw size={15} /> Discard</button>}
          <button type="button" className="button small" disabled={!dirty || saving || conflict} onClick={() => void save()}><Check size={15} /> Save Brand Kit</button>
        </div>
      </div>

      {notice && (
        <div className={`bk-notice tone-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "error" ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <p>{notice.text}</p>
          {notice.tone === "success" && <Link href="/dashboard">Open My Templates</Link>}
          {conflict && <button type="button" onClick={() => setAttempt(a => a + 1)}>Reload</button>}
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}><X size={15} /></button>
        </div>
      )}

      <div className="bk-layout">
        <form className="bk-form" onSubmit={e => { e.preventDefault(); void save(); }} noValidate>
          <Section icon={<Globe size={18} />} title="Identity" hint="Shown in your logo, footer and links.">
            {/* Labels hold only the field name; hints and errors are linked with aria-describedby. */}
            <div className={`bk-field ${nameError ? "has-error" : ""}`}>
              <label className="bk-label" htmlFor="bk-name">Business name</label>
              <input id="bk-name" value={brand.name} maxLength={200} placeholder="Your business" onChange={e => update("name", e.target.value)}
                aria-invalid={!!nameError} aria-describedby={nameError ? "bk-name-msg" : undefined} />
              {nameError && <span className="bk-error" id="bk-name-msg"><AlertCircle size={13} /> {nameError}</span>}
            </div>
            <div className={`bk-field ${websiteError ? "has-error" : ""}`}>
              <label className="bk-label" htmlFor="bk-website">Website</label>
              <input id="bk-website" type="url" inputMode="url" value={brand.website} maxLength={2048} placeholder="https://yourbusiness.com"
                onChange={e => update("website", e.target.value)} aria-invalid={!!websiteError} aria-describedby="bk-website-msg" />
              {websiteError ? <span className="bk-error" id="bk-website-msg"><AlertCircle size={13} /> {websiteError}</span>
                : websitePlaceholder ? <span className="bk-warn" id="bk-website-msg"><AlertCircle size={13} /> This is a placeholder address. Add your real website so buttons lead to it.</span>
                : <span className="bk-hint" id="bk-website-msg">{website ? "Buttons and your logo link here." : "Add your website so buttons and your logo link to it."}</span>}
            </div>
            <div className="bk-field">
              <span className="bk-label">Logo</span>
              <div
                className={`bk-drop ${dragging ? "is-dragging" : ""} ${logoSrc ? "has-logo" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); void handleFile(e.dataTransfer.files?.[0]); }}
              >
                {logoSrc ? <img src={logoSrc} alt={`${brand.name} logo`} /> : <span className="bk-drop-icon"><ImagePlus size={22} /></span>}
                <div className="bk-drop-copy">
                  {uploading ? <strong><Loader2 size={14} className="bk-spin" /> Uploading…</strong> : <strong>{logoSrc ? "Your logo" : "Drop your logo here"}</strong>}
                  <span>PNG, JPEG, WebP or GIF · up to 1.5 MB</span>
                </div>
                <div className="bk-drop-actions">
                  <button type="button" className="button secondary small" disabled={uploading} onClick={() => fileInput.current?.click()}><Upload size={14} /> {logoSrc ? "Replace" : "Upload"}</button>
                  {logoSrc && <button type="button" className="bk-icon-button" aria-label="Remove logo" onClick={() => update("logo", "")}><Trash2 size={15} /></button>}
                </div>
                <input ref={fileInput} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { void handleFile(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
              <details className="bk-more">
                <summary>Use an image URL instead</summary>
                <input type="url" value={brand.logo.startsWith("data:") ? "" : brand.logo} placeholder="https://…/logo.png" onChange={e => update("logo", e.target.value)} aria-label="Logo image URL" />
              </details>
            </div>
          </Section>

          <Section icon={<span className="bk-swatch-icon" style={{ background: brand.primary }} />} title="Colors" hint="Pick a palette or set your own.">
            <div className="bk-palettes" role="group" aria-label="Suggested palettes">
              {PALETTES.map(p => {
                const active = p.primary === brand.primary.toLowerCase() && p.secondary === brand.secondary.toLowerCase();
                return (
                  <button type="button" key={p.name} className={active ? "active" : ""} aria-pressed={active} onClick={() => { update("primary", p.primary); update("secondary", p.secondary); }}>
                    <span style={{ background: p.primary }} /><span style={{ background: p.secondary }} />
                    <em>{p.name}</em>
                  </button>
                );
              })}
            </div>
            <div className="bk-pair">
              <ColorInput label="Primary" hint="Buttons" value={brand.primary} onChange={v => update("primary", v)} />
              <ColorInput label="Secondary" hint="Footer background" value={brand.secondary} onChange={v => update("secondary", v)} />
            </div>
            <p className={`bk-contrast ${contrast >= 4.5 ? "is-good" : "is-low"}`}>
              {contrast >= 4.5 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {contrast >= 4.5 ? "Button text is easy to read." : "White button text may be hard to read — try a darker primary color."}
              <span>{contrast.toFixed(1)}:1</span>
            </p>
          </Section>

          <Section icon={<Type size={18} />} title="Typography" hint="Email-safe fonts that display in every inbox.">
            <FontPicker label="Headings" value={brand.heading} onChange={v => update("heading", v)} />
            <FontPicker label="Body text" value={brand.body} onChange={v => update("body", v)} />
          </Section>

          <Section icon={<Link2 size={18} />} title="Social links" hint="Added to emails that include a Social links block.">
            <div className="bk-socials">
              {socials.map((url, index) => (
                <div key={index} className="bk-social">
                  <input type="url" inputMode="url" value={url} placeholder="https://instagram.com/yourbusiness" aria-label={`Social profile ${index + 1}`}
                    onChange={e => update("socials", socials.map((s, i) => (i === index ? e.target.value : s)).join("\n"))} />
                  {(socials.length > 1 || url) && (
                    <button type="button" className="bk-icon-button" aria-label={`Remove social profile ${index + 1}`}
                      onClick={() => update("socials", socials.filter((_, i) => i !== index).join("\n"))}><X size={15} /></button>
                  )}
                </div>
              ))}
              {socials.length < 8 && socials[socials.length - 1].trim() !== "" && (
                <button type="button" className="bk-add" onClick={() => update("socials", `${brand.socials}\n`)}><Plus size={15} /> Add another profile</button>
              )}
            </div>
          </Section>
        </form>

        <aside className="bk-preview" aria-label="Live preview">
          <div className="bk-preview-card">
            <div className="bk-preview-bar">
              <strong>Live preview</strong>
              <div className="bk-device" role="group" aria-label="Preview size">
                <button type="button" aria-label="Desktop" aria-pressed={device === "desktop"} className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}><Monitor size={15} /></button>
                <button type="button" aria-label="Mobile" aria-pressed={device === "mobile"} className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone size={15} /></button>
              </div>
            </div>
            <div className="bk-preview-canvas">
              <iframe title="Brand Kit email preview" sandbox="" srcDoc={preview} className={device === "mobile" ? "is-mobile" : ""} />
            </div>
            <div className="bk-preview-foot">
              <p>This is how <strong>Apply Brand Kit</strong> styles an email in the editor.</p>
              <Link className="button secondary small" href="/dashboard"><PenLine size={14} /> Open an email</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
