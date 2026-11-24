"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Check, FileQuestion, Inbox, Loader2, RefreshCw, WifiOff } from "lucide-react";
import "./editor-loading.css";

export type LoadStage = "account" | "resources" | "document" | "template" | "signin";

const STEPS: { key: Exclude<LoadStage, "template" | "signin">; label: string }[] = [
  { key: "account", label: "Checking your account" },
  { key: "resources", label: "Loading your Brand Kit and saved blocks" },
  { key: "document", label: "Opening your email" },
];

/**
 * Full editor-shaped skeleton with a progress card. It mirrors the studio layout
 * (toolbar, metadata, library / canvas / inspector) so nothing jumps when the editor appears.
 */
export function EditorLoading({ stage, creating = false, blank = false }: { stage: LoadStage; creating?: boolean; blank?: boolean }) {
  const current = stage === "template" ? 2 : stage === "signin" ? 0 : STEPS.findIndex(step => step.key === stage);
  const title = stage === "signin" ? "Taking you to sign in…" : creating ? "Preparing your new email…" : "Opening your email…";
  return (
    <section className="es" aria-busy="true" aria-label="Loading the email editor">
      <div className="es-card" role="status" aria-live="polite">
        <span className="es-card-icon"><Loader2 size={20} className="es-spin" /></span>
        <div>
          <strong>{title}</strong>
          <ol>
            {STEPS.map((step, index) => {
              const label = index === 2 && creating ? (blank ? "Creating your new email" : "Creating your copy of the template") : step.label;
              const state = index < current ? "done" : index === current ? "active" : "todo";
              return (
                <li key={step.key} className={`is-${state}`} aria-current={state === "active" ? "step" : undefined}>
                  <span className="es-dot">{state === "done" ? <Check size={11} strokeWidth={3} /> : null}</span>
                  {label}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="es-frame" aria-hidden="true">
        <div className="es-top">
          <div className="es-stack"><i className="w-60 h-18" /><i className="pill" /></div>
          <div className="es-row"><i className="sq" /><i className="btn" /><i className="btn accent" /></div>
        </div>
        <div className="es-grid">
          <div className="es-library">
            <i className="tabs" />
            <div className="es-tiles">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
          </div>
          <div className="es-canvas">
            <div className="es-email">
              <i className="w-32 center" />
              <i className="w-70 h-28 center" />
              <i className="w-50 h-28 center" />
              <i className="w-90 center" />
              <i className="w-80 center" />
              <i className="es-button center" />
              <i className="es-image" />
            </div>
          </div>
          <div className="es-inspector">
            <i className="w-50 h-14" />
            <i className="w-90" /><i className="field" /><i className="w-40" /><i className="field" /><i className="w-40" /><i className="field" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Calm, centered state card for the editor (not found, plan limit reached, failed to load). */
export function EditorState({ kind, message, onRetry, plan, limit }: {
  kind: "missing" | "error" | "limit"; message?: string; onRetry?: () => void; plan?: string; limit?: number;
}) {
  const content: Record<typeof kind, { icon: typeof Inbox; tone: string; title: string; text: string; actions: ReactNode }> = {
    missing: {
      icon: FileQuestion,
      tone: "",
      title: "We couldn’t find this email",
      text: "It may have been moved to Trash, or the link belongs to another workspace. Your other emails are safe.",
      actions: <>
        <Link className="button" href="/dashboard">Back to My Templates</Link>
        <Link className="button secondary" href="/templates">Start from a template</Link>
      </>,
    },
    limit: {
      icon: Inbox,
      tone: "is-limit",
      title: "You’ve reached your email limit",
      text: `${limit ? `Your ${plan} plan includes ${limit} saved ${limit === 1 ? "email" : "emails"}` : "Your plan’s saved-email limit is reached"}, and each template you open becomes a new email. Move one you no longer need to Trash to make room — you can restore it later.`,
      actions: <>
        <Link className="button" href="/dashboard">Manage My Templates</Link>
        <Link className="button secondary" href="/pricing">See plans</Link>
      </>,
    },
    error: {
      icon: WifiOff,
      tone: "is-error",
      title: "Your email didn’t load",
      text: message || "Something went wrong while opening the editor. Your saved work is safe.",
      actions: <>
        {onRetry && <button type="button" className="button" onClick={onRetry}><RefreshCw size={16} /> Try again</button>}
        <Link className="button secondary" href="/dashboard">Back to My Templates</Link>
      </>,
    },
  };
  const { icon: Icon, tone, title, text, actions } = content[kind];
  return (
    <section className="es-state" role={kind === "error" ? "alert" : "status"}>
      <span className={`es-state-icon ${tone}`}><Icon size={26} /></span>
      <h1>{title}</h1>
      <p>{text}</p>
      <div className="es-state-actions">{actions}</div>
    </section>
  );
}
