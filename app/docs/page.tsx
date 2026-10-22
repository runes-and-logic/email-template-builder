import Link from "next/link";
import { Nav, Footer } from "@/components/site";
export const metadata = { title: "Getting started — Postly" };
export default function Docs() {
  return (
    <>
      <Nav />
      <main id="main-content" className="container prose-page">
        <span className="eyebrow">A LITTLE GUIDANCE GOES A LONG WAY.</span>
        <h1>Let’s make your first email.</h1>
        <p>
          Postly is a demo workspace for customizing email templates. Everything
          happens in your browser—no account or payment is needed.
        </p>
        <section>
          <h2>1. Find your starting point</h2>
          <p>
            Explore the <Link href="/templates">template library</Link>. Search
            by name, filter by category, or sort alphabetically. Click a preview
            to see a full email, then choose “Use this template.”
          </p>
        </section>
        <section>
          <h2>2. Make it yours</h2>
          <p>
            In the Content tab, edit your brand name, headline, message, button
            text, and destination link. Use the Design tab to choose an accent
            color. Desktop and mobile controls let you inspect both layouts.
            Undo and redo help you explore different ideas.
          </p>
          <p>
            Use “Save draft” to save the current template’s content in this
            browser. Returning to the same template restores your most recent
            save. This is not cloud storage: clearing browser data removes your
            drafts.
          </p>
        </section>
        <section id="export">
          <h2>3. Export your HTML</h2>
          <p>
            Select “Export HTML” to download a responsive HTML file. The export
            includes your text, brand color, and button link in a simple
            table-based layout. Decorative artwork and the more detailed gallery
            layouts are preview inspiration and are not part of the current
            export. The code control shows the exact HTML that will be
            downloaded.
          </p>
          <p>
            Import the file into an email provider that supports custom HTML.
            Before sending, test it in your intended email clients and add any
            required sender information, unsubscribe link, and other compliance
            details through your provider.
          </p>
        </section>
        <section>
          <h2>What this demo includes</h2>
          <p>
            Template browsing, previews, content editing, color customization,
            local draft saves, undo and redo, and HTML downloads are working
            demo features. The landing page’s block palette illustrates an
            editor concept; drag-and-drop, reusable blocks, personalization
            processing, cloud accounts, billing, delivery, and team workspaces
            are not connected.
          </p>
        </section>
        <section id="support">
          <h2>Help & support</h2>
          <p>
            If a saved draft does not appear, check that you are using the same
            browser and template. If storage is disabled, export your HTML
            before leaving the page. If an exported button does not work, use a
            complete link beginning with https:// in the Button link field.
          </p>
          <p>
            This demo does not have a staffed support channel. No contact
            address or social profiles have been configured.
          </p>
        </section>
        <p>
          <Link className="button" href="/editor">
            Create your first email →
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
