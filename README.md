# Postly — Email Template Builder

A responsive Next.js App Router + React + TypeScript demo for creating email templates. The repository initially contained only a README; there were no application routes or integrations to migrate.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production preview, run `npm run build` then `npm start`.

## Included

- Premium landing page, responsive navigation, product showcase, FAQ, and footer
- Eight fictional email templates with category filters, search, sorting, and accessible modal previews
- Editor with editable brand name, headline, message, CTA text/link, and accent color
- Desktop/mobile previews, undo/redo, local draft saves, and responsive HTML downloads
- Configurable sample pricing with monthly/annual switching and a 20% annual discount
- Demo onboarding, documentation, and clear privacy/terms notices

## Demo boundaries

Template content and subscription plans are sample data, centralized in `lib/data.ts`. No backend, account authentication, payments, email delivery, or campaign management is connected. Plan limits are illustrative, not enforced entitlements. The homepage block palette is a visual concept, not a drag-and-drop implementation. The actual editor supports content and color customization.

Drafts and the demo name use browser local storage. The saved CTA URL is restored along with content. HTML export uses a simple responsive, table-based layout with escaped text and validated links/colors. Decorative artwork in the gallery/editor preview is not included in the current export. The editor's code view displays the exact export.

Photography loads from Unsplash; fonts load from Google Fonts with system fallbacks. There are no configured social links or support inboxes, and no invented customer testimonials or metrics. Provider names describe potential HTML destinations, not live integrations.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Export tests cover HTML escaping, unsafe URL/color rejection, and responsive output. Design tokens are in `app/globals.css`; shared components are in `components/`.

### Browser checks

With the production server running on port 3100:

```sh
npx playwright install chromium
npm run test:e2e
```

Set `BASE_URL` for another port. If Chrome is already installed, `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` uses it instead. The browser check covers filters, preview dialogs, draft persistence, exports, pricing, onboarding, navigation, and overflow at 390px, 768px, and 1440px. Screenshots are written to `/tmp/postly-*.png`.

PostCSS is overridden to a patched release. npm still reports five transitive development-tool advisories through the Next ESLint plugin's glob/braces dependencies; the available audit recommendation is a breaking downgrade, which has not been applied.
