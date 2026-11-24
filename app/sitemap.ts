import type { MetadataRoute } from "next";
import { getCatalog, siteUrl } from "@/lib/catalog";

/** Public pages plus one entry per template category, refreshed with the catalog cache. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  const templates = await getCatalog();
  const categories = Array.from(new Set((templates || []).map(item => item.category)));
  return [
    ...pages,
    ...categories.map(category => ({
      url: `${siteUrl}/templates?category=${encodeURIComponent(category)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
