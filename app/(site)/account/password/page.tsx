"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <main id="main-content" className="container prose-page"><h1>Change password</h1><form onSubmit={async event => {
    event.preventDefault(); setBusy(true);
    try { await api("/api/account/password", { method: "POST", body: JSON.stringify({ password }) }); location.assign("/login"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to change password."); }
    finally { setBusy(false); }
  }}><label>New password<input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} /></label><button className="button" disabled={busy}>Save password and sign out</button></form><p role="status">{message}</p></main>;
}
