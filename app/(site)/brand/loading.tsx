import { Sk, SkHeading, SkLabel, SkPanel } from "@/components/skeleton";

export default function Loading() {
  return (
    <main id="main-content" className="container sk-page" aria-busy="true">
      <SkLabel>Loading your Brand Kit…</SkLabel>
      <SkHeading />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(300px,440px)", gap: 28 }}>
        <div className="sk-stack"><SkPanel rows={3} /><SkPanel rows={2} /></div>
        <Sk h={560} r={16} />
      </div>
    </main>
  );
}
