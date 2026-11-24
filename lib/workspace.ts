export * from "@postly/email-core/workspace";
import { defaultBrand, makeBlock, validDocument, type Block, type BlockKind, type Document, type BrandKit } from "@postly/email-core/workspace";

export function readDocuments(): Document[] {
  const result: Document[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("postly-document-")) {
      try {
        const value = JSON.parse(localStorage.getItem(key) || "null");
        if (validDocument(value)) result.push(value);
      } catch {
        // One damaged record must not hide other saved templates.
      }
    }
  }
  return result.sort((a, b) => b.modified.localeCompare(a.modified));
}
export function storeDocument(doc: Document) {
  if (!validDocument(doc)) throw new Error("Invalid document. Check email name and content limits.");
  localStorage.setItem("postly-document-" + doc.id, JSON.stringify(doc));
}
export function readBrand(): BrandKit {
  const value = JSON.parse(localStorage.getItem("postly-brand") || "null");
  if (!value || typeof value !== "object") return defaultBrand;
  return Object.fromEntries(
    Object.entries(defaultBrand).map(([k, v]) => [
      k,
      typeof value[k] === "string" ? value[k] : v,
    ]),
  ) as BrandKit;
}

/** Logo images render at a percentage of the email width; 100% (the text-logo default) makes an image fill it. */
export const LOGO_IMAGE_WIDTH = 30;
function logoWidth(block: Block, src: string) {
  return src && block.width >= 100 ? LOGO_IMAGE_WIDTH : block.width;
}

/** A new block with brand defaults; logo images start at a logo-sized width instead of full width. */
export function newBlock(kind: BlockKind, brand: BrandKit = defaultBrand): Block {
  const block = makeBlock(kind, brand);
  return kind === "Logo" ? { ...block, width: logoWidth(block, block.src) } : block;
}

/**
 * How "Apply Brand Kit" changes a block. Shared by the editor and the Brand Kit preview,
 * so the preview shows exactly what applying the kit produces.
 */
export function applyBrandToBlock(block: Block, brand: BrandKit): Block {
  return {
    ...block,
    font: block.kind === "Heading" ? brand.heading : brand.body,
    ...(block.kind === "Button" ? { background: brand.primary, url: brand.website } : {}),
    ...(block.kind === "Logo" ? { text: brand.name, src: brand.logo, url: brand.website, width: logoWidth(block, brand.logo) } : {}),
    ...(block.kind === "Footer" ? { text: `Sent with care by ${brand.name}.`, background: brand.secondary } : {}),
    ...(block.kind === "Social links" ? { text: brand.socials } : {}),
  };
}

/** A small sample email built with the brand applied, for previews. */
export function brandSampleDocument(brand: BrandKit): Document {
  const kinds: BlockKind[] = ["Logo", "Heading", "Paragraph", "Button", ...(brand.socials.trim() ? ["Social links" as BlockKind] : []), "Footer"];
  const blocks = kinds.map((kind, index) => {
    const block = applyBrandToBlock({ ...newBlock(kind, brand), id: `brand-preview-${index}` }, brand);
    if (kind === "Heading") return { ...block, text: "A little note.\nA lasting impression." };
    if (kind === "Paragraph") return { ...block, text: "Thoughtfully crafted emails, with your business at the heart of every detail." };
    if (kind === "Button") return { ...block, text: "Visit our website" };
    return block;
  });
  return {
    version: 2,
    id: "brand-preview",
    source: "brand",
    name: `${brand.name} preview`,
    category: "Welcome",
    modified: new Date(0).toISOString(),
    status: "Draft",
    blocks,
    background: "#f3f1f5",
    width: 600,
  } as Document;
}
