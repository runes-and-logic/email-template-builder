import { FinalCTA, Pricing } from "@/components/site";
export const metadata = { title: "Simple, transparent pricing — Postly" };
export default function PricingPage() {
  return (
    <>
      <main id="main-content">
        <Pricing />
        <FinalCTA />
      </main>
    </>
  );
}
