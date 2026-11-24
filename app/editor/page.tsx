import { Workspace } from "@/components/workspace";
import { EditorTopBar } from "@/components/editor-topbar";
export const metadata = { title: "Your email workspace — Postly" };
export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; draft?: string }>;
}) {
  const { template, draft } = await searchParams;
  return (
    <main id="main-content" className="editor-page">
      <EditorTopBar />
      <Workspace
        key={draft || template || "welcome"}
        initialId={template}
        draftId={draft}
      />
    </main>
  );
}
