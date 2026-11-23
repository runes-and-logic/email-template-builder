import { Nav, Footer } from "@/components/site";
import { Dashboard } from "@/components/dashboard";
export const metadata = { title: "My Templates — Postly" };
export default function DashboardPage() {
  return (
    <>
      <Nav />
      <main id="main-content">
        <Dashboard />
      </main>
      <Footer />
    </>
  );
}
