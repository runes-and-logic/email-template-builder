"use client";
/* eslint-disable @next/next/no-img-element -- Managed raster URLs are inserted into exported email HTML. */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
type Asset = { id: string; url: string; size: number };
export function AssetLibrary({ onSelect }: { onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    api<{ assets: Asset[]; count: number }>(`/api/assets?page=${page}`, { signal: controller.signal }).then(result => { setAssets(result.assets); setCount(result.count); }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, [open, page, refresh]);
  return <details className="asset-library" onToggle={event => setOpen(event.currentTarget.open)}><summary>Asset library</summary>
    <button className="text-link" onClick={() => setRefresh(value => value + 1)}>Refresh images</button>
    <div className="asset-library-grid">{assets.map(asset => <div key={asset.id}><img src={asset.url} alt="Saved workspace image" loading="lazy" /><button className="text-link" onClick={() => onSelect(asset.url)}>Use image</button><button className="text-link" disabled={busy} onClick={() => setDeleting(asset.id)}>Delete</button></div>)}</div>
    {deleting && <div role="alert"><p>Delete this public image? Existing emails that use it will lose the image.</p><button className="button secondary small" disabled={busy} onClick={async () => {
      setBusy(true);
      try { await api(`/api/assets/${deleting}`, { method: "DELETE" }); setDeleting(""); setRefresh(value => value + 1); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Unable to delete image."); }
      finally { setBusy(false); }
    }}>Confirm delete image</button><button className="text-link" onClick={() => setDeleting("")}>Keep image</button></div>}
    {message && <p role="status">{message}</p>}<button className="text-link" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><span> {page + 1} </span><button className="text-link" disabled={(page + 1) * 20 >= count} onClick={() => setPage(value => value + 1)}>Next</button>
  </details>;
}
