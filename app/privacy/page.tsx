import { Nav, Footer } from "@/components/site";
export const metadata = { title: "Demo privacy information — Postly" };
export default function Privacy() {
  return (
    <>
      <Nav />
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
          Your entered name and explicitly saved email drafts are stored in your
          browser’s local storage. This app does not send that information to an
          account database. You can remove it by clearing this site’s browser
          data. Exported files are saved to your device.
        </p>
        <h2>External resources</h2>
        <p>
          The site loads fonts from Google Fonts and example photography from
          Unsplash. Your browser contacts those providers to display those
          resources. The hosting provider may also process normal web request
          information.
        </p>
        <h2>No payments or email delivery</h2>
        <p>
          The demo does not collect payment details, create subscriptions, or
          send emails. Do not enter confidential information into sample
          content.
        </p>
      </main>
      <Footer />
    </>
  );
}
