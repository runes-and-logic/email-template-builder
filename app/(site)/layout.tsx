import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/site";

/** Shared chrome for marketing and account pages. The editor, auth and platform screens use their own layouts. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      {children}
      <Footer />
    </>
  );
}
