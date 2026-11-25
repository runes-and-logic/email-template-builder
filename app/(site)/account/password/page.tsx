import type { Metadata } from "next";
import { PasswordForm } from "@/components/password-form";

// Private account page: keep it out of search results.
export const metadata: Metadata = { title: "Set a new password — Postly", robots: { index: false, follow: false } };

export default function PasswordPage() {
  return (
    <main id="main-content" className="container pw-page">
      <PasswordForm />
    </main>
  );
}
