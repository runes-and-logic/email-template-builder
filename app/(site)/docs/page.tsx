import Link from "next/link";
export const metadata = { title: "Getting started — Postly" };
export default function Docs() {
  return (
    <>
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
            Add content or layout blocks from the left library. Select a block
            on the canvas to edit text, images, links, typography, colors, and
            spacing on the right. Drag the grip to reorder blocks, or use the up
            and down buttons with your keyboard. Desktop and mobile controls let
            you inspect both layouts. Undo and redo help you explore different
            ideas.
          </p>
          <p>
            Use “Save draft” to save the current template’s content in this
            browser. Returning to the same template restores your most recent
            save. Visit My Templates to manage all saved work. This is not cloud
            storage: clearing browser data removes your drafts.
          </p>
        </section>
        <section id="export">
          <h2>3. Export your HTML</h2>
          <p>
            Select “Export HTML” to download a responsive HTML file. The export
            includes your blocks, images, links, columns, and styles in a
            responsive table-based layout. Gallery artwork offers visual
            inspiration; the editable canvas and Preview email show your actual
            content. View HTML displays the exact export. Public HTTPS image
            URLs offer broader email compatibility than embedded uploads.
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
            Template browsing, block editing, drag reordering, reusable saved
            blocks, undo and redo, HTML downloads, My Templates, and Brand Kit
            work locally. In My Templates you can create, duplicate, rename,
            delete, and filter your saved work. Configure your branding in Brand
            Kit, save it, then choose Apply Brand Kit in any editor. Cloud
            accounts, billing, email delivery, and team workspaces are not
            connected.
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
    </>
  );
}
