"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Circle, KeyRound, Loader2, Lock, LogOut, MailWarning } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Banner, Field, PasswordInput, PASSWORD_MIN, friendlyError, passwordScore, strengthLabels, type Notice } from "./cloud-auth";
import { Sk, SkLabel } from "./skeleton";
import "./auth.css";
import "./password-form.css";

type Status = "checking" | "ready" | "expired" | "done";

/**
 * Sets a new password for the signed-in session. Reached from Account & billing, or from the link in a
 * password-reset email (which signs the visitor in first). Saving signs out every device.
 */
export function PasswordForm() {
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const dismiss = useCallback(() => setNotice(null), []);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // A reset link that expired (or was already used) leaves no session: explain instead of redirecting.
  useEffect(() => {
    api<{ user?: { email?: string } }>("/api/session")
      .then(result => { setEmail(result.user?.email || ""); setStatus("ready"); })
      .catch(error => setStatus(error instanceof ApiError && error.status === 401 ? "expired" : "ready"));
  }, []);
  useEffect(() => { if (status === "done" || status === "expired") heading.current?.focus(); }, [status]);

  const longEnough = password.length >= PASSWORD_MIN;
  const matches = confirm.length > 0 && password === confirm;
  const score = passwordScore(password);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!longEnough) found.password = `Use at least ${PASSWORD_MIN} characters.`;
    else if (!matches) found.confirm = "Passwords don’t match.";
    setErrors(found);
    if (found.password) { passwordRef.current?.focus(); return; }
    if (found.confirm) { confirmRef.current?.focus(); return; }
    setBusy(true);
    setNotice(null);
    try {
      await api("/api/account/password", { method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      setConfirm("");
      setStatus("done");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setStatus("expired");
      else if (error instanceof ApiError && error.status === 422) { setErrors({ password: error.message }); passwordRef.current?.focus(); }
      else setNotice({ tone: "error", text: friendlyError(error) });
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="pw-card" aria-busy="true">
        <SkLabel>Checking your session…</SkLabel>
        <Sk w={52} h={52} r={16} style={{ marginBottom: 18 }} />
        <Sk w="70%" h={28} r={8} />
        <Sk w="90%" h={12} style={{ margin: "14px 0 26px" }} />
        <div className="sk-stack"><Sk w={110} h={11} /><Sk h={48} r={12} /><Sk w={150} h={11} /><Sk h={48} r={12} /><Sk h={50} r={12} style={{ marginTop: 10 }} /></div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="pw-card pw-state">
        <span className="pw-icon is-warn"><MailWarning size={26} /></span>
        <h1 ref={heading} tabIndex={-1}>This link has expired</h1>
        <p>Password reset links work once and expire after a short time. Request a new one and use the latest email we send.</p>
        <div className="pw-actions">
          <Link className="button" href="/login?mode=reset">Send a new link <ArrowRight size={16} /></Link>
          <Link className="button secondary" href="/login">Sign in</Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="pw-card pw-state">
        <span className="pw-icon is-good"><CheckCircle2 size={26} /></span>
        <h1 ref={heading} tabIndex={-1}>Password updated</h1>
        <p>For your security, you’ve been signed out on all devices. Sign in with your new password to continue.</p>
        <div className="pw-actions">
          <Link className="button" href="/login?next=%2Fdashboard">Sign in <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pw-card">
      <span className="pw-icon"><KeyRound size={24} /></span>
      <h1>Set a new password</h1>
      <p className="pw-lead">{email ? <>For <strong>{email}</strong>. </> : null}Use at least {PASSWORD_MIN} characters — a short phrase works well.</p>
      <Banner notice={notice} onDismiss={dismiss} />
      <form className="au-form" onSubmit={submit} noValidate>
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <Field id="pw-new" label="New password" icon={<Lock size={17} />} error={errors.password}
          hint={
            <div className="au-strength" id="pw-new-hint" aria-live="polite">
              <div className="au-meter" data-score={score}><i /><i /><i /><i /></div>
              <span>{password ? strengthLabels[score] : `${PASSWORD_MIN}+ characters`}</span>
            </div>
          }>
          <PasswordInput id="pw-new" inputRef={passwordRef} value={password} autoComplete="new-password" invalid={!!errors.password}
            describedBy={errors.password ? "pw-new-error" : "pw-new-hint"}
            onChange={value => { setPassword(value); setErrors(e => ({ ...e, password: undefined })); }} />
        </Field>
        <Field id="pw-confirm" label="Confirm new password" icon={<Lock size={17} />} error={errors.confirm}>
          <PasswordInput id="pw-confirm" inputRef={confirmRef} value={confirm} autoComplete="new-password" invalid={!!errors.confirm} placeholder="Re-enter your new password"
            describedBy={errors.confirm ? "pw-confirm-error" : undefined}
            onChange={value => { setConfirm(value); setErrors(e => ({ ...e, confirm: undefined })); }} />
        </Field>
        <ul className="pw-checks" aria-label="Password requirements">
          <li className={longEnough ? "is-met" : ""}>{longEnough ? <Check size={14} /> : <Circle size={14} />} At least {PASSWORD_MIN} characters</li>
          <li className={matches ? "is-met" : ""}>{matches ? <Check size={14} /> : <Circle size={14} />} Passwords match</li>
        </ul>
        <p className="pw-note"><LogOut size={15} /> Saving signs you out on all devices. You’ll sign in again with the new password.</p>
        <button className="button au-submit" disabled={busy}>
          {busy ? <><Loader2 className="au-spin" size={17} /> Saving…</> : <>Save new password <ArrowRight size={17} /></>}
        </button>
      </form>
    </div>
  );
}
