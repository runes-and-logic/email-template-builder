import { Sk, SkCards, SkHeading, SkLabel } from "@/components/skeleton";

export default function Loading() {
  return (
    <main id="main-content" className="container sk-page" aria-busy="true">
      <SkLabel>Loading templates…</SkLabel>
      <SkHeading />
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>{[120, 90, 130, 110, 100].map((w, i) => <Sk key={i} w={w} h={36} r={99} />)}</div>
      <SkCards />
    </main>
  );
}
