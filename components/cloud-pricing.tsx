"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
type Plan = { id: string; name: string; monthly_paise: number; yearly_paise: number; document_limit: number; asset_limit: number };
export function CloudPricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [yearly, setYearly] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { api<{ plans: Plan[] }>("/api/plans").then(result => setPlans(result.plans)).catch(error => setError(error.message)); }, []);
  return <section id="pricing" className="pricing-section container"><div className="section-heading centered"><h2>A plan for your next chapter.</h2><p>Build responsive emails and keep your work together.</p></div>
    <div className="billing-toggle"><button className={!yearly ? "selected" : ""} onClick={() => setYearly(false)}>Monthly</button><button className={yearly ? "selected" : ""} onClick={() => setYearly(true)}>Yearly</button></div>
    {error && <p role="alert">{error}</p>}<div className="account-plans">{plans.map(plan => <article key={plan.id}><h3>{plan.name}</h3><p>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((yearly ? plan.yearly_paise : plan.monthly_paise) / 100)} / {yearly ? "year" : "month"}</p><p>{plan.document_limit} saved templates · {(plan.asset_limit / 1048576).toFixed(0)} MB storage</p><p>Visual editor, responsive previews, and HTML export</p><Link className="button" href="/account">Choose {plan.name}</Link></article>)}</div>
  </section>;
}
