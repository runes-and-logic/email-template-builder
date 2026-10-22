"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, PenLine, Check } from "lucide-react";
import { Logo } from "./site";
export function Auth({
  signin = false,
  plan,
}: {
  signin?: boolean;
  plan?: string;
}) {
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name to personalize your workspace.");
      return;
    }
    setBusy(true);
    try {
      localStorage.setItem("postly-demo-name", name.trim());
      setReady(true);
      setError("");
    } catch {
      setError(
        "Browser storage is unavailable. You can still open the editor directly.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="auth-page">
      <Logo />
      <div className="auth-card">
        {ready ? (
          <>
            <span className="eyebrow">MAKE SOMETHING GOOD.</span>
            <h1>Welcome, {name.trim().split(" ")[0]}.</h1>
            <p>
              Your next email starts with a little inspiration. Where would you
              like to begin?
            </p>
            <div className="onboarding-list">
              <Link href="/templates">
                <Layers size={20} />
                Find a template <ArrowRight size={16} />
              </Link>
              <Link href="/editor">
                <PenLine size={20} />
                Open the editor <ArrowRight size={16} />
              </Link>
            </div>
            <div className="demo-banner">
              <Check size={13} /> Your workspace is ready. Save a draft in the
              editor to keep it in this browser.
            </div>
          </>
        ) : (
          <>
            <span className="eyebrow">YOUR CREATIVE SPACE AWAITS.</span>
            <h1>{signin ? "Welcome back." : "Good emails start here."}</h1>
            <p>
              {signin
                ? "Pick up where your inspiration left off."
                : "Meet your new favorite way to create emails."}
            </p>
            <div className="demo-banner">
              {plan ? `You selected the sample ${plan} plan. ` : ""}You’re
              exploring a demo. No account, password, or payment is required.
              Drafts are stored only in this browser.
            </div>
            <form onSubmit={submit}>
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="given-name"
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  required
                  maxLength={60}
                  aria-describedby={error ? "form-error" : undefined}
                />
              </label>
              {error && (
                <p id="form-error" className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="button" disabled={busy}>
                {busy ? "Opening your workspace…" : "Enter demo workspace"}{" "}
                <ArrowRight size={16} />
              </button>
            </form>
            <p className="auth-foot">
              Prefer to jump right in?{" "}
              <Link href="/editor">Open the editor</Link>
            </p>
          </>
        )}
      </div>
      <Link className="text-link" href="/">
        ← Back to Postly
      </Link>
    </main>
  );
}
