"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronRight, CreditCard, FolderOpen, LayoutTemplate, LogOut, Palette } from "lucide-react";
import { cloudMode } from "@/lib/config";
import { Logo } from "./site";
import { signOut, useSession } from "./site-header";
import "./editor-topbar.css";

const links = [
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/brand", label: "Brand Kit", icon: Palette },
  { href: "/docs#export", label: "Export guide", icon: BookOpen },
];

function AccountMenu({ email }: { email?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);
  return (
    <div className="et-account" ref={root}>
      <button type="button" className="et-avatar" aria-label="Account menu" aria-expanded={open} aria-controls="et-account-menu" onClick={() => setOpen(value => !value)}>
        {(email || "?").charAt(0).toUpperCase()}
      </button>
      <div className="et-menu" id="et-account-menu" hidden={!open}>
        <p title={email}>{email}</p>
        <Link href="/dashboard" onClick={() => setOpen(false)}><FolderOpen size={16} /> My Templates</Link>
        <Link href="/brand" onClick={() => setOpen(false)}><Palette size={16} /> Brand Kit</Link>
        <Link href="/account" onClick={() => setOpen(false)}><CreditCard size={16} /> Account &amp; billing</Link>
        <button type="button" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
      </div>
    </div>
  );
}

/** Compact app bar for the editor: brand, breadcrumb back to My Templates, shortcuts and the account menu. */
export function EditorTopBar() {
  const session = useSession();
  return (
    <header className="et">
      <div className="et-left">
        <Logo />
        <nav className="et-crumbs" aria-label="Breadcrumb">
          <Link href="/dashboard">My Templates</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page">Editor</span>
        </nav>
      </div>
      <div className="et-right">
        <nav className="et-links" aria-label="Editor shortcuts">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}><Icon size={15} /><span>{label}</span></Link>
          ))}
        </nav>
        {cloudMode && session.status === "user" && <AccountMenu email={session.email} />}
      </div>
    </header>
  );
}
