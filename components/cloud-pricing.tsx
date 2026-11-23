"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CreditCard, PenLine, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
type Plan = { id: string; name: string; monthly_paise: number; yearly_paise: number; document_limit: number; asset_limit: number };
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export function CloudPricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    api<{ plans: Plan[] }>("/api/plans")
      .then(result => setPlans(result.plans))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  return <section id="pricing" className="pricing-section container">
    <div className="section-heading centered"><span className="eyebrow">ROOM TO GROW</span><h2>A plan for your next chapter.</h2><p>Build responsive emails and keep your work together.</p></div>
    {!failed && <div className="billing-toggle"><button className={!yearly ? "selected" : ""} aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button><button className={yearly ? "selected" : ""} aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly</button></div>}
    {failed && <div className="service-fallback" role="alert">
      <CreditCard size={22} />
      <div><h3>Plans couldn’t be loaded just now.</h3><p>The editor still works — you can start designing for free and choose a plan later.</p></div>
      <div className="service-fallback-actions">
        <button className="button secondary small" onClick={load}><RefreshCw size={14} /> Try again</button>
        <Link className="button small" href="/editor"><PenLine size={14} /> Start designing</Link>
      </div>
    </div>}
    {loading && <div className="pricing-grid" role="status" aria-label="Loading plans">{Array.from({ length: 4 }, (_, i) => <div className="skeleton-plan" key={i}><span /><span /><span /><span /><span /></div>)}</div>}
    {!loading && !failed && <div className="pricing-grid">{plans.map(plan => {
      const price = (yearly ? plan.yearly_paise : plan.monthly_paise) / 100;
      return <article className="price-card" key={plan.id}>
        <h3>{plan.name}</h3>
        <div className="price">{inr.format(price)}<span>/ {yearly ? "year" : "month"}</span></div>
        <Link className={`button ${price ? "" : "secondary"}`} href="/account">{price ? `Choose ${plan.name}` : "Start for free"} <ArrowUpRight size={15} /></Link>
        <div className="plan-features">
          <p><Check size={15} />{plan.document_limit} saved templates</p>
          <p><Check size={15} />{(plan.asset_limit / 1048576).toFixed(0)} MB image storage</p>
          <p><Check size={15} />Visual editor &amp; responsive previews</p>
          <p><Check size={15} />HTML export</p>
        </div>
      </article>;
    })}</div>}
  </section>;
}
