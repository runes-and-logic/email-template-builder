import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/catalog";

/** Public marketing pages are crawlable; signed-in app screens and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/editor", "/dashboard", "/account", "/brand", "/platform"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
