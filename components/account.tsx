"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { cloudMode } from "@/lib/config";
type AccountData = { email: string; workspaceId: string; workspace: string; role: string; plan: { id: string; name: string; document_limit: number; asset_limit: number }; subscription: { status: string; current_end: string } | null; usage: { documents: number; assets: number } };
type Plan = { id: string; name: string; monthly_paise: number; yearly_paise: number; document_limit: number };
export function Account() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [period, setPeriod] = useState("monthly");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("editor");
  useEffect(() => {
    if (!cloudMode) return;
    Promise.all([api<AccountData>("/api/account"), api<{ plans: Plan[] }>("/api/plans"), api<{ workspaces: typeof workspaces }>("/api/workspaces")]).then(([data, catalog, spaces]) => { setAccount(data); setPlans(catalog.plans); setWorkspaces(spaces.workspaces); }).catch(error => setMessage(error.message));
  }, []);
  async function action(run: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await run(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to continue."); }
    finally { setBusy(false); }
  }
  if (!cloudMode) return <div className="container prose-page"><h1>Browser workspace</h1><p>Accounts and billing are available when cloud mode is configured.</p><Link href="/dashboard">My Templates</Link></div>;
  return <div className="container prose-page"><h1>Account & billing</h1>
    {message && <p className="inline-notice" role="status">{message}</p>}
    {!account ? <p role="status">Loading account…</p> : <>
      <p>{account.email} · {account.role}</p><h2>{account.workspace}</h2>
      <label>Workspace<select value={account.workspaceId} disabled={busy} onChange={event => void action(async () => { await api("/api/workspaces", { method: "POST", body: JSON.stringify({ workspaceId: event.target.value }) }); location.reload(); })}>{workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
      <p>{account.plan.name} · {account.usage.documents} / {account.plan.document_limit} templates · {(account.usage.assets / 1048576).toFixed(1)} / {(account.plan.asset_limit / 1048576).toFixed(0)} MB assets</p>
      {account.subscription && <p>Subscription: {account.subscription.status}. Current period ends {account.subscription.current_end ? new Date(account.subscription.current_end).toLocaleDateString() : "—"}.</p>}
      <div className="studio-actions"><Link className="button secondary" href="/dashboard">My Templates</Link><Link className="button secondary" href="/account/password">Change password</Link><Link className="text-link" href="/platform">Platform administration</Link><button className="button secondary" disabled={busy} onClick={() => void action(async () => { await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "signout" }) }); location.assign("/login"); })}>Sign out</button></div>
      {account.role === "owner" && <><h2>Subscription plans</h2><label>Billing period<select value={period} onChange={event => setPeriod(event.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
        <div className="account-plans">{plans.filter(plan => plan.id !== "free").map(plan => <section key={plan.id}><h3>{plan.name}</h3><p>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((period === "monthly" ? plan.monthly_paise : plan.yearly_paise) / 100)} / {period === "monthly" ? "month" : "year"}</p><p>{plan.document_limit} templates</p><button className="button" disabled={busy || account.subscription?.status === "active"} onClick={() => void action(async () => { const result = await api<{ url: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: plan.id, interval: period }) }); location.assign(result.url); })}>Continue to checkout</button></section>)}</div>
        {account.subscription?.status === "active" && <details><summary>Cancel subscription</summary><p>Your paid access continues through the current billing period.</p><button className="button secondary" disabled={busy} onClick={() => void action(async () => { const result = await api<{ message: string }>("/api/billing/cancel", { method: "POST", body: "{}" }); setMessage(result.message); })}>Confirm cancellation at period end</button></details>}
        <h2>Team access</h2><p>Add an existing, verified account to this workspace. Owners retain control of billing and membership.</p><form onSubmit={event => { event.preventDefault(); void action(async () => { await api("/api/workspaces/members", { method: "POST", body: JSON.stringify({ email: memberEmail, role: memberRole }) }); setMemberEmail(""); setMessage("Workspace access updated."); }); }}><label>Member email<input required type="email" value={memberEmail} onChange={event => setMemberEmail(event.target.value)} /></label><label>Access<select value={memberRole} onChange={event => setMemberRole(event.target.value)}><option value="editor">Editor</option><option value="viewer">Viewer</option><option value="remove">Remove access</option></select></label><button className="button secondary" disabled={busy}>Update member access</button></form>
      </>}
    </>}
  </div>;
}
