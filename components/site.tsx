"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Send,
  Check,
  Minus,
} from "lucide-react";
import { CloudPricing } from "./cloud-pricing";
import { cloudMode } from "@/lib/config";
import { plans, annualDiscount } from "@/lib/data";
export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="Postly home">
      <span className="logo-icon">
        <Send size={19} strokeWidth={2.4} />
      </span>
      postly<span className="logo-dot">.</span>
    </Link>
  );
}
export function Footer() {
  return (
    <footer className="container footer">
      <div className="footer-main">
        <div>
          <Logo />
          <p>
            Good emails start with a little inspiration.
            <br />
            And the right tools.
          </p>
          <span className="footer-note">
            <span className="status-dot" /> Made for thoughtful communication.
          </span>
        </div>
        <div>
          <h4>Product</h4>
          <Link href="/#features">Features</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/editor">Email editor</Link>
          <Link href="/dashboard">My Templates</Link>
          <Link href="/brand">Brand Kit</Link>
        </div>
        <div>
          <h4>Templates</h4>
          <Link href="/templates?category=Welcome">Welcome emails</Link>
          <Link href="/templates?category=Newsletters">Newsletters</Link>
          <Link href="/templates?category=Promotions">Promotions</Link>
          <Link href="/templates?category=Product%20updates">
            Product updates
          </Link>
        </div>
        <div>
          <h4>Resources</h4>
          <Link href="/docs">Getting started</Link>
          <Link href="/docs#export">Export guide</Link>
          <Link href="/docs#support">Help & support</Link>
          <Link href="/privacy">Privacy policy</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Postly. Crafted with care.</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>
            English <span aria-hidden>⌄</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
export function FinalCTA() {
  return (
    <section className="final-cta container">
      <div className="cta-orbit" aria-hidden="true">
        <Send size={30} />
      </div>
      <span className="eyebrow">FROM IDEA TO INBOX</span>
      <h2>Your next great email starts here.</h2>
      <p>Less time building. More time connecting.</p>
      <Link className="button" href="/editor">
        Create your first email <ArrowRight size={16} />
      </Link>
      <small>Free to get started. No credit card required.</small>
    </section>
  );
}
export function Pricing(props: { compact?: boolean }) {
  return cloudMode ? <CloudPricing /> : <LocalPricing {...props} />;
}
function LocalPricing({ compact = false }: { compact?: boolean }) {
  const [annual, setAnnual] = useState(false);
  return (
    <section
      id="pricing"
      className={`pricing-section container ${compact ? "compact" : ""}`}
    >
      <div className="section-heading centered">
        <span className="eyebrow">ROOM TO GROW</span>
        <h2>Small beginnings. Big possibilities.</h2>
        <p>A plan for every stage of your email journey.</p>
      </div>
      <div className="billing-toggle">
        <button
          className={!annual ? "selected" : ""}
          onClick={() => setAnnual(false)}
        >
          Monthly
        </button>
        <button
          className={annual ? "selected" : ""}
          onClick={() => setAnnual(true)}
        >
          Yearly <span>Save 20%</span>
        </button>
      </div>
      <p className="demo-note">
        Sample plans for this demo. No payments or subscriptions are collected.
      </p>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <article
            className={`price-card ${plan.name === "Pro" ? "featured" : ""}`}
            key={plan.name}
          >
            {plan.name === "Pro" && (
              <span className="popular">Proposed Pro plan</span>
            )}
            <h3>{plan.name}</h3>
            <p className="plan-description">
              {
                {
                  Free: "For your first great email.",
                  Starter: "For finding your rhythm.",
                  Pro: "For brands on the rise.",
                  Business: "For growing together.",
                }[plan.name]
              }
            </p>
            <div className="price">
              ₹
              {(annual
                ? plan.price * (1 - annualDiscount)
                : plan.price
              ).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              <span>/ month</span>
            </div>
            <small>
              {annual && plan.price
                ? `₹${(plan.price * 12 * (1 - annualDiscount)).toLocaleString("en-IN")} billed yearly`
                : "No annual commitment"}
            </small>
            <Link
              className={`button ${plan.name !== "Pro" ? "secondary" : ""}`}
              href={`/signup?plan=${plan.name.toLowerCase()}`}
            >
              {plan.price ? "Explore " + plan.name : "Start for free"}{" "}
              <ArrowUpRight size={15} />
            </Link>
            <div className="plan-features">
              {plan.features.map((f) => (
                <p key={f}>
                  <Check size={15} />
                  {f}
                </p>
              ))}
              <p className="muted">
                <Minus size={15} />
                Email delivery not included
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="pricing-footnote">
        All local features are currently free, with no enforced plan limits.
        Paid tiers, team workspaces, and support services are proposed features.
        Email delivery requires your own provider.
      </p>
    </section>
  );
}
