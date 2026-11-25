import { EditorTopBar } from "@/components/editor-topbar";
import { EditorLoading } from "@/components/editor-loading";

// Same skeleton the editor shows while it loads, so navigation into the editor has no blank frame.
export default function Loading() {
  return (
    <main id="main-content" className="editor-page">
      <EditorTopBar />
      <EditorLoading stage="account" />
    </main>
  );
}
