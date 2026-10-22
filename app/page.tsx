import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Layers,
  MousePointer2,
  Palette,
  Smartphone,
  Sparkles,
  Eye,
  Minus,
  Plus,
} from "lucide-react";
import { Nav, Footer, FinalCTA, Pricing } from "@/components/site";
import { Editor } from "@/components/editor";
import { Gallery } from "@/components/gallery";
const faqs = [
  [
    "Is Postly free to use?",
    "Yes. This demo lets you customize templates, save drafts in your browser, and export HTML for free. Sample subscription plans show our proposed pricing; no payment is required.",
  ],
  [
    "Can I export my templates as HTML?",
    "Yes. Export a clean, responsive HTML email with your edited text, brand color, and button link. The current export uses a simple table-based layout; decorative preview artwork is not included.",
  ],
  [
    "Will my emails look good on mobile?",
    "Templates use a flexible layout, and the editor has desktop and mobile previews. Email clients render HTML differently, so test your exported email in your delivery provider before sending.",
  ],
  [
    "Can I make a template match my brand?",
    "Absolutely. Change the brand name, headline, message, button text, and accent color in the editor, then save your draft locally or export it.",
  ],
  [
    "Can I send emails directly from Postly?",
    "Email sending and campaign management are not connected in this demo. Export your HTML and import it into your own email service provider to send.",
  ],
  [
    "Can I cancel my subscription?",
    "There are no active subscriptions or charges in this demo. The pricing shown is sample configuration, and paid account management is not available yet.",
  ],
];
export default function Home() {
  return (
    <>
      <Nav />
      <main id="main-content">
        <section className="hero">
          <div className="hero-glow" />
          <div className="container hero-content">
            <Link href="/templates" className="announcement">
              <span>
                <Sparkles size={12} /> A little less effort. A lot more
                beautiful.
              </span>
              <ArrowRight size={13} />
            </Link>
            <h1>
              Beautiful emails.
              <br />
              Built in{" "}
              <span className="hero-emphasis">
                minutes.
                <svg viewBox="0 0 290 16" aria-hidden="true">
                  <path d="M4 11C68 0 181 0 285 7M39 15C112 7 213 7 266 11" />
                </svg>
              </span>
            </h1>
            <p className="hero-description">
              From your first hello to your next big launch. Create beautiful,
              <br className="desktop-break" /> responsive emails—without
              wrestling with HTML.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/editor">
                Start building for free <ArrowUpRight size={17} />
              </Link>
              <Link className="button secondary" href="/templates">
                <LayoutIcon /> Explore templates
              </Link>
            </div>
            <div className="hero-notes">
              <span>
                <Check size={13} /> No credit card required
              </span>
              <span>
                <Check size={13} /> Free HTML export
              </span>
              <span>
                <Check size={13} /> Make it your own
              </span>
            </div>
            <div className="hero-product">
              <div className="product-floating-label">
                <span className="scribble-arrow">↘</span> Your ideas,
                beautifully delivered
              </div>
              <Editor showcase />
              <div className="floating-cursor">
                <MousePointer2 size={21} fill="#8261cf" />
                <span>You, in your creative flow</span>
              </div>
            </div>
          </div>
        </section>
        <section className="compatibility container">
          <p>YOUR EMAILS. RIGHT AT HOME IN YOUR FAVORITE TOOLS.</p>
          <div className="compatibility-list">
            <span>
              <span className="provider-icon mailchimp">◉</span>mailchimp
            </span>
            <span className="provider-brevo">brevo</span>
            <span className="provider-hubspot">
              HubSp<span className="hubspot-o">o</span>t
            </span>
            <span className="provider-sendgrid">
              <span className="gridmark">▦</span>
              <small>
                twilio
                <br />
                <b>SendGrid</b>
              </small>
            </span>
            <span className="provider-resend">Resend</span>
            <span className="provider-html">
              <Code2 size={25} />
              HTML
            </span>
          </div>
          <small>
            Export HTML for your own email provider. Compatibility depends on
            its import support.
          </small>
        </section>
        <section id="features" className="features-section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                THOUGHTFULLY SIMPLE. POWERFULLY YOURS.
              </span>
              <h2>
                All the tools.
                <br />
                None of the complexity.
              </h2>
            </div>
            <p>
              Spend less time fighting with code.
              <br />
              More time creating emails people love to open.
            </p>
          </div>
          <div className="feature-bento">
            <article className="feature-large">
              <div className="feature-copy">
                <span className="feature-icon">
                  <MousePointer2 size={21} />
                </span>
                <h3>Your vision. A few clicks away.</h3>
                <p>
                  A visual workspace that makes it easy to bring your ideas to
                  life.
                  <br />
                  Edit your content, choose your colors, and watch it come
                  together.
                </p>
                <Link className="text-link" href="/editor">
                  Meet your new workspace <ArrowUpRight size={15} />
                </Link>
              </div>
              <div className="mini-builder">
                <div className="mini-blocks">
                  <span>
                    <TypeIcon />
                    Text
                  </span>
                  <span>
                    <span>▧</span>Image
                  </span>
                  <span className="active">
                    <MousePointer2 size={18} />
                    Button
                  </span>
                  <span>
                    <Minus size={18} />
                    Divider
                  </span>
                </div>
                <div className="mini-canvas">
                  <span className="mini-brand">made for you.</span>
                  <h4>
                    A little note.
                    <br />A big impression.
                  </h4>
                  <div className="mini-text-line" />
                  <div className="mini-text-line short" />
                  <Link href="/editor" className="mini-cta">
                    Make something great <ArrowRight size={13} />
                  </Link>
                  <span className="mini-cursor">
                    <MousePointer2 size={22} fill="#8261cf" />
                  </span>
                </div>
              </div>
            </article>
            <article className="feature-responsive">
              <span className="feature-icon">
                <Smartphone size={21} />
              </span>
              <h3>Every screen. Every time.</h3>
              <p>
                Beautiful on a big screen. Just as good on a small one.
                <br />
                Switch between desktop and mobile as you build.
              </p>
              <div className="responsive-illustration">
                <div className="desktop-email">
                  <div className="browser-dots">● ● ●</div>
                  <div className="illustration-content">
                    <span>wildwonder</span>
                    <h4>
                      Good things
                      <br />
                      are growing.
                    </h4>
                    <div className="illustration-landscape" />
                    <span className="illustration-button">Explore more</span>
                  </div>
                </div>
                <div className="phone-email">
                  <div className="phone-notch" />
                  <div className="illustration-content">
                    <span>wildwonder</span>
                    <h4>
                      Good things
                      <br />
                      are growing.
                    </h4>
                    <div className="illustration-landscape" />
                    <span className="illustration-button">Explore more</span>
                  </div>
                </div>
                <div className="responsive-badge">
                  <Check size={13} /> Looks good everywhere
                </div>
              </div>
            </article>
          </div>
          <div className="feature-strip">
            {[
              {
                icon: Palette,
                title: "Unmistakably you.",
                text: "Your colors. Your voice. Your brand, down to the last detail.",
              },
              {
                icon: Layers,
                title: "A head start, built in.",
                text: "Thoughtfully designed templates. Ready for your next big idea.",
              },
              {
                icon: Eye,
                title: "See it before you send it.",
                text: "Preview your design on desktop and mobile, right in the editor.",
              },
              {
                icon: Code2,
                title: "Your emails. Your code.",
                text: "Export responsive HTML and take it to your favorite email tool.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <Icon size={21} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="template-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A BLANK CANVAS IS OPTIONAL.</span>
                <h2>A great email starts here.</h2>
              </div>
              <p>
                From warm welcomes to big announcements.
                <br />
                Find your starting point. Make it your own.
              </p>
            </div>
            <Gallery preview />
            <div className="gallery-bottom">
              <span>
                <Check size={14} /> Thoughtfully designed{" "}
                <span className="dot-separator">·</span> Easy to customize{" "}
                <span className="dot-separator">·</span> Ready for any screen
              </span>
              <Link href="/templates" className="text-link">
                Find your inspiration <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
        <section className="how-it-works container">
          <div className="section-heading centered">
            <span className="eyebrow">LESS FRICTION. MORE CREATING.</span>
            <h2>From an idea to “it’s ready.”</h2>
            <p>Three simple steps. One very good email.</p>
          </div>
          <div className="steps-grid">
            {[
              {
                n: "01",
                title: "Find your starting point.",
                text: "Pick a template that speaks to you. A warm welcome, a product launch, a little of everything.",
                icon: Layers,
              },
              {
                n: "02",
                title: "Make it feel like you.",
                text: "Add your words. Find your colors. Turn a beautiful starting point into something unmistakably yours.",
                icon: Palette,
              },
              {
                n: "03",
                title: "Take it to the world.",
                text: "Preview every detail, export your HTML, and send it with your preferred email provider.",
                icon: SendIcon,
              },
            ].map(({ n, title, text, icon: Icon }) => (
              <article key={n}>
                <div className="step-top">
                  <span>{n}</span>
                  <Icon size={24} />
                  <div />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <Pricing compact />
        <section className="faq-section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">GOOD QUESTIONS. STRAIGHT ANSWERS.</span>
              <h2>A little more clarity.</h2>
              <p>Everything else you might be wondering.</p>
              <Link href="/docs" className="text-link">
                Visit the help center <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="faq-list">
              {faqs.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <Plus size={17} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
function LayoutIcon() {
  return <Layers size={16} />;
}
function TypeIcon() {
  return <span style={{ fontFamily: "serif", fontSize: 22 }}>T</span>;
}
function SendIcon({ size }: { size: number }) {
  return <ArrowUpRight size={size} />;
}
