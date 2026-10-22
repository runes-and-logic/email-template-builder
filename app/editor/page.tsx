import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/site";
import { Editor } from "@/components/editor";
export const metadata = { title: "Your email workspace — Postly" };
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  return (
    <main id="main-content" className="editor-page">
      <div className="editor-page-nav">
        <Logo />
        <p>A little creativity. A very good email.</p>
        <div>
          <Link className="text-link" href="/templates">
            Browse templates <ArrowUpRight size={14} />
          </Link>
          <Link className="text-link" href="/docs#export">
            Export guide
          </Link>
        </div>
      </div>
      <Editor key={template || "welcome"} initialId={template} />
      <p className="pricing-footnote">
        Demo workspace · Drafts are saved only in this browser. HTML export
        includes your content and brand color in a simple responsive layout.
      </p>
    </main>
  );
}
