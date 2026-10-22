import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
export const metadata: Metadata = {
  title: "Postly — Beautiful emails. Built in minutes.",
  description:
    "A thoughtful workspace for beautiful emails. Customize responsive templates and export your HTML with Postly.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
