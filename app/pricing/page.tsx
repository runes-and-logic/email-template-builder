import { Nav, Footer, FinalCTA, Pricing } from "@/components/site";
export const metadata = { title: "Simple, transparent pricing — Postly" };
export default function PricingPage() {
  return (
    <>
      <Nav />
      <main id="main-content">
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
