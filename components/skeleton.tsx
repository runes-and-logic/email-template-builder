import type { CSSProperties } from "react";

/**
 * Shared skeleton placeholders. Styles live in app/cloud-states.css (global), so they also work in
 * route-level loading.tsx files, which render before page-specific stylesheets load.
 */
export function Sk({ w = "100%", h = 12, r, className = "", style }: { w?: number | string; h?: number | string; r?: number; className?: string; style?: CSSProperties }) {
  return <span className={`sk ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
}

/** Screen-reader announcement for a skeleton region. */
export function SkLabel({ children }: { children: string }) {
  return <span className="sk-sr" role="status">{children}</span>;
}

/** Page heading placeholder: eyebrow/breadcrumb, title and one line of text. */
export function SkHeading({ center = false }: { center?: boolean }) {
  return (
    <div className={`sk-heading ${center ? "is-center" : ""}`}>
      <Sk w={110} h={10} />
      <Sk w={center ? 420 : 280} h={34} r={10} />
      <Sk w={center ? 360 : 420} h={12} />
    </div>
  );
}

/** Grid of email/template cards (thumbnail + two lines). */
export function SkCards({ count = 8 }: { count?: number }) {
  return (
    <div className="sk-cards">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="sk-card"><Sk h="auto" className="sk-thumb" r={16} /><Sk w="70%" h={13} /><Sk w="45%" h={11} /></div>
      ))}
    </div>
  );
}

/** Bordered panel with a title and a few field rows. */
export function SkPanel({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`sk-panel ${className}`}>
      <div className="sk-panel-head"><Sk w={36} h={36} r={10} /><div><Sk w={140} h={14} /><Sk w={220} h={11} /></div></div>
      {Array.from({ length: rows }, (_, i) => <Sk key={i} h={44} r={10} />)}
    </div>
  );
}

/** Table placeholder (header + rows). */
export function SkTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="sk-table">
      {Array.from({ length: rows + 1 }, (_, r) => (
        <div key={r} className={`sk-row ${r === 0 ? "is-head" : ""}`}>
          {Array.from({ length: cols }, (_, c) => <Sk key={c} w={`${60 + ((r + c) % 3) * 12}%`} h={r === 0 ? 10 : 12} />)}
        </div>
      ))}
    </div>
  );
}
