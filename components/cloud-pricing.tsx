"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  CreditCard,
  History,
  Image as ImageIcon,
  Layers,
  Mail,
  MonitorSmartphone,
  Palette,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { inr, PLAN_BLURBS, RECOMMENDED_PLAN, storageLabel, yearlySaving, type Plan, type PlanCatalog } from "@/lib/plans";
import "./pricing.css";

/** Features every plan includes; plans differ only by saved-email and image-storage limits. */
const INCLUDED = [
  { icon: PenLine, label: "Visual drag-and-drop editor" },
  { icon: Layers, label: "Every template in the library" },
  { icon: MonitorSmartphone, label: "Desktop & mobile previews" },
  { icon: Palette, label: "Brand Kit with your logo, colors and fonts" },
  { icon: Mail, label: "Responsive HTML export" },
  { icon: Send, label: "Test emails to yourself" },
  { icon: History, label: "Version history & Trash" },
  { icon: Users, label: "Invite teammates to your workspace" },
];

function priceFor(plan: Plan, yearly: boolean) {
  const paise = yearly ? plan.yearly_paise / 12 : plan.monthly_paise;
  return Math.round(paise / 100);
}

export function CloudPricing({ initial, compact = false }: { initial?: PlanCatalog | null; compact?: boolean }) {
  const [catalog, setCatalog] = useState<PlanCatalog | null>(initial || null);
  const [loading, setLoading] = useState(!initial);
  const [failed, setFailed] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    api<{ plans: Plan[]; paymentsEnabled?: boolean }>("/api/plans")
      .then(result => setCatalog({ plans: result.plans, paymentsEnabled: result.paymentsEnabled === true }))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (!initial) load(); }, [initial, load]);

  // Signed-in visitors see their current plan; signed-out visitors simply get signup links.
  useEffect(() => {
    api<{ plan: { id: string } }>("/api/account")
      .then(account => { setSignedIn(true); setCurrent(account.plan.id); })
      .catch(() => {});
  }, []);

  const plans = catalog?.plans || [];
  const paymentsEnabled = catalog?.paymentsEnabled === true;
  const saving = yearlySaving(plans);

  function action(plan: Plan) {
    const paid = plan.monthly_paise > 0;
    if (current === plan.id) return <span className="button secondary pr-cta is-current" aria-disabled="true"><Check size={16} /> Your current plan</span>;
    if (!paid) {
      return signedIn
        ? <Link className="button secondary pr-cta" href="/account">Manage in Account</Link>
        : <Link className="button secondary pr-cta" href="/signup">Start for free <ArrowRight size={16} /></Link>;
    }
    if (!paymentsEnabled) return <span className="button secondary pr-cta is-held" aria-disabled="true"><Clock size={15} /> Coming soon</span>;
    return signedIn
      ? <Link className="button pr-cta" href="/account">Upgrade to {plan.name} <ArrowUpRight size={16} /></Link>
      : <Link className="button pr-cta" href={`/signup?plan=${plan.id}`}>Choose {plan.name} <ArrowUpRight size={16} /></Link>;
  }

  return (
    <section id="pricing" className={`pr ${compact ? "is-compact" : ""}`} aria-labelledby="pr-title">
      <div className="container">
        <header className="pr-head">
          <span className="eyebrow">PRICING</span>
          {compact ? <h2 id="pr-title">Simple plans that grow with you.</h2> : <h1 id="pr-title">Simple plans that grow with you.</h1>}
          <p>Every plan includes every feature. Choose how many emails and how much image storage you need.</p>
          {!failed && (
            <div className="pr-toggle" role="group" aria-label="Billing period">
              <button type="button" aria-pressed={!yearly} className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>Monthly</button>
              <button type="button" aria-pressed={yearly} className={yearly ? "active" : ""} onClick={() => setYearly(true)}>
                Yearly {saving > 0 && <span>Save {saving}%</span>}
              </button>
            </div>
          )}
        </header>

        {!loading && !failed && !paymentsEnabled && (
          <div className="pr-held" role="status">
            <Sparkles size={18} />
            <p><strong>Paid plans are coming soon.</strong> Everyone starts on the Free plan today — no card needed.</p>
          </div>
        )}

        {failed && (
          <div className="service-fallback" role="alert">
            <CreditCard size={22} />
            <div><h3>Plans couldn’t be loaded just now.</h3><p>The editor still works — you can start designing for free and choose a plan later.</p></div>
            <div className="service-fallback-actions">
              <button className="button secondary small" onClick={load}><RefreshCw size={14} /> Try again</button>
              <Link className="button small" href="/editor?template=blank"><PenLine size={14} /> Start designing</Link>
            </div>
          </div>
        )}

        {loading && (
          <div className="pr-grid" role="status" aria-label="Loading plans">
            {Array.from({ length: 4 }, (_, i) => <div className="pr-card pr-skel" key={i}><span /><span /><span /><span /></div>)}
          </div>
        )}

        {!loading && !failed && (
          <div className="pr-grid">
            {plans.map(plan => {
              const price = priceFor(plan, yearly);
              const recommended = plan.id === RECOMMENDED_PLAN;
              return (
                <article key={plan.id} className={`pr-card ${recommended ? "is-recommended" : ""} ${current === plan.id ? "is-current" : ""}`}>
                  {recommended && <span className="pr-ribbon">Most popular</span>}
                  {current === plan.id && !recommended && <span className="pr-ribbon is-current">Current plan</span>}
                  <h3>{plan.name}</h3>
                  <p className="pr-blurb">{PLAN_BLURBS[plan.id] || "Everything you need to create great emails."}</p>
                  <div className="pr-price">
                    <strong>{inr.format(price)}</strong>
                    <span>/ month</span>
                  </div>
                  <p className="pr-billing">
                    {plan.monthly_paise === 0 ? "Free forever" : yearly ? `${inr.format(plan.yearly_paise / 100)} billed yearly` : "Billed monthly · cancel anytime"}
                  </p>
                  {action(plan)}
                  <ul className="pr-limits">
                    <li><Mail size={15} /><span><strong>{plan.document_limit}</strong> saved emails</span></li>
                    <li><ImageIcon size={15} /><span><strong>{storageLabel(plan.asset_limit)}</strong> image storage</span></li>
                    <li><Check size={15} /><span>All features included</span></li>
                  </ul>
                </article>
              );
            })}
          </div>
        )}

        {compact ? (
          <p className="pr-more"><Link className="text-link" href="/pricing">Compare plans in detail <ArrowRight size={15} /></Link></p>
        ) : (
          !loading && !failed && (
            <>
              <section className="pr-included" aria-labelledby="pr-included-title">
                <h2 id="pr-included-title">Every plan includes</h2>
                <ul>{INCLUDED.map(({ icon: Icon, label }) => <li key={label}><span><Icon size={17} /></span>{label}</li>)}</ul>
              </section>

              <section className="pr-compare" aria-labelledby="pr-compare-title">
                <h2 id="pr-compare-title">Compare plans</h2>
                <div className="pr-table-wrap">
                  <table>
                    <thead>
                      <tr><th scope="col">Plan</th>{plans.map(plan => <th scope="col" key={plan.id} className={plan.id === RECOMMENDED_PLAN ? "is-recommended" : ""}>{plan.name}</th>)}</tr>
                    </thead>
                    <tbody>
                      <tr><th scope="row">Price per month</th>{plans.map(plan => <td key={plan.id}>{plan.monthly_paise ? inr.format(plan.monthly_paise / 100) : "Free"}</td>)}</tr>
                      <tr><th scope="row">Price per year</th>{plans.map(plan => <td key={plan.id}>{plan.yearly_paise ? inr.format(plan.yearly_paise / 100) : "Free"}</td>)}</tr>
                      <tr><th scope="row">Saved emails</th>{plans.map(plan => <td key={plan.id}>{plan.document_limit}</td>)}</tr>
                      <tr><th scope="row">Image storage</th>{plans.map(plan => <td key={plan.id}>{storageLabel(plan.asset_limit)}</td>)}</tr>
                      {INCLUDED.map(({ label }) => (
                        <tr key={label}><th scope="row">{label}</th>{plans.map(plan => <td key={plan.id}><Check size={16} aria-label="Included" /></td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )
        )}
      </div>
    </section>
  );
}
