import type { Document } from "@/lib/workspace";

export type CatalogEntry = { id: string; name: string; category: string; content: Document };

/**
 * Public site origin used for canonical URLs, Open Graph and the sitemap.
 * Accepts values with or without a protocol and never throws during the build: falls back to the
 * Vercel-provided production/deployment host, then localhost.
 */
function resolveSiteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).origin;
    } catch {
      // Ignore a malformed value and try the next source.
    }
  }
  return "http://localhost:3100";
}
export const siteUrl = resolveSiteUrl();

/**
 * Server-side catalog fetch so templates are in the initial HTML (search engines, first paint).
 * Cached for 5 minutes; returns null if the backend is unreachable so the page can fall back to client loading.
 */
export async function getCatalog(): Promise<CatalogEntry[] | null> {
  // Demo mode never uses backend data; skip the request (keeps demo/CI builds quiet and fast).
  if (process.env.NEXT_PUBLIC_APP_MODE !== "cloud") return null;
  const backend = process.env.BACKEND_URL || "http://127.0.0.1:3002";
  try {
    const response = await fetch(`${backend}/api/catalog`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const data = (await response.json()) as { templates?: CatalogEntry[] };
    return Array.isArray(data.templates) ? data.templates : null;
  } catch {
    return null;
  }
}

/** First heading in the email: a short, real description of the template for cards and metadata. */
export function templateHeadline(entry: CatalogEntry): string {
  const heading = entry.content.blocks.find(block => block.kind === "Heading");
  return (heading?.text || "").replace(/\s+/g, " ").trim();
}
