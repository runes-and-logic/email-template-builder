"use client";
import { useState } from "react";
import Link from "next/link";
import { Logo } from "./site";
import { api } from "@/lib/api";
export function CloudAuth({ signin }: { signin: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(action: string) {
    setBusy(true); setMessage("");
    try {
      const result = await api<{ message?: string }>("/api/auth", { method: "POST", body: JSON.stringify({ action, email, password, name }) });
      if (action === "signin") location.assign("/dashboard");
      else setMessage(result.message || "Check your email.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to continue."); }
    finally { setBusy(false); }
  }
  return <main id="main-content" className="auth-page"><Logo /><div className="auth-card">
    <h1>{signin ? "Welcome back." : "Create your workspace."}</h1>
    <form onSubmit={event => { event.preventDefault(); void submit(signin ? "signin" : "signup"); }}>
      {!signin && <label>Your name<input autoComplete="name" value={name} onChange={event => setName(event.target.value)} maxLength={60} required /></label>}
      <label>Email<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} required /></label>
      <label>Password<input type="password" autoComplete={signin ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} minLength={12} maxLength={128} required /></label>
      <p>Use at least 12 characters. Confirm your email before signing in.</p>
      <button className="button" disabled={busy}>{busy ? "Please wait…" : signin ? "Sign in" : "Create account"}</button>
    </form>
    {message && <p role="status">{message}</p>}
    {signin && <button className="text-link" disabled={busy || !email} onClick={() => void submit("reset")}>Send password reset email</button>}
    <p><Link href={signin ? "/signup" : "/login"}>{signin ? "Create an account" : "Already have an account? Sign in"}</Link></p>
  </div></main>;
}
