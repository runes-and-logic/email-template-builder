import { SkHeading, SkLabel, SkPanel } from "@/components/skeleton";

export default function Loading() {
  return (
    <main id="main-content" className="container sk-page" aria-busy="true">
      <SkLabel>Loading plans…</SkLabel>
      <SkHeading center />
      <div className="sk-cards">{Array.from({ length: 4 }, (_, i) => <SkPanel key={i} rows={3} />)}</div>
    </main>
  );
}
