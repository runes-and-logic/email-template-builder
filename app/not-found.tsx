import Link from "next/link";
import { Footer } from "@/components/site";
import { SiteHeader } from "@/components/site-header";
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container empty-state">
        <span className="eyebrow">A SMALL DETOUR.</span>
        <h1>This page wandered off.</h1>
        <p>Let’s get you back to making something good.</p>
        <Link href="/" className="button">
          Back to Postly
        </Link>
      </main>
      <Footer />
    </>
  );
}
