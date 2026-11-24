export type Plan = { id: string; name: string; monthly_paise: number; yearly_paise: number; document_limit: number; asset_limit: number };
export type PlanCatalog = { plans: Plan[]; paymentsEnabled: boolean };

/** Server-side plan fetch so prices are in the initial HTML. Cached for 5 minutes; null if the backend is unreachable. */
export async function getPlans(): Promise<PlanCatalog | null> {
  const backend = process.env.BACKEND_URL || "http://127.0.0.1:3002";
  try {
    const response = await fetch(`${backend}/api/plans`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const data = (await response.json()) as { plans?: Plan[]; paymentsEnabled?: boolean };
    return Array.isArray(data.plans) ? { plans: data.plans, paymentsEnabled: data.paymentsEnabled === true } : null;
  } catch {
    return null;
  }
}

export const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const storageLabel = (bytes: number) => (bytes >= 1073741824 ? `${+(bytes / 1073741824).toFixed(1)} GB` : `${Math.round(bytes / 1048576)} MB`);

/** Percentage saved by paying yearly, from the real prices (0 when there's no saving). */
export function yearlySaving(plans: Plan[]) {
  const paid = plans.find(plan => plan.monthly_paise > 0);
  if (!paid) return 0;
  return Math.max(0, Math.round((1 - paid.yearly_paise / (paid.monthly_paise * 12)) * 100));
}

export const PLAN_BLURBS: Record<string, string> = {
  free: "For trying Postly and your first few emails.",
  starter: "For small businesses sending regularly.",
  pro: "For growing brands with a steady calendar.",
  business: "For teams producing email at scale.",
};
export const RECOMMENDED_PLAN = "pro";
