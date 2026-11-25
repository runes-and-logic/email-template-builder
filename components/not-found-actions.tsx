"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";
import "./not-found.css";

/** The address that wasn't found, read on the client so the static 404 page stays cacheable. */
export function MissingPath() {
  const [path, setPath] = useState("");
  useEffect(() => setPath(decodeURI(location.pathname + location.search)), []);
  if (!path || path === "/") return null;
  return <p className="nf-path"><span>Requested</span><code>{path}</code></p>;
}

export function NotFoundActions() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  // Only offer "Go back" when this tab has somewhere to go back to.
  useEffect(() => setCanGoBack(window.history.length > 1), []);
  return (
    <div className="nf-actions">
      {canGoBack && (
        <button type="button" className="button secondary" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Go back
        </button>
      )}
      <Link className="button" href="/"><Home size={16} /> Back to home</Link>
    </div>
  );
}

/** Searches the template library, the most common destination for an old or mistyped link. */
export function TemplateSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  return (
    <form
      className="nf-search"
      role="search"
      onSubmit={event => {
        event.preventDefault();
        const q = query.trim();
        router.push(q ? `/templates?q=${encodeURIComponent(q)}` : "/templates");
      }}
    >
      <Search size={17} aria-hidden="true" />
      <input aria-label="Search templates" placeholder="Search templates — welcome, newsletter, sale…" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} />
      <button type="submit" className="button small">Search</button>
    </form>
  );
}
