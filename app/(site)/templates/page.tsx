import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { FinalCTA } from "@/components/site";
import { Gallery } from "@/components/gallery";
import { getCatalog, siteUrl, templateHeadline, type CatalogEntry } from "@/lib/catalog";

type Props = { searchParams: Promise<{ category?: string }> };

const BASE_TITLE = "Free responsive email templates";
const BASE_DESCRIPTION =
  "Browse free, responsive email templates for welcomes, newsletters, promotions, order confirmations, events and more. Preview on desktop and mobile, customize every block, and export clean HTML.";

/** "Abandoned Cart Emails" → "Abandoned cart", "Newsletters" → "Newsletter": reads naturally before "email templates". */
function categoryLabel(category: string) {
  const words = category.replace(/\s+emails?$/i, "").split(" ").map(word => word.toLowerCase());
  const last = words.length - 1;
  if (words[last].length > 3 && words[last].endsWith("s") && !words[last].endsWith("ss")) words[last] = words[last].slice(0, -1);
  const label = words.join(" ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Only categories that exist in the catalog shape the title and canonical URL (ignores arbitrary query text). */
function knownCategory(templates: CatalogEntry[] | null, category?: string) {
  return category && templates?.some(item => item.category === category) ? category : undefined;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ category }, templates] = await Promise.all([searchParams, getCatalog()]);
  const active = knownCategory(templates, category);
  const count = templates ? templates.filter(item => !active || item.category === active).length : 0;
  const title = active ? `${categoryLabel(active)} email templates` : BASE_TITLE;
  const description = active
    ? `${count} free, responsive ${categoryLabel(active).toLowerCase()} email ${count === 1 ? "template" : "templates"}. Preview on desktop and mobile, customize every block, and export HTML with Postly.`
    : BASE_DESCRIPTION;
  const path = active ? `/templates?category=${encodeURIComponent(active)}` : "/templates";
  return {
    title: `${title} — Postly`,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title: `${title} — Postly`, description, siteName: "Postly" },
    twitter: { card: "summary_large_image", title: `${title} — Postly`, description },
  };
}

export default async function TemplatesPage({ searchParams }: Props) {
  const [{ category }, templates] = await Promise.all([searchParams, getCatalog()]);
  const active = knownCategory(templates, category);
  const listed = templates ? templates.filter(item => !active || item.category === active) : [];

  // Structured data: the page is a collection of templates, reached via Home › Templates.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: active ? `${categoryLabel(active)} email templates` : "Email templates",
        url: `${siteUrl}/templates${active ? `?category=${encodeURIComponent(active)}` : ""}`,
        description: BASE_DESCRIPTION,
        isPartOf: { "@type": "WebSite", name: "Postly", url: siteUrl },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: listed.length,
          itemListElement: listed.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${siteUrl}/templates?preview=${encodeURIComponent(item.id)}`,
            name: item.name,
            description: templateHeadline(item) || `${item.category} email template`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Templates", item: `${siteUrl}/templates` },
          ...(active ? [{ "@type": "ListItem", position: 3, name: active, item: `${siteUrl}/templates?category=${encodeURIComponent(active)}` }] : []),
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main id="main-content" className="container tg-page">
        <header className="tg-header">
          <nav aria-label="Breadcrumb" className="tg-crumbs">
            <Link href="/">Home</Link> <span aria-hidden="true">/</span> {active ? <><Link href="/templates">Templates</Link> <span aria-hidden="true">/</span> <span aria-current="page">{active}</span></> : <span aria-current="page">Templates</span>}
          </nav>
          <h1>{active ? `${categoryLabel(active)} email templates` : "Email templates for every moment"}</h1>
          <p>
            {active
              ? `Responsive ${categoryLabel(active).toLowerCase()} emails, ready to customize. Preview any template, then make it yours in the editor.`
              : "Free, responsive templates for welcomes, newsletters, promotions and more. Preview any template, then make it yours in the editor."}
          </p>
          <ul className="tg-points">
            <li><Check size={14} /> Looks right on every screen</li>
            <li><Check size={14} /> Edit every block</li>
            <li><Check size={14} /> Free HTML export</li>
          </ul>
        </header>
        <Gallery initialCategory={active || category || "All templates"} initialTemplates={templates} />
      </main>
      <FinalCTA />
    </>
  );
}
