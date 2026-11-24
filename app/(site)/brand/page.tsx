import type { Metadata } from "next";
import { BrandKitEditor } from "@/components/brand-kit";

// Private workspace page: keep it out of search results.
export const metadata: Metadata = { title: "Brand Kit — Postly", robots: { index: false, follow: false } };

export default function BrandPage() {
  return (
    <main id="main-content">
      <BrandKitEditor />
    </main>
  );
}
