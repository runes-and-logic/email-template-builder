import { Sk, SkCards, SkHeading, SkLabel } from "@/components/skeleton";

export default function Loading() {
  return (
    <main id="main-content" className="container sk-page" aria-busy="true">
      <SkLabel>Opening your workspace…</SkLabel>
      <SkHeading />
      <Sk h={74} r={14} style={{ marginBottom: 24 }} />
      <SkCards count={4} />
    </main>
  );
}
