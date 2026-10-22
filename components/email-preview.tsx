import {
  ArrowUpRight,
  Leaf,
  Sparkles,
  Package,
  ArrowRight,
} from "lucide-react";
import type { Template } from "@/lib/data";
export function EmailPreview({
  template,
  mini = false,
}: {
  template: Template;
  mini?: boolean;
}) {
  return (
    <div
      className={`email-preview theme-${template.theme} ${mini ? "email-mini" : ""}`}
      style={{ "--email-accent": template.color } as React.CSSProperties}
    >
      <div className="email-brand">
        {template.theme === "nature" && <Leaf size={20} />} {template.brand}
        <span>®</span>
      </div>
      <div className="email-intro">
        <div className="email-kicker">
          {template.theme === "nature"
            ? "A WORLD OF WONDER AWAITS"
            : template.theme === "editorial"
              ? "NOTES FOR A MORE MINDFUL LIFE"
              : "SOMETHING GOOD, JUST FOR YOU"}
        </div>
        <h3>{template.title}</h3>
        <p>{template.subtitle}</p>
        <span className="email-cta">
          {template.cta} <ArrowUpRight size={12} />
        </span>
      </div>
      {template.image ? (
        <div
          className="email-photo"
          style={{
            backgroundImage: `url(https://images.unsplash.com/${template.image}?auto=format&fit=crop&w=900&q=80)`,
          }}
          role="img"
          aria-label={
            template.theme === "nature"
              ? "A sunlit mountain above a green forest"
              : "A warm, inviting coffee shop"
          }
        >
          <span>
            {template.theme === "nature"
              ? "Find your own kind of wild."
              : "Savor the little things."}
          </span>
        </div>
      ) : (
        <div className={`email-art art-${template.theme}`} aria-hidden="true">
          {template.theme === "product" ? (
            <>
              <div className="product-box">
                <span>Layers</span>
                <Sparkles size={44} />
                <small>LESS, BUT BETTER.</small>
              </div>
              <div className="product-circle" />
            </>
          ) : template.theme === "sale" ? (
            <>
              <span className="sale-type">
                GOOD
                <br />
                FINDS.
              </span>
              <div className="sale-sticker">
                THE
                <br />
                SEASONAL
                <br />
                EDIT <ArrowUpRight size={22} />
              </div>
            </>
          ) : template.theme === "order" ? (
            <Package size={92} strokeWidth={1} />
          ) : (
            <>
              <div className="event-orb" />
              <span>
                Ideas come
                <br />
                together.
              </span>
            </>
          )}
        </div>
      )}
      <div className="email-bottom">
        <div>
          <strong>
            {template.theme === "nature"
              ? "A little inspiration for your next escape."
              : "A little inspiration, delivered."}
          </strong>
          <p>Thoughtfully chosen. Made for you.</p>
        </div>
        <ArrowRight size={16} />
      </div>
      <div className="email-fine">
        {template.brand} · A thoughtful note, just for you.
      </div>
    </div>
  );
}
