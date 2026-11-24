import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { FinalCTA, Pricing } from "@/components/site";
import { getPlans, inr, storageLabel, type PlanCatalog } from "@/lib/plans";
import { siteUrl } from "@/lib/catalog";

const DESCRIPTION =
  "Postly pricing: start free with every feature included — visual editor, templates, Brand Kit and HTML export. Plans differ only by saved emails and image storage.";

export const metadata: Metadata = {
  title: "Pricing — Postly email builder",
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: { type: "website", url: "/pricing", title: "Pricing — Postly email builder", description: DESCRIPTION, siteName: "Postly" },
  twitter: { card: "summary_large_image", title: "Pricing — Postly email builder", description: DESCRIPTION },
};

/** Answers reflect current product behavior (limits, Trash, cancellation, storage, sending). */
function faqs(catalog: PlanCatalog | null): [string, string][] {
  const free = catalog?.plans.find(plan => plan.monthly_paise === 0);
  const freeLimits = free ? `${free.document_limit} saved emails and ${storageLabel(free.asset_limit)} of image storage` : "a set number of saved emails and image storage";
  return [
    ["Can I use Postly for free?", `Yes. The Free plan includes every feature, with ${freeLimits}. No card is needed to start.`],
    catalog?.paymentsEnabled
      ? ["How do I upgrade?", "Choose a plan here or from Account & billing in your workspace. Checkout is handled securely by Razorpay."]
      : ["Can I buy a paid plan today?", "Not yet — paid plans are coming soon. Everyone uses the Free plan in the meantime, and upgrades will open on this page."],
    ["What happens when I reach my limit?", "You can keep editing your existing emails. To create more, move emails you no longer need to Trash — emails in Trash don’t count toward your limit — or move to a larger plan."],
    ["Can I cancel anytime?", "Yes. Cancel from Account & billing; your paid plan stays active until the end of the current billing period."],
    ["What counts as image storage?", "Images you upload to your workspace, such as logos and email photos. Images you link by URL from your own website don’t count."],
    ["Does Postly send my emails?", "Postly is where you design. Export responsive HTML and send it with your own email provider. You can send test emails to yourself to check your design."],
  ];
}

export default async function PricingPage() {
  const catalog = await getPlans();
  const questions = faqs(catalog);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: "Postly email builder",
        description: DESCRIPTION,
        url: `${siteUrl}/pricing`,
        brand: { "@type": "Brand", name: "Postly" },
        offers: (catalog?.plans || []).map(plan => ({
          "@type": "Offer",
          name: `${plan.name} plan`,
          price: (plan.monthly_paise / 100).toFixed(2),
          priceCurrency: "INR",
          url: `${siteUrl}/pricing`,
          availability: plan.monthly_paise === 0 || catalog?.paymentsEnabled ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: questions.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main id="main-content">
        <Pricing initial={catalog} />
        <section className="container pr-faq" aria-labelledby="pr-faq-title">
          <h2 id="pr-faq-title">Pricing questions</h2>
          <div className="pr-faq-list">
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}<Plus size={17} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
          {catalog && (
            <p className="pr-footnote">
              Prices in Indian rupees ({inr.format(0).replace(/[\d.,\s]/g, "")}).{catalog.paymentsEnabled ? "" : " Paid plans aren’t available for purchase yet."}
            </p>
          )}
        </section>
        <FinalCTA />
      </main>
    </>
  );
}
