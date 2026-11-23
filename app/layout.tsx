import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import { SessionGuard } from "@/components/session-guard";
import "./globals.css";
import "./refinements.css";
import "./workspace.css";
import "./saas.css";
import "./cloud-states.css";
// Self-hosted and preloaded, with a metric-matched fallback, so text does not reflow when the font arrives.
const epilogue = Epilogue({ subsets: ["latin"], display: "swap", variable: "--font-epilogue" });
export const metadata: Metadata = {
  title: "Postly — Beautiful emails. Built in minutes.",
  description:
    "A thoughtful workspace for beautiful emails. Customize responsive templates and export your HTML with Postly.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={epilogue.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SessionGuard>{children}</SessionGuard>
      </body>
    </html>
  );
}
