import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CreditCard, FolderOpen, LayoutTemplate } from "lucide-react";
import { Footer } from "@/components/site";
import { SiteHeader } from "@/components/site-header";
import { MissingPath, NotFoundActions, TemplateSearch } from "@/components/not-found-actions";

// Next.js serves this with HTTP 404 and adds its own noindex tag; the title makes the tab clear.
export const metadata: Metadata = { title: "Page not found — Postly" };

const destinations = [
  { href: "/templates", icon: LayoutTemplate, label: "Templates", text: "Find a starting point" },
  { href: "/dashboard", icon: FolderOpen, label: "My Templates", text: "Your saved emails" },
  { href: "/pricing", icon: CreditCard, label: "Pricing", text: "Plans and limits" },
  { href: "/docs", icon: BookOpen, label: "Help", text: "Guides and answers" },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container nf">
        <div className="nf-art" aria-hidden="true">
          <div className="nf-envelope">
            <span className="nf-flap" />
            <span className="nf-line" />
            <span className="nf-line short" />
            <span className="nf-stamp">404</span>
          </div>
          <span className="nf-postmark">Return to sender</span>
        </div>

        <span className="eyebrow">ERROR 404 · PAGE NOT FOUND</span>
        <h1>This page wandered off.</h1>
        <p className="nf-lead">The link may be old, or the address mistyped. Let’s get you back to making something good.</p>
        <MissingPath />
        <NotFoundActions />

        <section className="nf-help" aria-labelledby="nf-help-title">
          <h2 id="nf-help-title">Looking for a template?</h2>
          <TemplateSearch />
          <nav className="nf-links" aria-label="Popular pages">
            {destinations.map(({ href, icon: Icon, label, text }) => (
              <Link key={href} href={href}>
                <span className="nf-link-icon"><Icon size={18} /></span>
                <span><strong>{label}</strong><small>{text}</small></span>
                <ArrowUpRight size={15} className="nf-link-arrow" />
              </Link>
            ))}
          </nav>
        </section>
      </main>
      <Footer />
    </>
  );
}
