import { cloudMode } from "@/lib/config";
import { Nav, Footer } from "@/components/site";
export const metadata = { title: "Demo terms — Postly" };
export default function Terms() {
  if (cloudMode) return <><Nav /><main id="main-content" className="container prose-page"><h1>Using Postly</h1><h2>Your content</h2><p>Use content and images you have permission to use. Review your email, destinations, sender information, and unsubscribe requirements in your delivery platform before sending a campaign.</p><h2>Subscriptions</h2><p>Plan limits and billing periods appear in your account. Review the amount and plan in Razorpay checkout before authorizing payment. Workspace owners manage subscriptions and can request cancellation at the end of the current billing period.</p><h2>Exports and assets</h2><p>Email clients render HTML differently. Preview and test exported emails in your intended clients. Public image URLs must remain available for previously exported emails to display their images.</p><h2>Your workspace</h2><p>Workspace owners control membership and permissions. Keep account credentials private and keep independent copies of important exports.</p></main><Footer /></>;
  return (
    <>
      <Nav />
      <main id="main-content" className="container prose-page">
        <span className="eyebrow">A CLEAR START.</span>
        <h1>About this demonstration.</h1>
        <p>
          Postly is provided here as a functional design prototype. These are
          demo notices, not a production service agreement.
        </p>
        <h2>Sample plans and content</h2>
        <p>
          Template brands, messages, and subscription plans are fictional sample
          content. No paid subscription, service entitlement, email sending
          quota, or support commitment is created by selecting a plan.
        </p>
        <h2>Using your export</h2>
        <p>
          Review and test your exported HTML before using it in a campaign. You
          are responsible for replacing example content, using images you are
          authorized to use, and configuring sender information and unsubscribe
          features in your delivery platform.
        </p>
        <h2>Drafts and availability</h2>
        <p>
          Drafts remain in this browser and are not backed up to a server.
          Download your work if you need a lasting copy. The prototype is
          provided without a service availability commitment.
        </p>
      </main>
      <Footer />
    </>
  );
}
