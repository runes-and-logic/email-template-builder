"use client";
import { useState } from "react";
import { emailChecks, plainText } from "@/lib/email-checks";
import type { Document } from "@/lib/workspace";
import { cloudMode } from "@/lib/config";
import { api } from "@/lib/api";
export function EmailChecks({ document }: { document: Document }) {
  const warnings = emailChecks(document);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <details className="email-checks"><summary>Email checks · {warnings.length ? `${warnings.length} suggestions` : "Ready to test"}</summary>
    <ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
    <button className="button secondary small" onClick={() => {
      const url = URL.createObjectURL(new Blob([plainText(document)], { type: "text/plain" }));
      const link = window.document.createElement("a"); link.href = url; link.download = `postly-${document.id}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }}>Download plain text</button>
    {cloudMode && <button className="button secondary small" disabled={busy} onClick={async () => {
      setBusy(true);
      try { await api("/api/email/test", { method: "POST", body: JSON.stringify({ document }) }); setMessage("Test sent to your verified account email."); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send test."); }
      finally { setBusy(false); }
    }}>{busy ? "Sending…" : "Send test to me"}</button>}
    {message && <p role="status">{message}</p>}
  </details>;
}
