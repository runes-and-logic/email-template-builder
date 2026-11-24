import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

// Private workspace page: keep it out of search results.
export const metadata: Metadata = { title: "My Templates — Postly", robots: { index: false, follow: false } };

export default function DashboardPage() {
  return (
    <main id="main-content">
      <Dashboard />
    </main>
  );
}
