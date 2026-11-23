"use client";
/* eslint-disable @next/next/no-img-element -- Brand logos support user-uploaded data URLs and arbitrary public image hosts. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Palette, Save } from "lucide-react";
import { cloudMode } from "@/lib/config";
import { api } from "@/lib/api";
import { uploadImage } from "@/lib/uploads";
import { safeUrl } from "@/lib/email";
import { defaultBrand, fonts, readBrand, type BrandKit } from "@/lib/workspace";
export function BrandKitEditor() {
  const [brand, setBrand] = useState<BrandKit>(defaultBrand);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const revision = useRef(0);
  useEffect(() => {
    if (cloudMode) {
      api<{ content: BrandKit | null; revision: number }>("/api/resources/brand").then(result => { if (result.content) setBrand(result.content); revision.current = result.revision; setReady(true); }).catch(error => setNotice(error.message));
      return;
    }
    try {
      setBrand(readBrand());
    } catch {
      setNotice(
        "Saved branding could not be loaded. You can create a new kit.",
      );
    }
    setReady(true);
  }, []);
  function update(key: keyof BrandKit, value: string) {
    setBrand((b) => ({ ...b, [key]: value }));
    setNotice("");
  }
  const field = (label: string, key: keyof BrandKit, type = "text") => (
    <label>
      {label}
      <input
        type={type}
        value={brand[key]}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );
  return (
    <>
      <section className="workspace-heading container">
        <div>
          <span className="eyebrow">MAKE EVERY EMAIL FEEL LIKE YOU</span>
          <h1>Brand Kit</h1>
          <p>Your business identity, ready to use in every template.</p>
        </div>
        <Link className="button secondary" href="/dashboard">
          My Templates
        </Link>
      </section>
      <div className="container brand-layout">
        <form
          className="brand-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (cloudMode) {
                const result = await api<{ revision: number }>("/api/resources/brand", { method: "PUT", body: JSON.stringify({ content: brand, revision: revision.current }) });
                revision.current = result.revision;
              } else localStorage.setItem("postly-brand", JSON.stringify(brand));
              setNotice("Brand Kit saved. Apply it from the email editor.");
            } catch (error) {
              setNotice(error instanceof Error ? error.message : "Unable to save branding.");
            }
          }}
        >
          <div className="studio-panel-title">
            <Palette size={18} />
            Business identity
          </div>
          <div className="brand-fields edit-fields">
            {field("Business name", "name")}
            {field("Logo URL", "logo")}
            <label>
              Upload logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    file.size > 1500000 ||
                    !/^image\/(png|jpeg|webp|gif)$/.test(file.type)
                  ) {
                    setNotice(
                      "Use a PNG, JPEG, WebP or GIF smaller than 1.5 MB.",
                    );
                    return;
                  }
                  uploadImage(file).then(src => update("logo", src)).catch(error => setNotice(error.message));
                }}
              />
            </label>
            {field("Website URL", "website", "url")}
            <div className="field-pair">
              {field("Primary color", "primary", "color")}
              {field("Secondary color", "secondary", "color")}
            </div>
            <div className="field-pair">
              {(["heading", "body"] as const).map((key) => (
                <label key={key}>
                  {key === "heading" ? "Heading font" : "Body font"}
                  <select
                    value={brand[key]}
                    onChange={(e) => update(key, e.target.value)}
                  >
                    {fonts.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <label>
              Social profile URLs (one per line)
              <textarea
                aria-label="Social profile URLs (one per line)"
                value={brand.socials}
                onChange={(e) => update("socials", e.target.value)}
                placeholder="https://instagram.com/yourbusiness"
              />
            </label>
            <p className="field-help">
              Use public HTTPS image URLs for email compatibility. Branding is applied when you choose Apply Brand Kit in the editor.
            </p>
            <button className="button" disabled={!ready}>
              <Save size={16} />
              Save Brand Kit
            </button>
            {notice && (
              <p className="inline-notice" role="status">
                <Check size={15} />
                {notice}
              </p>
            )}
          </div>
        </form>
        <aside className="brand-preview-wrap">
          <span className="eyebrow">LIVE BRAND PREVIEW</span>
          <div
            className="brand-email"
            style={{ background: brand.secondary, fontFamily: brand.body }}
          >
            <div className="brand-email-inner">
              {safeUrl(brand.logo, true) ? (
                <img
                  src={safeUrl(brand.logo, true)}
                  alt={brand.name}
                  className="brand-preview-logo"
                />
              ) : (
                <strong style={{ color: brand.primary }}>{brand.name}</strong>
              )}
              <h2 style={{ fontFamily: brand.heading }}>
                A little note.
                <br />A lasting impression.
              </h2>
              <p>
                Thoughtfully crafted emails, with your business at the heart of
                every detail.
              </p>
              <a
                className="button"
                href={safeUrl(brand.website) || "#"}
                target="_blank"
                rel="noreferrer"
                style={{ background: brand.primary }}
              >
                Visit our website ↗
              </a>
              <hr />
              <small>Sent with care by {brand.name}.</small>
            </div>
          </div>
          <p className="workspace-storage-note">
            Preview updates as you edit. Save your kit to reuse it across templates.
          </p>
        </aside>
      </div>
    </>
  );
}
