import type { Metadata } from "next";
import { Account } from "@/components/account";

// Private account page: keep it out of search results.
export const metadata: Metadata = { title: "Account — Postly", robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <main id="main-content">
      <Account />
    </main>
  );
}
