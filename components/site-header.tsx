"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  CreditCard,
  Download,
  FolderOpen,
  LayoutTemplate,
  LifeBuoy,
  LogOut,
  Menu,
  Palette,
  PenLine,
  X,
  type LucideIcon,
} from "lucide-react";
import { cloudMode } from "@/lib/config";
import { api } from "@/lib/api";
import { Logo } from "./site";
import "./site-header.css";

type MenuItem = { href: string; label: string; text: string; icon: LucideIcon };
const productItems: MenuItem[] = [
  { href: "/editor", label: "Email editor", text: "Drag, drop and style blocks visually.", icon: PenLine },
  { href: "/templates", label: "Templates", text: "Responsive starting points for every moment.", icon: LayoutTemplate },
  { href: "/brand", label: "Brand Kit", text: "Your logo, colors and fonts in one place.", icon: Palette },
  { href: "/dashboard", label: "My Templates", text: "Find, rename and duplicate your drafts.", icon: FolderOpen },
];
const resourceItems: MenuItem[] = [
  { href: "/docs", label: "Getting started", text: "Make your first email in minutes.", icon: BookOpen },
  { href: "/docs#export", label: "Export guide", text: "Take your HTML to any email provider.", icon: Download },
  { href: "/docs#support", label: "Help & support", text: "Answers to common questions.", icon: LifeBuoy },
];
const sectionLinks = [
  { href: "/#features", id: "features", label: "Features" },
  { href: "/#use-cases", id: "use-cases", label: "Use cases" },
];

type Session = { status: "guest" | "user"; email?: string };

/**
 * Signed-in state for the header only. Never redirects; protected pages are handled by SessionGuard.
 * Starts as "guest" so the server render and first paint match, with no placeholder that later resizes.
 */
function useSession(): Session {
  const [session, setSession] = useState<Session>({ status: "guest" });
  useEffect(() => {
    if (!cloudMode) return;
    const controller = new AbortController();
    fetch("/api/session", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = response.ok ? await response.json() : null;
        setSession(data?.authenticated ? { status: "user", email: data.user?.email } : { status: "guest" });
      })
      .catch(() => { if (!controller.signal.aborted) setSession({ status: "guest" }); });
    return () => controller.abort();
  }, []);
  return session;
}

/** Highlights Features / Use cases while those home sections are on screen. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState("");
  useEffect(() => {
    if (!enabled) { setActive(""); return; }
    const targets = sectionLinks.map(link => document.getElementById(link.id)).filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
        else setActive(current => (current === entry.target.id ? "" : current));
      }
    }, { rootMargin: "-45% 0px -45% 0px" });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [enabled]);
  return active;
}

function isActive(pathname: string, href: string) {
  const path = href.split("#")[0];
  return path !== "/" && (pathname === path || pathname.startsWith(path + "/"));
}

function Dropdown({ label, items, active, open, onToggle, onClose, footer }: {
  label: string; items: MenuItem[]; active: boolean; open: boolean;
  onToggle: () => void; onClose: () => void; footer?: ReactNode;
}) {
  const id = useId();
  return (
    <div className={`sh-dropdown ${open ? "is-open" : ""}`}>
      <button type="button" className={`sh-link ${active ? "is-active" : ""}`} aria-expanded={open} aria-controls={id} onClick={onToggle}>
        {label} <ChevronDown size={14} aria-hidden="true" />
      </button>
      <div className="sh-panel" id={id} hidden={!open}>
        <ul>
          {items.map(({ href, label, text, icon: Icon }) => (
            <li key={href}>
              <Link href={href} onClick={onClose}>
                <span className="sh-panel-icon"><Icon size={18} /></span>
                <span><strong>{label}</strong><small>{text}</small></span>
              </Link>
            </li>
          ))}
        </ul>
        {footer}
      </div>
    </div>
  );
}

async function signOut() {
  try { await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "signout" }) }); }
  finally { location.assign("/login"); }
}

export function SiteHeader() {
  const pathname = usePathname();
  const session = useSession();
  const activeSection = useActiveSection(pathname === "/");
  const [menu, setMenu] = useState<"" | "product" | "resources" | "account">("");
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const close = useCallback(() => { setMenu(""); setDrawer(false); }, []);

  // Close everything when the route changes.
  useEffect(() => { close(); }, [pathname, close]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const onPointer = (event: PointerEvent) => {
      if (header.current && !header.current.contains(event.target as Node)) setMenu("");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [close]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  const toggle = (name: typeof menu) => setMenu(current => (current === name ? "" : name));
  const initial = (session.email || "?").charAt(0).toUpperCase();
  const signedIn = session.status === "user";

  return (
    <header ref={header} className={`sh ${scrolled ? "is-scrolled" : ""} ${drawer ? "drawer-open" : ""}`}>
      <div className="sh-inner container">
        <Logo />
        <nav className="sh-nav" aria-label="Main navigation">
          <Dropdown label="Product" items={productItems} open={menu === "product"} onToggle={() => toggle("product")} onClose={close}
            active={productItems.some(item => item.href !== "/templates" && isActive(pathname, item.href))}
            footer={<Link className="sh-panel-footer" href="/editor" onClick={close}>Start a new email <ArrowUpRight size={14} /></Link>} />
          {sectionLinks.map(link => (
            <Link key={link.id} href={link.href} className={`sh-link ${activeSection === link.id ? "is-active" : ""}`} onClick={close}>{link.label}</Link>
          ))}
          <Link href="/templates" className={`sh-link ${isActive(pathname, "/templates") ? "is-active" : ""}`} aria-current={pathname === "/templates" ? "page" : undefined}>Templates</Link>
          <Link href="/pricing" className={`sh-link ${isActive(pathname, "/pricing") ? "is-active" : ""}`} aria-current={pathname === "/pricing" ? "page" : undefined}>Pricing</Link>
          <Dropdown label="Resources" items={resourceItems} open={menu === "resources"} onToggle={() => toggle("resources")} onClose={close}
            active={isActive(pathname, "/docs")} />
        </nav>

        <div className="sh-actions">
          {session.status === "guest" && <>
            <Link className="sh-signin" href="/login">Sign in</Link>
            <Link className="button small sh-cta" href="/signup">Get started <ArrowUpRight size={15} /></Link>
          </>}
          {signedIn && <>
            <Link className="button small sh-cta" href="/editor">New email <PenLine size={14} /></Link>
            <div className={`sh-dropdown sh-account ${menu === "account" ? "is-open" : ""}`}>
              <button type="button" className="sh-avatar" aria-label="Account menu" aria-expanded={menu === "account"} aria-controls="sh-account-menu" onClick={() => toggle("account")}>{initial}</button>
              <div className="sh-panel sh-panel-right" id="sh-account-menu" hidden={menu !== "account"}>
                <p className="sh-account-email" title={session.email}>{session.email}</p>
                <ul>
                  <li><Link href="/dashboard" onClick={close}><span className="sh-panel-icon"><FolderOpen size={16} /></span><strong>My Templates</strong></Link></li>
                  <li><Link href="/brand" onClick={close}><span className="sh-panel-icon"><Palette size={16} /></span><strong>Brand Kit</strong></Link></li>
                  <li><Link href="/account" onClick={close}><span className="sh-panel-icon"><CreditCard size={16} /></span><strong>Account & billing</strong></Link></li>
                  <li><button type="button" onClick={() => void signOut()}><span className="sh-panel-icon"><LogOut size={16} /></span><strong>Sign out</strong></button></li>
                </ul>
              </div>
            </div>
          </>}
          <button type="button" className="sh-burger" aria-label={drawer ? "Close menu" : "Open menu"} aria-expanded={drawer} aria-controls="sh-drawer" onClick={() => { setMenu(""); setDrawer(open => !open); }}>
            {drawer ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className="sh-drawer" id="sh-drawer" hidden={!drawer}>
        <div className="sh-drawer-body container">
          <p className="sh-drawer-heading">Product</p>
          {productItems.map(({ href, label, text, icon: Icon }) => (
            <Link key={href} href={href} onClick={close} className={isActive(pathname, href) ? "is-active" : ""}>
              <span className="sh-panel-icon"><Icon size={18} /></span><span><strong>{label}</strong><small>{text}</small></span>
            </Link>
          ))}
          <p className="sh-drawer-heading">Explore</p>
          <div className="sh-drawer-grid">
            {sectionLinks.map(link => <Link key={link.id} href={link.href} onClick={close}>{link.label}</Link>)}
            <Link href="/pricing" onClick={close}>Pricing</Link>
            {resourceItems.map(item => <Link key={item.href} href={item.href} onClick={close}>{item.label}</Link>)}
          </div>
          <div className="sh-drawer-actions">
            {signedIn ? <>
              <p className="sh-account-email">{session.email}</p>
              <Link className="button" href="/editor" onClick={close}>New email <PenLine size={15} /></Link>
              <Link className="button secondary" href="/account" onClick={close}>Account & billing</Link>
              <button type="button" className="button secondary" onClick={() => void signOut()}>Sign out</button>
            </> : <>
              <Link className="button" href="/signup" onClick={close}>Get started <ArrowUpRight size={15} /></Link>
              <Link className="button secondary" href="/login" onClick={close}>Sign in</Link>
            </>}
          </div>
        </div>
      </div>
    </header>
  );
}
