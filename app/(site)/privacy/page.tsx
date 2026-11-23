import { cloudMode } from "@/lib/config";
export const metadata = { title: "Demo privacy information — Postly" };
export default function Privacy() {
  if (cloudMode) return <><main id="main-content" className="container prose-page"><h1>Your workspace data</h1><p>Your account email, profile, workspace membership, email documents, brand kits, reusable blocks, and revisions are stored using Supabase. Access to workspace records is restricted by membership and role.</p><h2>Images and external resources</h2><p>Images uploaded for email use are hosted at public URLs so recipients can view them. Avoid confidential uploads. External image URLs and Google Fonts contact their respective providers when loaded.</p><h2>Payments and email</h2><p>Razorpay handles subscription checkout and payment details. Postly stores subscription identifiers, status, and billing period information. Test emails are delivered through Resend to your verified account address when delivery is enabled.</p><h2>Browser recovery</h2><p>Unsaved recovery copies are kept in this browser. Browser imports happen only when you choose to import, and original local emails are retained.</p><h2>Data access and removal</h2><p>Emails can be moved to Trash and restored. Removing an uploaded image permanently breaks its public URL. Contact the service operator for account data requests.</p></main></>;
  return (
    <>
      <main id="main-content" className="container prose-page">
        <span className="eyebrow">TRANSPARENCY, BY DESIGN.</span>
        <h1>Your data in this demo.</h1>
        <p>
          This is a demonstration product, not an operational subscription
          service. This page describes the demo’s behavior and is not a
          production privacy policy.
        </p>
        <h2>Local storage</h2>
        <p>
          Your entered name, saved email drafts, reusable blocks, Brand Kit, and
          uploaded images are stored in your browser’s local storage. This app
          does not send that information to an account database. You can remove
          it by clearing this site’s browser data. Exported files are saved to
          your device.
        </p>
        <h2>External resources</h2>
        <p>
          The site loads fonts from Google Fonts and example photography from
          Unsplash. Your browser contacts those providers to display those
          resources. Public image URLs you enter are also fetched by your
          browser. Uploaded images stay in browser storage and are embedded in
          exported HTML. The hosting provider may also process normal web
          request information.
        </p>
        <h2>No payments or email delivery</h2>
        <p>
          The demo does not collect payment details, create subscriptions, or
          send emails. Do not enter confidential information into sample
          content.
        </p>
      </main>
    </>
  );
}
