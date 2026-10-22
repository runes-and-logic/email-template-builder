"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  Code2,
  ImageIcon,
  Link2,
  Monitor,
  MoreHorizontal,
  MousePointer2,
  Redo2,
  Save,
  Settings2,
  Smartphone,
  Square,
  Type,
  Undo2,
  X,
  Check,
  PanelLeft,
} from "lucide-react";
import { templates, type Template } from "@/lib/data";
import { EmailPreview } from "./email-preview";
import { emailHtml } from "@/lib/email";
const blockTypes = [
  { name: "Text", icon: Type },
  { name: "Image", icon: ImageIcon },
  { name: "Button", icon: MousePointer2 },
  { name: "Divider", icon: MinusIcon },
  { name: "Spacer", icon: Square },
  { name: "Columns", icon: PanelLeft },
];
function MinusIcon({ size = 20 }: { size?: number }) {
  return <span style={{ fontSize: size, lineHeight: 1 }}>―</span>;
}
export function Editor({
  showcase = false,
  initialId = "welcome",
}: {
  showcase?: boolean;
  initialId?: string;
}) {
  const initial = templates.find((t) => t.id === initialId) || templates[0];
  const [template, setTemplate] = useState<Template>(initial);
  const [device, setDevice] = useState("desktop");
  const [tab, setTab] = useState("Content");
  const [notice, setNotice] = useState("");
  const [url, setUrl] = useState("https://example.com");
  const [code, setCode] = useState(false);
  const [history, setHistory] = useState<Template[]>([]);
  const [future, setFuture] = useState<Template[]>([]);
  useEffect(() => {
    if (!showcase) {
      try {
        const saved = localStorage.getItem("postly-draft-" + initial.id);
        if (saved) {
          const data = JSON.parse(saved);
          if (
            data &&
            typeof data.title === "string" &&
            typeof data.brand === "string" &&
            typeof data.subtitle === "string" &&
            typeof data.cta === "string" &&
            /^#[0-9a-f]{6}$/i.test(data.color)
          ) {
            setTemplate({
              ...initial,
              title: data.title,
              brand: data.brand,
              subtitle: data.subtitle,
              cta: data.cta,
              color: data.color,
            });
            if (typeof data.url === "string") setUrl(data.url);
          }
        }
      } catch {
        setNotice("Your saved draft could not be opened. You can start fresh.");
      }
    }
  }, [initial, showcase]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);
  function update(key: keyof Template, value: string) {
    setHistory((h) => [...h.slice(-30), template]);
    setFuture([]);
    setTemplate((t) => ({ ...t, [key]: value }));
  }
  function undo() {
    if (!history.length) return;
    setFuture((f) => [template, ...f]);
    setTemplate(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setHistory((h) => [...h, template]);
    setTemplate(future[0]);
    setFuture((f) => f.slice(1));
  }
  function download() {
    const blob = new Blob([emailHtml({ ...template, url })], {
      type: "text/html",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `postly-${template.id}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    setNotice("Your responsive HTML has been exported.");
  }
  function save() {
    try {
      localStorage.setItem(
        "postly-draft-" + template.id,
        JSON.stringify({ ...template, url, version: 1 }),
      );
      setNotice("Draft saved in this browser.");
    } catch {
      setNotice(
        "Browser storage is unavailable. Export HTML to keep your work.",
      );
    }
  }
  return (
    <div
      className={`editor-shell ${showcase ? "showcase-editor" : "full-editor"}`}
    >
      <div className="editor-top">
        <div className="editor-title">
          <Link href={showcase ? "/templates" : "/"} aria-label="Back">
            <ChevronLeft size={16} />
          </Link>
          <span className="editor-template-name">
            {showcase ? "Welcome to wildwonder" : template.name}
          </span>
          <ChevronDown size={12} />
          <span className="draft-chip">Draft</span>
        </div>
        <div className="editor-top-actions">
          <span className="local-note">
            <Check size={12} />
            {showcase ? "Your canvas, your way" : "Local workspace"}
          </span>
          <button
            className="icon-button"
            onClick={undo}
            disabled={!history.length}
            aria-label="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            className="icon-button"
            onClick={redo}
            disabled={!future.length}
            aria-label="Redo"
          >
            <Redo2 size={15} />
          </button>
          {!showcase && (
            <button className="button secondary tiny" onClick={save}>
              <Save size={13} />
              Save draft
            </button>
          )}
          <button className="button tiny" onClick={download}>
            Export HTML <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
      <div className="editor-main">
        <aside className="editor-sidebar">
          <div className="editor-tabs">
            {["Content", "Design"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={tab === t ? "active" : ""}
              >
                {t}
              </button>
            ))}
          </div>
          {showcase && tab === "Content" ? (
            <>
              <div className="sidebar-label">
                BUILD YOUR EMAIL <span>⌘ K</span>
              </div>
              <div className="blocks-grid">
                {blockTypes.map(({ name, icon: Icon }) => (
                  <Link href="/editor" className="block" key={name}>
                    <Icon size={21} />
                    <span>{name}</span>
                  </Link>
                ))}
              </div>
              <div className="sidebar-label layouts-label">LAYOUTS</div>
              <div className="layout-options">
                {[1, 2, 3].map((n) => (
                  <Link
                    href="/editor"
                    key={n}
                    aria-label={`${n} column layout`}
                  >
                    {Array.from({ length: n }, (_, i) => (
                      <span key={i} />
                    ))}
                  </Link>
                ))}
              </div>
              <div className="sidebar-tip">
                <span>✧</span>
                <strong>
                  A little creativity.
                  <br />
                  Endless possibilities.
                </strong>
                <p>Make every email feel like you.</p>
              </div>
            </>
          ) : (
            <div className="edit-fields">
              {tab === "Content" ? (
                <>
                  <label>
                    Brand name
                    <input
                      value={template.brand}
                      onChange={(e) => update("brand", e.target.value)}
                    />
                  </label>
                  <label>
                    Headline
                    <textarea
                      aria-label="Headline"
                      value={template.title}
                      onChange={(e) => update("title", e.target.value)}
                    />
                  </label>
                  <label>
                    Message
                    <textarea
                      aria-label="Message"
                      className="message-field"
                      value={template.subtitle}
                      onChange={(e) => update("subtitle", e.target.value)}
                    />
                  </label>
                  <label>
                    Button text
                    <input
                      value={template.cta}
                      onChange={(e) => update("cta", e.target.value)}
                    />
                  </label>
                  <label>
                    Button link
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </label>
                  <p className="field-help">
                    Use a full https:// link. Your text is safely escaped in the
                    exported HTML.
                  </p>
                </>
              ) : (
                <>
                  <label>
                    Brand color
                    <div className="color-picker">
                      <input
                        type="color"
                        value={template.color}
                        onChange={(e) => update("color", e.target.value)}
                      />
                      <span>{template.color}</span>
                    </div>
                  </label>
                  <div className="swatches">
                    {[
                      "#3d5748",
                      "#6e56ae",
                      "#8d6048",
                      "#cb653b",
                      "#375f7a",
                      "#272727",
                    ].map((c) => (
                      <button
                        aria-label={`Use ${c}`}
                        style={{ background: c }}
                        key={c}
                        onClick={() => update("color", c)}
                      />
                    ))}
                  </div>
                  <p className="field-help">
                    Your color is applied to the email’s branding and call to
                    action.
                  </p>
                </>
              )}
            </div>
          )}
        </aside>
        <div className="editor-workspace">
          <div className="canvas-toolbar">
            <div className="device-switch">
              <button
                className={device === "desktop" ? "active" : ""}
                onClick={() => setDevice("desktop")}
                aria-label="Desktop preview"
              >
                <Monitor size={15} />
              </button>
              <button
                className={device === "mobile" ? "active" : ""}
                onClick={() => setDevice("mobile")}
                aria-label="Mobile preview"
              >
                <Smartphone size={15} />
              </button>
            </div>
            <span>
              {device === "desktop" ? "Desktop · 600px" : "Mobile · 375px"}
            </span>
            <button
              className="code-toggle"
              onClick={() => setCode(!code)}
              aria-label={code ? "Show visual preview" : "Show exported HTML"}
            >
              <Code2 size={15} />
              {showcase ? "" : " HTML"}
            </button>
          </div>
          <div
            className={`canvas-scroll ${device === "mobile" ? "mobile-preview" : ""}`}
          >
            {code ? (
              <pre className="code-preview">
                {emailHtml({ ...template, url })}
              </pre>
            ) : (
              <div className="canvas-email">
                <EmailPreview template={template} />
                {showcase && (
                  <div className="selection-indicator">
                    <span>Image</span>
                    <div className="selection-handle" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="canvas-status">
            <span>
              <span className="status-dot" />
              Responsive by design
            </span>
            <span>
              100% <ChevronDown size={11} />
            </span>
          </div>
        </div>
        {showcase && (
          <aside className="editor-properties">
            <div className="property-title">
              <ImageIcon size={14} /> Image <MoreHorizontal size={15} />
            </div>
            <span className="property-label">IMAGE</span>
            <div className="property-image" />
            <Link href="/editor" className="replace-image">
              Customize template <ArrowUpRight size={11} />
            </Link>
            <div className="property-divider" />
            <span className="property-label">SPACING</span>
            <div className="spacing-control">
              <span>24</span>
              <div>
                <span>24</span>
                <Square size={28} strokeWidth={1} />
                <span>24</span>
              </div>
              <span>24</span>
            </div>
            <div className="property-divider" />
            <span className="property-label">STYLE</span>
            <div className="property-row">
              Border radius{" "}
              <span>
                0 <small>px</small>
              </span>
            </div>
            <div className="property-row">
              Width{" "}
              <span>
                100 <small>%</small>
              </span>
            </div>
            <div className="property-divider" />
            <span className="property-label">LINK</span>
            <div className="property-url">
              <Link2 size={12} /> https://
            </div>
            <div className="property-bottom">
              <Settings2 size={13} />
              Made for the details
            </div>
          </aside>
        )}
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
