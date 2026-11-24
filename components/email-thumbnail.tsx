"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { documentHtml } from "@/lib/email";
import type { Document } from "@/lib/workspace";
import "./email-thumbnail.css";

const EMAIL_WIDTH = 600;
const PAPER_TOP = 22;

/** Email HTML without its outer page padding/background, so the thumbnail shows just the email "paper". */
function paperHtml(doc: Document) {
  return documentHtml(doc).replace(/<body style="[^"]*">/, '<body style="margin:0;padding:0;background:#ffffff">');
}

/**
 * The real email rendered at full width, scaled to a fixed "paper" width and pinned to the same top
 * offset in every card, so rows line up. Long emails are cropped with a soft fade. Wrap it in an
 * element with class "thumb-host" to get the hover lift.
 */
export function EmailThumbnail({ doc, label }: { doc: Document; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [contentHeight, setContentHeight] = useState(0);
  const html = useMemo(() => paperHtml(doc), [doc]);
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new ResizeObserver(([item]) => setSize({ width: item.contentRect.width, height: item.contentRect.height }));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const measure = useCallback(() => {
    // allow-same-origin (without allow-scripts) lets us read the height; the email still cannot run scripts.
    const inner = frame.current?.contentDocument;
    // Ignore the empty placeholder document; measure the body, since the document is never shorter than the frame.
    if (inner?.body && inner.body.childElementCount > 0) setContentHeight(Math.ceil(inner.body.getBoundingClientRect().height));
  }, []);
  useEffect(() => { if (frame.current?.contentDocument?.readyState === "complete") measure(); }, [measure, html]);

  const paperWidth = size.width * 0.84;
  const scale = paperWidth ? paperWidth / EMAIL_WIDTH : 0.4;
  const available = Math.max(0, size.height - PAPER_TOP);

  if (!doc.blocks.length) {
    return (
      <div className="tg-thumb-frame" ref={box}>
        <div className="tg-paper-empty" style={{ top: PAPER_TOP, height: Math.min(available, size.width * 0.6) || "60%" }}>
          <FileText size={22} />
          Empty email
        </div>
      </div>
    );
  }

  const paperHeight = contentHeight ? Math.min(contentHeight * scale, available) : available;
  const long = contentHeight > 0 && contentHeight * scale > available;
  return (
    <div className="tg-thumb-frame" ref={box}>
      <div className={`tg-paper ${long ? "is-long" : ""} ${contentHeight ? "is-ready" : ""}`} style={{ width: paperWidth || "84%", height: paperHeight || "auto", top: PAPER_TOP }}>
        <iframe
          ref={frame}
          title={`${label} thumbnail`}
          sandbox="allow-same-origin"
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
          srcDoc={html}
          onLoad={measure}
          style={{ width: EMAIL_WIDTH, height: contentHeight || EMAIL_WIDTH * 1.6, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
