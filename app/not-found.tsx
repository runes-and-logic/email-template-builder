import Link from "next/link";
import { Nav, Footer } from "@/components/site";
export default function NotFound() {
  return (
    <>
      <Nav />
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
