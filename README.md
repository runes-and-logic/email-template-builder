# Postly — Email Builder

This project remains the **Next.js customer frontend**. Backend routes, integrations, authorization, migrations, and database tests are owned by `email-template-builder-be`, a separate Node.js/TypeScript service. Configure `BACKEND_URL` using `.env.example`; Next.js forwards `/api/*` and `/auth/*` to that service. No provider credentials belong in this project.

The existing editor now supports an explicit browser demo and a Supabase-backed cloud mode. Cloud mode adds verified accounts, owner/editor/viewer workspaces, revision-checked autosave, recovery, history, Trash, a managed template catalog, asset uploads and quotas, role-scoped administration, Razorpay subscriptions, and optional self-addressed test emails.

See the backend repository’s [OPERATIONS.md](../email-template-builder-be/OPERATIONS.md) for environment variables, ordered database migrations, first-admin setup, billing/webhook configuration, verification, and known launch requirements. Existing browser data is preserved and imported only when requested. No services are provisioned or payments activated automatically.

```sh
npm ci
npm run dev
```

Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Browser checks use a server on port 3100: `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`.

The sections below describe the original browser demo, retained when cloud mode is disabled.


A responsive Next.js App Router + React + TypeScript demo for creating email templates. The existing application has been extended with a block workspace, local template dashboard, and reusable branding.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production preview, run `npm run build` then `npm start`.

## Included

- Premium landing page, responsive navigation, product showcase, FAQ, and footer
- Eleven fictional email templates across ten categories with category filters, search, sorting, and accessible modal previews
- Three-area block editor with contextual typography, image, button, section, and column settings
- Keyboard and drag reordering, duplication, removal, reusable saved blocks, and exact HTML previews
- My Templates dashboard with search, category/status filtering, rename, duplicate, delete, and legacy draft migration
- Local Brand Kit for business identity, logo uploads, colors, fonts, website, and social profiles
- Desktop/mobile previews, undo/redo, local draft saves, and responsive HTML downloads
- Configurable sample pricing with monthly/annual switching and a 20% annual discount
- Demo onboarding, documentation, and clear privacy/terms notices

## Demo boundaries

Template content and subscription plans are sample data, centralized in `lib/data.ts`. No backend, account authentication, payments, email delivery, or campaign management is connected. Plan limits are illustrative, not enforced entitlements. The homepage showcases the product; the full editor implements block creation and drag reordering, with accessible move controls.

Documents, reusable blocks, Brand Kit, and the demo name use browser local storage. Version 1 drafts are migrated without deleting the originals. Version 2 documents retain block structure, styling, image data, and URLs. HTML export uses responsive table-based layouts, escaped content, bounded style values, and validated URLs. Gallery artwork is inspiration; the editable canvas, HTML view, and sandboxed preview reflect the actual export. Uploaded raster images may be embedded; public HTTPS image URLs provide broader email client support.

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

## Shared editor code

The browser-safe email model, validation, templates, and renderer are distributed in `vendor/postly-email-core-1.0.0.tgz`. Their canonical source is `email-template-builder-be/packages/email-core/src/`. This local package lets the frontend install and build independently. Browser storage and upload UI clients remain here.

Cloud screens verify their session through `/api/session`; all actual authorization runs in the backend. The local demo remains available without a running backend. See the backend operations guide for the two-service setup and migration steps.
