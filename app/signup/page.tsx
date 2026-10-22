import { Auth } from "@/components/auth";
import { plans } from "@/lib/data";
export const metadata = { title: "Start creating — Postly" };
export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const selected = plans.find((p) => p.name.toLowerCase() === plan);
  return <Auth plan={selected?.name} />;
}
