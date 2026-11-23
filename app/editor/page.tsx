import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/site";
import { cloudMode } from "@/lib/config";
import { Workspace } from "@/components/workspace";
export const metadata = { title: "Your email workspace — Postly" };
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; draft?: string }>;
}) {
  const { template, draft } = await searchParams;
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
      <Workspace
        key={draft || template || "welcome"}
        initialId={template}
        draftId={draft}
      />
      <p className="pricing-footnote">
        {cloudMode ? "Cloud workspace · Changes save to your account." : "Local workspace · Drafts save in this browser."} Export includes your blocks, images, links, and styles.
      </p>
    </main>
  );
}
