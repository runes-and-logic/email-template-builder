"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Palette,
  Smartphone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Logo } from "./site";
import { api, ApiError } from "@/lib/api";
import "./auth.css";

const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN = 30;

type Notice = { tone: "error" | "info" | "success"; text: string } | null;
type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

function friendlyError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError || error instanceof SyntaxError) return "We couldn’t reach Postly. Check your connection and try again.";
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

/** Rough, informational strength score (0–4). The backend only enforces length. */
function passwordScore(password: string) {
  if (!password) return 0;
  let score = password.length >= PASSWORD_MIN ? 1 : 0;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return password.length < PASSWORD_MIN ? Math.min(score, 1) : Math.max(score, 1);
}
const strengthLabels = ["Too short", "Okay", "Good", "Strong", "Excellent"];

function Field({ id, label, icon, error, hint, children, action }: {
  id: string; label: string; icon: ReactNode; error?: string; hint?: ReactNode; children: ReactNode; action?: ReactNode;
}) {
  return (
    <div className={`au-field ${error ? "has-error" : ""}`}>
      <div className="au-label-row">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      <div className="au-input">
        <span className="au-input-icon" aria-hidden="true">{icon}</span>
        {children}
      </div>
      {/* Fixed-height row: an error replaces the hint in place, so the layout never grows. */}
      <div className="au-field-msg">
        {error ? <p className="au-field-error" id={`${id}-error`}><AlertCircle size={14} /> {error}</p> : hint}
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, invalid, describedBy, inputRef }: {
  id: string; value: string; onChange: (value: string) => void; autoComplete: string; invalid: boolean; describedBy?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const [visible, setVisible] = useState(false);
  return <>
    <input ref={inputRef} id={id} name="password" type={visible ? "text" : "password"} autoComplete={autoComplete} value={value}
      onChange={event => onChange(event.target.value)} maxLength={PASSWORD_MAX} aria-invalid={invalid} aria-describedby={describedBy}
      placeholder={autoComplete === "new-password" ? `At least ${PASSWORD_MIN} characters` : "Your password"} />
    <button type="button" className="au-reveal" onClick={() => setVisible(v => !v)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>
      {visible ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  </>;
}

/** Floating notice: overlays the page instead of pushing the form down, so it never adds scroll. */
function Banner({ notice, onRetry, onDismiss }: { notice: Notice; onRetry?: () => void; onDismiss: () => void }) {
  // Success messages fade on their own; errors stay until dismissed or the next attempt.
  useEffect(() => {
    if (notice?.tone !== "success") return;
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);
  if (!notice) return null;
  const Icon = notice.tone === "error" ? AlertCircle : notice.tone === "success" ? CheckCircle2 : Sparkles;
  return (
    <div className={`au-banner tone-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
      <Icon size={18} />
      <p>{notice.text}</p>
      {onRetry && <button type="button" className="au-banner-action" onClick={onRetry}>Try again</button>}
      <button type="button" className="au-banner-close" aria-label="Dismiss message" onClick={onDismiss}><X size={16} /></button>
    </div>
  );
}

function Showcase({ signin }: { signin: boolean }) {
  return (
    <aside className="au-showcase" aria-hidden="true">
      <div className="au-showcase-inner">
        <span className="au-pill"><Sparkles size={13} /> {signin ? "Welcome back" : "Free to start"}</span>
        <h2>{signin ? "Your emails missed you." : "Beautiful emails, without the code."}</h2>
        <p>{signin ? "Pick up right where your inspiration left off." : "Join Postly and turn a great template into an email that feels unmistakably yours."}</p>
        <div className="au-mock">
          <div className="au-mock-bar"><i /><i /><i /></div>
          <div className="au-mock-body">
            <span className="au-mock-brand">wildwonder</span>
            <strong>A little closer<br />to the outdoors.</strong>
            <span className="au-mock-line" />
            <span className="au-mock-line short" />
            <span className="au-mock-image" />
            <span className="au-mock-button">Find your adventure</span>
          </div>
          <span className="au-mock-badge"><Check size={12} /> Looks good on mobile</span>
        </div>
        <ul className="au-benefits">
          <li><Palette size={16} /> Brand Kit with your colors, fonts and logo</li>
          <li><Smartphone size={16} /> Desktop and mobile previews as you build</li>
          <li><Mail size={16} /> Export responsive HTML to any provider</li>
        </ul>
      </div>
    </aside>
  );
}

function Shell({ signin, children }: { signin: boolean; children: ReactNode }) {
  return (
    <main id="main-content" className="au-page">
      <section className="au-main">
        <header className="au-top">
          <Logo />
          <p>
            {signin ? "New to Postly?" : "Already have an account?"}{" "}
            <Link href={signin ? "/signup" : "/login"}>{signin ? "Create an account" : "Sign in"}</Link>
          </p>
        </header>
        <div className="au-card">{children}</div>
        <footer className="au-bottom">
          <Link href="/"><ArrowLeft size={14} /> Back to Postly</Link>
          <span><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></span>
        </footer>
      </section>
      <Showcase signin={signin} />
    </main>
  );
}

function SignupForm({ plan }: { plan?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const dismiss = useCallback(() => setNotice(null), []);
  const [sentTo, setSentTo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), password: useRef<HTMLInputElement>(null) };
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => { if (sentTo) heading.current?.focus(); }, [sentTo]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Tell us what to call you.";
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address, like you@company.com.";
    if (password.length < PASSWORD_MIN) next.password = `Use at least ${PASSWORD_MIN} characters.`;
    return next;
  }

  async function register(isResend = false) {
    setBusy(true);
    setNotice(null);
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "signup", name: name.trim(), email: email.trim(), password }),
      });
      setSentTo(email.trim());
      setCooldown(RESEND_COOLDOWN);
      if (isResend) setNotice({ tone: "success", text: "We’ve sent another confirmation email." });
    } catch (error) {
      const text = friendlyError(error);
      if (error instanceof ApiError && error.status === 422 && /password/i.test(text)) {
        setErrors({ password: text });
        refs.password.current?.focus();
      } else if (error instanceof ApiError && error.status === 422 && /email/i.test(text)) {
        setErrors({ email: text });
        refs.email.current?.focus();
      } else setNotice({ tone: "error", text });
    } finally {
      setBusy(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    const first = (["name", "email", "password"] as const).find(key => found[key]);
    if (first) { refs[first].current?.focus(); return; }
    void register();
  }

  const clear = (key: keyof FieldErrors) => errors[key] && setErrors(current => ({ ...current, [key]: undefined }));
  const score = passwordScore(password);

  if (sentTo) {
    return (
      <div className="au-sent">
        <span className="au-sent-icon"><MailCheck size={28} /></span>
        <h1 ref={heading} tabIndex={-1}>Check your inbox</h1>
        <p>We sent a confirmation link to <strong>{sentTo}</strong>Open it to activate your workspace.</p>
        <Banner notice={notice} onDismiss={dismiss} />
        <ol className="au-steps">
          <li><span>1</span><p>Open the email from Postly.</p></li>
          <li><span>2</span><p>Click the confirmation link inside.</p></li>
          <li><span>3</span><p>You’ll land in your new workspace{plan ? `, ready to activate ${plan}` : ""}.</p></li>
        </ol>
        <p className="au-muted">Can’t find it? Check spam or promotions. It can take a minute to arrive.</p>
        <div className="au-actions">
          <button type="button" className="button secondary" disabled={busy || cooldown > 0} onClick={() => void register(true)}>
            {busy ? <><Loader2 className="au-spin" size={16} /> Sending…</> : cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
          </button>
          <Link className="button" href="/login">Go to sign in <ArrowRight size={16} /></Link>
        </div>
        <button type="button" className="au-link-button" onClick={() => { setSentTo(""); setNotice(null); setPassword(""); }}>
          Wrong email? Use a different address
        </button>
      </div>
    );
  }

  return (
    <>
      <span className="au-eyebrow">YOUR CREATIVE SPACE AWAITS</span>
      <h1>Create your account</h1>
      <p className="au-lead">Start designing beautiful, responsive emails in minutes. No credit card required.</p>
      {plan && (
        <div className="au-plan">
          <Sparkles size={16} />
          <p><strong>{plan} plan selected.</strong> You can activate it from Account &amp; billing once your email is confirmed.</p>
          <Link href="/pricing">Change</Link>
        </div>
      )}
      <Banner notice={notice} onDismiss={dismiss} onRetry={notice?.tone === "error" ? () => void register() : undefined} />
      <form className="au-form" onSubmit={submit} noValidate>
        <Field id="signup-name" label="Your name" icon={<User size={17} />} error={errors.name}>
          <input ref={refs.name} id="signup-name" name="name" autoComplete="name" placeholder="Alex Morgan" value={name} maxLength={60}
            onChange={event => { setName(event.target.value); clear("name"); }} aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "signup-name-error" : undefined} />
        </Field>
        <Field id="signup-email" label="Work email" icon={<Mail size={17} />} error={errors.email}>
          <input ref={refs.email} id="signup-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@company.com"
            value={email} maxLength={254} onChange={event => { setEmail(event.target.value); clear("email"); }} aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "signup-email-error" : undefined} />
        </Field>
        <Field id="signup-password" label="Password" icon={<Lock size={17} />} error={errors.password}
          hint={
            <div className="au-strength" id="signup-password-hint" aria-live="polite">
              <div className="au-meter" data-score={score}><i /><i /><i /><i /></div>
              <span>{password ? strengthLabels[score] : `Use ${PASSWORD_MIN}+ characters. A short phrase works well.`}</span>
            </div>
          }>
          <PasswordInput id="signup-password" inputRef={refs.password} value={password} autoComplete="new-password" invalid={!!errors.password}
            describedBy={errors.password ? "signup-password-error" : "signup-password-hint"}
            onChange={value => { setPassword(value); clear("password"); }} />
        </Field>
        <button className="button au-submit" disabled={busy}>
          {busy ? <><Loader2 className="au-spin" size={17} /> Creating your account…</> : <>Create account <ArrowRight size={17} /></>}
        </button>
        <p className="au-legal">
          By creating an account, you agree to our <Link href="/terms">Terms</Link> and acknowledge our <Link href="/privacy">Privacy notice</Link>.
        </p>
      </form>
    </>
  );
}

function SigninForm() {
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const dismiss = useCallback(() => setNotice(null), []);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("error") === "confirmation")
      setNotice({ tone: "error", text: "That confirmation link has expired or was already used. Sign in, or create your account again to get a new link." });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) found.email = "Enter a valid email address.";
    if (mode === "signin" && !password) found.password = "Enter your password.";
    setErrors(found);
    if (found.email) { emailRef.current?.focus(); return; }
    if (found.password) { passwordRef.current?.focus(); return; }
    setBusy(true);
    setNotice(null);
    try {
      const result = await api<{ message?: string }>("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: mode, email: email.trim(), password }),
      });
      if (mode === "signin") { location.assign("/dashboard"); return; }
      setNotice({ tone: "success", text: result.message || "If an account exists, a reset link is on its way." });
    } catch (error) {
      setNotice({ tone: "error", text: friendlyError(error) });
    } finally {
      setBusy(false);
    }
  }

  const reset = mode === "reset";
  return (
    <>
      <span className="au-eyebrow">{reset ? "IT HAPPENS TO EVERYONE" : "GOOD TO SEE YOU AGAIN"}</span>
      <h1>{reset ? "Reset your password" : "Welcome back"}</h1>
      <p className="au-lead">{reset ? "Enter your account email and we’ll send you a link to choose a new password." : "Sign in to continue designing your emails."}</p>
      <Banner notice={notice} onDismiss={dismiss} />
      <form className="au-form" onSubmit={submit} noValidate>
        <Field id="signin-email" label="Email" icon={<Mail size={17} />} error={errors.email}>
          <input ref={emailRef} id="signin-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@company.com"
            value={email} maxLength={254} onChange={event => { setEmail(event.target.value); setErrors(e => ({ ...e, email: undefined })); }}
            aria-invalid={!!errors.email} aria-describedby={errors.email ? "signin-email-error" : undefined} />
        </Field>
        {!reset && (
          <Field id="signin-password" label="Password" icon={<Lock size={17} />} error={errors.password}
            action={<button type="button" className="au-link-button small" onClick={() => { setMode("reset"); setNotice(null); setErrors({}); }}>Forgot password?</button>}>
            <PasswordInput id="signin-password" inputRef={passwordRef} value={password} autoComplete="current-password" invalid={!!errors.password}
              describedBy={errors.password ? "signin-password-error" : undefined}
              onChange={value => { setPassword(value); setErrors(e => ({ ...e, password: undefined })); }} />
          </Field>
        )}
        <button className="button au-submit" disabled={busy}>
          {busy ? <><Loader2 className="au-spin" size={17} /> {reset ? "Sending link…" : "Signing in…"}</>
            : <>{reset ? "Send reset link" : "Sign in"} <ArrowRight size={17} /></>}
        </button>
        {reset && (
          <button type="button" className="au-link-button" onClick={() => { setMode("signin"); setNotice(null); }}>
            <ArrowLeft size={14} /> Back to sign in
          </button>
        )}
      </form>
    </>
  );
}

export function CloudAuth({ signin, plan }: { signin: boolean; plan?: string }) {
  return <Shell signin={signin}>{signin ? <SigninForm /> : <SignupForm plan={plan} />}</Shell>;
}
