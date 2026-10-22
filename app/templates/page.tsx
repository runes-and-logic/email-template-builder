import { Nav, Footer, FinalCTA } from "@/components/site";
import { Gallery } from "@/components/gallery";
export const metadata = {
  title: "Email templates — Postly",
  description:
    "Explore responsive welcome emails, newsletters, announcements, and more. Find your starting point and make it your own.",
};
export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return (
    <>
      <Nav />
      <main id="main-content" className="container library-page">
        <div className="page-header">
          <span className="eyebrow">YOUR NEXT GREAT EMAIL IS IN HERE.</span>
          <h1>
            A little inspiration.
            <br />A lot of possibility.
          </h1>
          <p>
            Thoughtfully designed templates for every kind of hello.
            <br />
            Pick your favorite. Make it yours.
          </p>
        </div>
        <Gallery initialCategory={category || "All templates"} />
      </main>
      <FinalCTA />
      <Footer />
    </>
  );
}
