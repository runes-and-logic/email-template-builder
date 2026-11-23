export * from "@postly/email-core/workspace";
import { defaultBrand, validDocument, type Document, type BrandKit } from "@postly/email-core/workspace";

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
