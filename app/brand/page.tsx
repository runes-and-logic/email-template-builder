import { Nav, Footer } from "@/components/site";
import { BrandKitEditor } from "@/components/brand-kit";
export const metadata = { title: "Brand Kit — Postly" };
export default function BrandPage() {
  return (
    <>
      <Nav />
      <main id="main-content">
        <BrandKitEditor />
      </main>
      <Footer />
    </>
  );
}
