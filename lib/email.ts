export * from "@postly/email-core/email";
import { documentHtml } from "@postly/email-core/email";
import type { Document } from "@postly/email-core/workspace";

/**
 * Email HTML for on-screen previews: identical rendering, but links can't be followed,
 * so clicking a button doesn't load another site inside the preview. Exports keep working links.
 */
export function previewHtml(doc: Document) {
  return documentHtml(doc).replace("</head>", "<style>a{pointer-events:none!important;cursor:default!important}</style></head>");
}
