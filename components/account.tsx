"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { cloudMode } from "@/lib/config";
import { inr, storageLabel } from "@/lib/plans";
import { Sk, SkLabel, SkPanel } from "./skeleton";
import "./account.css";

type AccountData = {
  email: string; workspaceId: string; workspace: string; role: string;
  plan: { id: string; name: string; document_limit: number; asset_limit: number };
  subscription: { status: string; current_end: string } | null;
  usage: { documents: number; assets: number };
};
type Plan = { id: string; name: string; monthly_paise: number; yearly_paise: number; document_limit: number; asset_limit: number };
type Notice = { tone: "success" | "error"; text: string } | null;

const ROLE_LABEL: Record<string, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };

function Section({ icon, title, hint, children, actions }: { icon: ReactNode; title: string; hint?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="ac-section">
      <header>
        <span className="ac-section-icon">{icon}</span>
        <div><h2>{title}</h2>{hint && <p>{hint}</p>}</div>
        {actions}
      </header>
      <div className="ac-section-body">{children}</div>
    </section>
  );
}

function Meter({ label, used, limit, format }: { label: string; used: number; limit: number; format: (value: number) => string }) {
  const share = limit ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div className="ac-meter">
      <div><span>{label}</span><strong>{format(used)} <em>of {format(limit)}</em></strong></div>
      <div className={`ac-bar ${share >= 90 ? "is-high" : ""}`}><i style={{ width: `${share}%` }} /></div>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="container ac-page" aria-busy="true">
      <SkLabel>Loading your account…</SkLabel>
      <div className="ac-head"><div className="ac-identity"><Sk w={56} h={56} r={99} /><div className="sk-stack" style={{ gap: 10 }}><Sk w={220} h={28} r={8} /><Sk w={180} h={12} /></div></div></div>
      <div className="ac-grid">
        <div className="sk-stack"><SkPanel rows={2} /><SkPanel rows={3} /></div>
        <div className="sk-stack"><SkPanel rows={2} /><SkPanel rows={1} /></div>
      </div>
    </div>
  );
}

export function Account() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState("");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("editor");
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Load account, plans and workspaces; signed-out visitors go to sign in and come back here.
  useEffect(() => {
    if (!cloudMode) return;
    let active = true;
    setLoadError("");
    Promise.all([
      api<AccountData>("/api/account"),
      api<{ plans: Plan[]; paymentsEnabled?: boolean }>("/api/plans"),
      api<{ workspaces: { id: string; name: string }[] }>("/api/workspaces"),
    ])
      .then(([data, catalog, spaces]) => {
        if (!active) return;
        setAccount(data);
        setPlans(catalog.plans);
        setPaymentsEnabled(catalog.paymentsEnabled === true);
        setWorkspaces(spaces.workspaces);
      })
      .catch(error => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) { location.replace(`/login?next=${encodeURIComponent("/account")}`); return; }
        setLoadError(error instanceof Error ? error.message : "We couldn’t load your account.");
      });
    // Platform administration link only for administrators (403 for everyone else).
    api("/api/admin").then(() => active && setIsAdmin(true)).catch(() => {});
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    if (notice?.tone !== "success") return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const run = useCallback(async (key: string, task: () => Promise<string | void>) => {
    setBusy(key);
    setNotice(null);
    try {
      const message = await task();
      if (message) setNotice({ tone: "success", text: message });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    } finally {
      setBusy("");
    }
  }, []);

  if (!cloudMode) {
    return (
      <div className="container ac-page">
        <div className="ac-demo">
          <h1>Browser workspace</h1>
          <p>You’re using Postly in demo mode. Emails and your Brand Kit are saved in this browser — accounts, teams and billing are available when cloud mode is configured.</p>
          <div className="ac-actions"><Link className="button" href="/dashboard">My Templates <ArrowRight size={16} /></Link><Link className="button secondary" href="/brand">Brand Kit</Link></div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container ac-page">
        <div className="ac-state" role="alert">
          <AlertCircle size={26} />
          <h1>Your account didn’t load</h1>
          <p>{loadError}</p>
          <button type="button" className="button" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} /> Try again</button>
        </div>
      </div>
    );
  }

  if (!account) return <AccountSkeleton />;

  const owner = account.role === "owner";
  const active = account.subscription?.status === "active";
  const paidPlans = plans.filter(plan => plan.monthly_paise > 0);

  return (
    <div className="container ac-page">
      <div className="ac-head">
        <div className="ac-identity">
          <span className="ac-avatar" aria-hidden="true">{account.email.charAt(0).toUpperCase()}</span>
          <div>
            <h1>Account</h1>
            <p>{account.email}</p>
          </div>
        </div>
        <button type="button" className="button secondary small" disabled={!!busy}
          onClick={() => void run("signout", async () => { await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "signout" }) }); location.assign("/login"); })}>
          {busy === "signout" ? <Loader2 size={15} className="ac-spin" /> : <LogOut size={15} />} Sign out
        </button>
      </div>

      {notice && (
        <div className={`ac-notice tone-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "error" ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
          <p>{notice.text}</p>
          <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}><X size={15} /></button>
        </div>
      )}

      <div className="ac-grid">
        <div className="ac-col">
          <Section icon={<CreditCard size={18} />} title="Plan & usage" hint={owner ? "Your workspace’s plan and limits." : "Managed by the workspace owner."}
            actions={<Link className="ac-link" href="/pricing">Compare plans <ArrowUpRight size={14} /></Link>}>
            <div className="ac-plan">
              <div>
                <span className="ac-plan-name">{account.plan.name} plan</span>
                <span className={`ac-badge ${active ? "is-good" : ""}`}>{account.subscription ? account.subscription.status : "Free"}</span>
              </div>
              {account.subscription?.current_end && (
                <p>{active ? "Renews" : "Ends"} {new Date(account.subscription.current_end).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
              )}
            </div>
            <Meter label="Saved emails" used={account.usage.documents} limit={account.plan.document_limit} format={value => String(value)} />
            <Meter label="Image storage" used={account.usage.assets || 0} limit={account.plan.asset_limit} format={value => (value < 1048576 ? `${(value / 1048576).toFixed(1)} MB` : storageLabel(value))} />

            {owner && !paymentsEnabled && !active && (
              <p className="ac-muted">Paid plans are coming soon. Your workspace stays on the {account.plan.name} plan until then.</p>
            )}
            {owner && paymentsEnabled && !active && paidPlans.length > 0 && (
              <div className="ac-upgrade">
                <div className="ac-segment" role="group" aria-label="Billing period">
                  {(["monthly", "yearly"] as const).map(value => (
                    <button key={value} type="button" aria-pressed={period === value} className={period === value ? "active" : ""} onClick={() => setPeriod(value)}>{value === "monthly" ? "Monthly" : "Yearly"}</button>
                  ))}
                </div>
                <div className="ac-plans">
                  {paidPlans.map(plan => (
                    <div key={plan.id} className="ac-plan-option">
                      <div><strong>{plan.name}</strong><span>{plan.document_limit} emails · {storageLabel(plan.asset_limit)}</span></div>
                      <button type="button" className="button small" disabled={!!busy}
                        onClick={() => void run(`checkout-${plan.id}`, async () => {
                          const result = await api<{ url: string }>("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: plan.id, interval: period }) });
                          location.assign(result.url);
                        })}>
                        {busy === `checkout-${plan.id}` ? <Loader2 size={14} className="ac-spin" /> : null}
                        {inr.format((period === "monthly" ? plan.monthly_paise : plan.yearly_paise) / 100)}/{period === "monthly" ? "mo" : "yr"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {owner && active && (
              confirmCancel ? (
                <div className="ac-confirm" role="alert">
                  <p>Cancel your subscription? Paid access continues until the end of the current billing period.</p>
                  <div className="ac-actions">
                    <button type="button" className="button small is-danger" disabled={!!busy}
                      onClick={() => void run("cancel", async () => {
                        const result = await api<{ message: string }>("/api/billing/cancel", { method: "POST", body: "{}" });
                        setConfirmCancel(false); setRefresh(value => value + 1); return result.message;
                      })}>{busy === "cancel" ? <Loader2 size={14} className="ac-spin" /> : null} Cancel subscription</button>
                    <button type="button" className="button secondary small" onClick={() => setConfirmCancel(false)}>Keep plan</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="ac-text-button is-danger" onClick={() => setConfirmCancel(true)}>Cancel subscription</button>
              )
            )}
          </Section>

          {owner && (
            <Section icon={<Users size={18} />} title="Team access" hint="Invite existing, verified Postly accounts to this workspace.">
              <form className="ac-team" onSubmit={event => {
                event.preventDefault();
                const email = memberEmail.trim();
                void run("member", async () => {
                  await api("/api/workspaces/members", { method: "POST", body: JSON.stringify({ email, role: memberRole }) });
                  setMemberEmail("");
                  return memberRole === "remove" ? `${email} no longer has access.` : `${email} is now ${memberRole === "editor" ? "an Editor" : "a Viewer"}.`;
                });
              }}>
                <label className="ac-field"><span>Email address</span>
                  <input type="email" required maxLength={254} placeholder="teammate@company.com" value={memberEmail} onChange={event => setMemberEmail(event.target.value)} />
                </label>
                <label className="ac-field ac-field-role"><span>Access</span>
                  <select value={memberRole} onChange={event => setMemberRole(event.target.value)}>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="remove">Remove access</option>
                  </select>
                </label>
                <button className="button small" disabled={!!busy || !memberEmail.trim()}>
                  {busy === "member" ? <Loader2 size={14} className="ac-spin" /> : <UserPlus size={15} />} {memberRole === "remove" ? "Remove" : "Save access"}
                </button>
              </form>
              <ul className="ac-roles">
                <li><strong>Editor</strong> can create, edit and export emails.</li>
                <li><strong>Viewer</strong> can open and export emails, but not change them.</li>
                <li>You stay the owner and control billing and membership.</li>
              </ul>
            </Section>
          )}
        </div>

        <div className="ac-col">
          <Section icon={<Building2 size={18} />} title="Workspace">
            <div className="ac-workspace">
              <div><strong>{account.workspace}</strong><span className="ac-badge">{ROLE_LABEL[account.role] || account.role}</span></div>
            </div>
            {workspaces.length > 1 && (
              <label className="ac-field"><span>Switch workspace</span>
                <select value={account.workspaceId} disabled={!!busy}
                  onChange={event => { const workspaceId = event.target.value; void run("workspace", async () => {
                    await api("/api/workspaces", { method: "POST", body: JSON.stringify({ workspaceId }) });
                    setRefresh(value => value + 1);
                    return "Workspace switched.";
                  }); }}>
                  {workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
                </select>
              </label>
            )}
            <div className="ac-quick">
              <Link href="/dashboard">My Templates <ArrowRight size={14} /></Link>
              <Link href="/brand">Brand Kit <ArrowRight size={14} /></Link>
            </div>
          </Section>

          <Section icon={<KeyRound size={18} />} title="Security">
            <div className="ac-row">
              <div><strong>Password</strong><span>Changing it signs you out on all devices.</span></div>
              <Link className="button secondary small" href="/account/password">Change password</Link>
            </div>
          </Section>

          {isAdmin && (
            <Section icon={<Shield size={18} />} title="Platform administration">
              <div className="ac-row">
                <div><strong>Admin console</strong><span>Users, plans, catalog and roles.</span></div>
                <Link className="button secondary small" href="/platform">Open <ArrowUpRight size={14} /></Link>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
