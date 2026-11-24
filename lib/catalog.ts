import type { Document } from "@/lib/workspace";

export type CatalogEntry = { id: string; name: string; category: string; content: Document };

/** Public site origin used for canonical URLs, Open Graph and the sitemap. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100").replace(/\/+$/, "");

/**
 * Server-side catalog fetch so templates are in the initial HTML (search engines, first paint).
 * Cached for 5 minutes; returns null if the backend is unreachable so the page can fall back to client loading.
 */
export async function getCatalog(): Promise<CatalogEntry[] | null> {
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
