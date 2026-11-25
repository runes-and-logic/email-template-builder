import { Sk, SkLabel } from "@/components/skeleton";
import "../../../../components/password-form.css";

export default function Loading() {
  return (
    <main id="main-content" className="container pw-page" aria-busy="true">
      <div className="pw-card">
        <SkLabel>Loading…</SkLabel>
        <Sk w={52} h={52} r={16} style={{ marginBottom: 18 }} />
        <Sk w="70%" h={28} r={8} />
        <div className="sk-stack" style={{ marginTop: 26 }}><Sk h={48} r={12} /><Sk h={48} r={12} /><Sk h={50} r={12} /></div>
      </div>
    </main>
  );
}
