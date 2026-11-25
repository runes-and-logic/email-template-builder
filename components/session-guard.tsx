"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cloudMode } from "@/lib/config";
import { SkHeading, SkLabel, SkTable } from "./skeleton";

// Pages with their own session handling (editor, Brand Kit, dashboard, account) are not listed here.
const protectedPaths = ["/platform"];
export function SessionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const required = cloudMode && protectedPaths.some(path => pathname === path || pathname.startsWith(path + "/"));
  const [verifiedPath, setVerifiedPath] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!required) return;
    const controller = new AbortController();
    setError("");
    fetch("/api/session", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (response.status === 401) { router.replace("/login"); return; }
      if (!response.ok) throw new Error("Your workspace service is unavailable. Please retry.");
      const session = await response.json();
      if (session.authenticated !== true) throw new Error("Unable to verify your session.");
      setVerifiedPath(pathname);
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to verify your session."); });
    return () => controller.abort();
  }, [required, pathname, router, retry]);
  if (!required || verifiedPath === pathname) return children;
  if (!error) return <main id="main-content" className="container sk-page" aria-busy="true"><SkLabel>Opening your workspace…</SkLabel><SkHeading /><SkTable /></main>;
  return <main id="main-content" className="container prose-page"><p role="alert">{error}</p>{error && <button className="button" onClick={() => setRetry(value => value + 1)}>Retry</button>}</main>;
}
