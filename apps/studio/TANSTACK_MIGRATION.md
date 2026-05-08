# TanStack Start migration — route checklist

Temporary tracking doc. Delete once migration is done.

**Strategy — minimum-diff re-export**

The goal is to flip URL ownership to TanStack without rewriting page internals yet. For each page we pick one of two paths:

- **Path A — re-export from `pages/`** (default). The TanStack route imports the page's default export from `apps/studio/pages/...` and renders it inside a thin wrapper component used as the route's `component`. `getLayout` is dropped on the floor — the TanStack layout chain (pathless `_app.tsx` / `_auth.tsx` + sibling-file layouts) handles wrapping instead. The page's Next-specific imports keep working via the `compat/next/` shim. Because `NextPageWithLayout` declares `{ dehydratedState: any }` as required props, pass `dehydratedState={undefined}` in the wrapper.
- **Path B — direct component import**. When the `pages/...` file is essentially `export default SomeComponent` re-exporting a component from elsewhere (typical for thin page wrappers), skip the middle-man and import `SomeComponent` directly in the TanStack route.

We still need to land the shared layouts up-front:

- Pathless layout routes (`_app.tsx`, `_auth.tsx`) hold shared shells without contributing URL segments.
- Sibling-file layouts: `segment.tsx` next to a `segment/` directory provides the layout with `<Outlet/>` for children in that directory (e.g. `_app/account.tsx` wraps `_app/account/me.tsx`). No `route.tsx` files.
- Each product layout (DatabaseLayout, AuthLayout, SQLEditorLayout, …) becomes one sibling-file layout.

Once every page is represented in `routes/`, we do a second pass to properly move the page body into the route file and delete `pages/...`. Path-tracking (A vs B) below tells us which pages still have live Next files we need to eliminate.

Other rules:

- New code uses native TanStack APIs directly (no `next/router`, no `next/link`). The Next compat shim stays in place for pages we re-export.
- `withAuth()` HOC → TanStack `beforeLoad` on the containing route/layout. Apply this at shared-layout level where possible.
- Delete the Next page file only when we move the body fully (the Path A cleanup pass). During Path A, both files coexist.
- Not migrated via this list: `pages/api/**` (Next API routes — separate migration), `_app.tsx`, `_document.tsx`, `_error`, `pages/org/_/[[...routeSlug]].tsx`, `pages/project/_/[[...routeSlug]].tsx` (catch-alls — revisit at the end).

**Legend**

- `[ ]` not started
- `[~]` in progress
- `[x] A` done — re-exported from `pages/...` (Next file still exists, needs body-move later)
- `[x] A→done` done & body moved — Next file deleted
- `[x] B` done — direct component import, no Next file involved (or Next file already deletable)

---

## Shared layouts

These are the layout-only TanStack files. Most hold a single product layout component.

### App shell (pathless)

- [x] `routes/_app.tsx` — AppLayout + DefaultLayout (reads `defaultLayoutHeaderTitle`/`hideMobileMenu` from leaf `staticData`)
- [x] `routes/_app/account.tsx` — AccountLayout (reads `accountLayoutTitle` from leaf `staticData`)
- [x] `routes/_app/org.tsx` — OrganizationLayout (reads `orgLayoutTitle` from leaf `staticData`). **Delta vs plan:** placed at `_app/org.tsx` (wraps both `/org/` index and `/org/$slug/*`) instead of `_app/org/$slug.tsx`. PageLayout stays inline on `/org/$slug/index.tsx` since only that one route uses it.
- [ ] `routes/_app/new.tsx` — WizardLayout (+ DefaultLayout hideMobileMenu override)
- [ ] `routes/_app/integrations/vercel.tsx` — VercelIntegrationWindowLayout

### Project shell

- [x] `routes/project/$ref.tsx` — DefaultLayout only. **Delta vs plan:** ProjectLayoutWithAuth omitted from the shell because product layouts (DatabaseLayout, AuthLayout, StorageLayout, …) already render `withAuth(... ProjectLayout ...)` internally — adding it here would double-wrap. The home page (`/project/$ref/index.tsx`) wraps itself in `ProjectLayoutWithAuth` since it has no product layout.
- [x] `routes/project/$ref/database.tsx` — DatabaseLayout (reads `databaseLayoutTitle` from leaf `staticData`)
- [ ] `routes/project/$ref/auth.tsx` — AuthLayout
- [ ] `routes/project/$ref/auth/templates.tsx` — AuthEmailsLayout
- [ ] `routes/project/$ref/storage.tsx` — StorageLayout
- [ ] `routes/project/$ref/realtime.tsx` — RealtimeLayout
- [ ] `routes/project/$ref/functions.tsx` — EdgeFunctionsLayout
- [ ] `routes/project/$ref/branches.tsx` — BranchLayout + PageLayout
- [ ] `routes/project/$ref/logs.tsx` — LogsLayout
- [ ] `routes/project/$ref/observability.tsx` — ObservabilityLayout
- [ ] `routes/project/$ref/advisors.tsx` — AdvisorsLayout
- [ ] `routes/project/$ref/advisors/rules.tsx` — AdvisorRulesLayout (standalone, not nested under AdvisorsLayout)
- [ ] `routes/project/$ref/settings.tsx` — SettingsLayout
- [ ] `routes/project/$ref/integrations.tsx` — ProjectIntegrationsLayout
- [ ] `routes/project/$ref/sql.tsx` — EditorBaseLayout + SQLEditorLayout
- [ ] `routes/project/$ref/editor.tsx` — EditorBaseLayout + TableEditorLayout

### Auth shell (pathless)

- [x] `routes/_auth.tsx` — AuthenticationLayout

---

## Pages

### App shell — `/account/*`

- [x] A `routes/_app/account/me.tsx` ← `pages/account/me.tsx`
- [x] A `routes/_app/account/security.tsx` ← `pages/account/security.tsx`
- [x] A `routes/_app/account/audit.tsx` ← `pages/account/audit.tsx`
- [x] A `routes/_app/account/tokens/index.tsx` ← `pages/account/tokens.tsx`
- [x] A `routes/_app/account/tokens/scoped.tsx` ← `pages/account/tokens/scoped.tsx`

### App shell — `/org/$slug/*`

- [x] A `routes/_app/org/$slug/index.tsx` ← `pages/org/[slug]/index.tsx`
- [x] A `routes/_app/org/$slug/apps.tsx` ← `pages/org/[slug]/apps.tsx`
- [x] A `routes/_app/org/$slug/audit.tsx` ← `pages/org/[slug]/audit.tsx`
- [x] A `routes/_app/org/$slug/billing.tsx` ← `pages/org/[slug]/billing.tsx`
- [x] A `routes/_app/org/$slug/documents.tsx` ← `pages/org/[slug]/documents.tsx`
- [x] A `routes/_app/org/$slug/general.tsx` ← `pages/org/[slug]/general.tsx`
- [x] A `routes/_app/org/$slug/integrations.tsx` ← `pages/org/[slug]/integrations.tsx`
- [x] A `routes/_app/org/$slug/security.tsx` ← `pages/org/[slug]/security.tsx`
- [x] A `routes/_app/org/$slug/sso.tsx` ← `pages/org/[slug]/sso.tsx`
- [x] A `routes/_app/org/$slug/team.tsx` ← `pages/org/[slug]/team.tsx`
- [x] A `routes/_app/org/$slug/usage.tsx` ← `pages/org/[slug]/usage.tsx`
- [x] A `routes/_app/org/$slug/private-apps/index.tsx` ← `pages/org/[slug]/private-apps/index.tsx`
- [x] A `routes/_app/org/$slug/webhooks/index.tsx` ← `pages/org/[slug]/webhooks/index.tsx`
- [x] A `routes/_app/org/$slug/webhooks/$endpointId.tsx` ← `pages/org/[slug]/webhooks/[endpointId].tsx`
- [x] A `routes/_app/org/index.tsx` ← `pages/org/index.tsx` (redirect)

### App shell — top-level pages

- [x] A `routes/_app/organizations.tsx` ← `pages/organizations.tsx` (page default already withAuth-wrapped; PageLayout wraps body)
- [ ] `routes/_app/new/index.tsx` ← `pages/new/index.tsx`
- [ ] `routes/_app/new/$slug.tsx` ← `pages/new/[slug].tsx`
- [x] A `routes/aws-marketplace-onboarding.tsx` ← `pages/aws-marketplace-onboarding.tsx` **Delta vs plan:** placed at root rather than under `_app/` — page uses its own `LinkAwsMarketplaceLayout` and doesn't want `AppLayout` + `DefaultLayout` wrapping.
- [x] A `routes/claim-project.tsx` ← `pages/claim-project.tsx` **Delta vs plan:** placed at root rather than under `_app/` — page uses its own `<Head>` + `<main>` layout and doesn't want `AppLayout` + `DefaultLayout` wrapping.
- [x] A `routes/join.tsx` ← `pages/join.tsx` **Delta vs plan:** placed at root rather than under `_app/` — page uses a centered-div layout and doesn't want `AppLayout` + `DefaultLayout` wrapping.
- [ ] `routes/_app/support/new.tsx` ← `pages/support/new.tsx` (+ withAuth → beforeLoad)
- [ ] `routes/_app/support/link.tsx` ← `pages/support/link.tsx`

### App shell — integrations

- [ ] `routes/_app/integrations/vercel/install.tsx` ← `pages/integrations/vercel/install.tsx`
- [ ] `routes/_app/integrations/vercel/$slug/marketplace/choose-project.tsx` ← `pages/integrations/vercel/[slug]/marketplace/choose-project.tsx`
- [ ] `routes/_app/integrations/vercel/$slug/deploy-button/new-project.tsx` ← `pages/integrations/vercel/[slug]/deploy-button/new-project.tsx`
- [ ] `routes/_app/integrations/github/authorize.tsx` ← `pages/integrations/github/authorize.tsx`

### Project shell — home

- [x] A `routes/project/$ref/index.tsx` ← `pages/project/[ref]/index.tsx` (route wraps in `ProjectLayoutWithAuth` itself — see shell delta above)
- [ ] `routes/project/$ref/merge.tsx` ← `pages/project/[ref]/merge.tsx`

### Project shell — `/api/*`

- [ ] `routes/project/$ref/api/index.tsx` ← `pages/project/[ref]/api/index.tsx`

### Project shell — `/database/*`

- [x] A `routes/project/$ref/database/schemas.tsx` ← `pages/project/[ref]/database/schemas.tsx`
- [x] A `routes/project/$ref/database/extensions.tsx` ← `pages/project/[ref]/database/extensions.tsx`
- [x] A `routes/project/$ref/database/functions.tsx` ← `pages/project/[ref]/database/functions.tsx`
- [x] A `routes/project/$ref/database/indexes.tsx` ← `pages/project/[ref]/database/indexes.tsx`
- [x] A `routes/project/$ref/database/migrations.tsx` ← `pages/project/[ref]/database/migrations.tsx`
- [x] A `routes/project/$ref/database/roles.tsx` ← `pages/project/[ref]/database/roles.tsx`
- [x] A `routes/project/$ref/database/settings.tsx` ← `pages/project/[ref]/database/settings.tsx`
- [x] A `routes/project/$ref/database/types.tsx` ← `pages/project/[ref]/database/types.tsx`
- [x] A `routes/project/$ref/database/column-privileges.tsx` ← `pages/project/[ref]/database/column-privileges.tsx`
- [ ] `routes/project/$ref/database/tables/index.tsx` ← `pages/project/[ref]/database/tables/index.tsx`
- [ ] `routes/project/$ref/database/tables/$id.tsx` ← `pages/project/[ref]/database/tables/[id].tsx`
- [ ] `routes/project/$ref/database/publications/index.tsx` ← `pages/project/[ref]/database/publications/index.tsx`
- [ ] `routes/project/$ref/database/publications/$id.tsx` ← `pages/project/[ref]/database/publications/[id].tsx`
- [ ] `routes/project/$ref/database/replication/index.tsx` ← `pages/project/[ref]/database/replication/index.tsx`
- [ ] `routes/project/$ref/database/replication/$pipelineId.tsx` ← `pages/project/[ref]/database/replication/[pipelineId].tsx`
- [ ] `routes/project/$ref/database/replication/replica/$replicaId.tsx` ← `pages/project/[ref]/database/replication/replica/[replicaId].tsx`
- [ ] `routes/project/$ref/database/triggers/index.tsx` ← `pages/project/[ref]/database/triggers/index.tsx`
- [ ] `routes/project/$ref/database/triggers/data.tsx` ← `pages/project/[ref]/database/triggers/data.tsx`
- [ ] `routes/project/$ref/database/triggers/event.tsx` ← `pages/project/[ref]/database/triggers/event.tsx`
- [ ] `routes/project/$ref/database/backups/pitr.tsx` ← `pages/project/[ref]/database/backups/pitr.tsx`
- [ ] `routes/project/$ref/database/backups/restore-to-new-project.tsx` ← `pages/project/[ref]/database/backups/restore-to-new-project.tsx`
- [ ] `routes/project/$ref/database/backups/scheduled.tsx` ← `pages/project/[ref]/database/backups/scheduled.tsx`

### Project shell — `/auth/*`

- [ ] `routes/project/$ref/auth/overview.tsx` ← `pages/project/[ref]/auth/overview.tsx`
- [ ] `routes/project/$ref/auth/users.tsx` ← `pages/project/[ref]/auth/users.tsx`
- [ ] `routes/project/$ref/auth/policies.tsx` ← `pages/project/[ref]/auth/policies.tsx`
- [ ] `routes/project/$ref/auth/providers.tsx` ← `pages/project/[ref]/auth/providers.tsx`
- [ ] `routes/project/$ref/auth/mfa.tsx` ← `pages/project/[ref]/auth/mfa.tsx`
- [ ] `routes/project/$ref/auth/hooks.tsx` ← `pages/project/[ref]/auth/hooks.tsx`
- [ ] `routes/project/$ref/auth/smtp.tsx` ← `pages/project/[ref]/auth/smtp.tsx`
- [ ] `routes/project/$ref/auth/sessions.tsx` ← `pages/project/[ref]/auth/sessions.tsx`
- [ ] `routes/project/$ref/auth/passkeys.tsx` ← `pages/project/[ref]/auth/passkeys.tsx`
- [ ] `routes/project/$ref/auth/performance.tsx` ← `pages/project/[ref]/auth/performance.tsx`
- [ ] `routes/project/$ref/auth/protection.tsx` ← `pages/project/[ref]/auth/protection.tsx`
- [ ] `routes/project/$ref/auth/rate-limits.tsx` ← `pages/project/[ref]/auth/rate-limits.tsx`
- [ ] `routes/project/$ref/auth/third-party.tsx` ← `pages/project/[ref]/auth/third-party.tsx`
- [ ] `routes/project/$ref/auth/oauth-apps.tsx` ← `pages/project/[ref]/auth/oauth-apps.tsx`
- [ ] `routes/project/$ref/auth/oauth-server.tsx` ← `pages/project/[ref]/auth/oauth-server.tsx`
- [ ] `routes/project/$ref/auth/url-configuration.tsx` ← `pages/project/[ref]/auth/url-configuration.tsx`
- [ ] `routes/project/$ref/auth/audit-logs.tsx` ← `pages/project/[ref]/auth/audit-logs.tsx`
- [ ] `routes/project/$ref/auth/templates/index.tsx` ← `pages/project/[ref]/auth/templates/index.tsx`
- [ ] `routes/project/$ref/auth/templates/$templateId.tsx` ← `pages/project/[ref]/auth/templates/[templateId].tsx`

### Project shell — `/storage/*`

- [ ] `routes/project/$ref/storage/s3.tsx` ← `pages/project/[ref]/storage/s3.tsx`
- [ ] `routes/project/$ref/storage/files/index.tsx` ← `pages/project/[ref]/storage/files/index.tsx`
- [ ] `routes/project/$ref/storage/files/policies.tsx` ← `pages/project/[ref]/storage/files/policies.tsx`
- [ ] `routes/project/$ref/storage/files/settings.tsx` ← `pages/project/[ref]/storage/files/settings.tsx`
- [ ] `routes/project/$ref/storage/files/buckets/$bucketId.tsx` ← `pages/project/[ref]/storage/files/buckets/[bucketId].tsx`
- [ ] `routes/project/$ref/storage/analytics/index.tsx` ← `pages/project/[ref]/storage/analytics/index.tsx`
- [ ] `routes/project/$ref/storage/analytics/buckets/$bucketId.tsx` ← `pages/project/[ref]/storage/analytics/buckets/[bucketId].tsx`
- [ ] `routes/project/$ref/storage/vectors/index.tsx` ← `pages/project/[ref]/storage/vectors/index.tsx`
- [ ] `routes/project/$ref/storage/vectors/buckets/$bucketId.tsx` ← `pages/project/[ref]/storage/vectors/buckets/[bucketId].tsx`

### Project shell — `/realtime/*`

- [ ] `routes/project/$ref/realtime/inspector.tsx` ← `pages/project/[ref]/realtime/inspector.tsx`
- [ ] `routes/project/$ref/realtime/policies.tsx` ← `pages/project/[ref]/realtime/policies.tsx`
- [ ] `routes/project/$ref/realtime/settings.tsx` ← `pages/project/[ref]/realtime/settings.tsx`

### Project shell — `/functions/*`

- [ ] `routes/project/$ref/functions/index.tsx` ← `pages/project/[ref]/functions/index.tsx`
- [ ] `routes/project/$ref/functions/new.tsx` ← `pages/project/[ref]/functions/new.tsx`
- [ ] `routes/project/$ref/functions/secrets.tsx` ← `pages/project/[ref]/functions/secrets.tsx`
- [ ] `routes/project/$ref/functions/$functionSlug/index.tsx` ← `pages/project/[ref]/functions/[functionSlug]/index.tsx`
- [ ] `routes/project/$ref/functions/$functionSlug/code.tsx` ← `pages/project/[ref]/functions/[functionSlug]/code.tsx`
- [ ] `routes/project/$ref/functions/$functionSlug/details.tsx` ← `pages/project/[ref]/functions/[functionSlug]/details.tsx`
- [ ] `routes/project/$ref/functions/$functionSlug/invocations.tsx` ← `pages/project/[ref]/functions/[functionSlug]/invocations.tsx`
- [ ] `routes/project/$ref/functions/$functionSlug/logs.tsx` ← `pages/project/[ref]/functions/[functionSlug]/logs.tsx`

### Project shell — `/branches/*`

- [ ] `routes/project/$ref/branches/index.tsx` ← `pages/project/[ref]/branches/index.tsx`
- [ ] `routes/project/$ref/branches/merge-requests.tsx` ← `pages/project/[ref]/branches/merge-requests.tsx`

### Project shell — `/logs/*`

- [ ] `routes/project/$ref/logs/index.tsx` ← `pages/project/[ref]/logs/index.tsx`
- [ ] `routes/project/$ref/logs/auth-logs.tsx` ← `pages/project/[ref]/logs/auth-logs.tsx`
- [ ] `routes/project/$ref/logs/cron-logs.tsx` ← `pages/project/[ref]/logs/cron-logs.tsx`
- [ ] `routes/project/$ref/logs/dedicated-pooler-logs.tsx` ← `pages/project/[ref]/logs/dedicated-pooler-logs.tsx`
- [ ] `routes/project/$ref/logs/edge-functions-logs.tsx` ← `pages/project/[ref]/logs/edge-functions-logs.tsx`
- [ ] `routes/project/$ref/logs/edge-logs.tsx` ← `pages/project/[ref]/logs/edge-logs.tsx`
- [ ] `routes/project/$ref/logs/pg-upgrade-logs.tsx` ← `pages/project/[ref]/logs/pg-upgrade-logs.tsx`
- [ ] `routes/project/$ref/logs/pgcron-logs.tsx` ← `pages/project/[ref]/logs/pgcron-logs.tsx`
- [ ] `routes/project/$ref/logs/pooler-logs.tsx` ← `pages/project/[ref]/logs/pooler-logs.tsx`
- [ ] `routes/project/$ref/logs/postgres-logs.tsx` ← `pages/project/[ref]/logs/postgres-logs.tsx`
- [ ] `routes/project/$ref/logs/postgrest-logs.tsx` ← `pages/project/[ref]/logs/postgrest-logs.tsx`
- [ ] `routes/project/$ref/logs/realtime-logs.tsx` ← `pages/project/[ref]/logs/realtime-logs.tsx`
- [ ] `routes/project/$ref/logs/replication-logs.tsx` ← `pages/project/[ref]/logs/replication-logs.tsx`
- [ ] `routes/project/$ref/logs/storage-logs.tsx` ← `pages/project/[ref]/logs/storage-logs.tsx`
- [ ] `routes/project/$ref/logs/explorer/index.tsx` ← `pages/project/[ref]/logs/explorer/index.tsx`
- [ ] `routes/project/$ref/logs/explorer/recent.tsx` ← `pages/project/[ref]/logs/explorer/recent.tsx`
- [ ] `routes/project/$ref/logs/explorer/saved.tsx` ← `pages/project/[ref]/logs/explorer/saved.tsx`
- [ ] `routes/project/$ref/logs/explorer/templates.tsx` ← `pages/project/[ref]/logs/explorer/templates.tsx`

### Project shell — `/observability/*`

- [ ] `routes/project/$ref/observability/index.tsx` ← `pages/project/[ref]/observability/index.tsx`
- [ ] `routes/project/$ref/observability/$id.tsx` ← `pages/project/[ref]/observability/[id].tsx`
- [ ] `routes/project/$ref/observability/auth.tsx` ← `pages/project/[ref]/observability/auth.tsx`
- [ ] `routes/project/$ref/observability/database.tsx` ← `pages/project/[ref]/observability/database.tsx`
- [ ] `routes/project/$ref/observability/api-overview.tsx` ← `pages/project/[ref]/observability/api-overview.tsx`
- [ ] `routes/project/$ref/observability/edge-functions.tsx` ← `pages/project/[ref]/observability/edge-functions.tsx`
- [ ] `routes/project/$ref/observability/postgrest.tsx` ← `pages/project/[ref]/observability/postgrest.tsx`
- [ ] `routes/project/$ref/observability/query-insights.tsx` ← `pages/project/[ref]/observability/query-insights.tsx`
- [ ] `routes/project/$ref/observability/query-performance.tsx` ← `pages/project/[ref]/observability/query-performance.tsx`
- [ ] `routes/project/$ref/observability/realtime.tsx` ← `pages/project/[ref]/observability/realtime.tsx`
- [ ] `routes/project/$ref/observability/storage.tsx` ← `pages/project/[ref]/observability/storage.tsx`

### Project shell — `/advisors/*`

- [ ] `routes/project/$ref/advisors/performance.tsx` ← `pages/project/[ref]/advisors/performance.tsx`
- [ ] `routes/project/$ref/advisors/security.tsx` ← `pages/project/[ref]/advisors/security.tsx`
- [ ] `routes/project/$ref/advisors/rules/performance.tsx` ← `pages/project/[ref]/advisors/rules/performance.tsx`
- [ ] `routes/project/$ref/advisors/rules/security.tsx` ← `pages/project/[ref]/advisors/rules/security.tsx`

### Project shell — `/settings/*`

- [ ] `routes/project/$ref/settings/general.tsx` ← `pages/project/[ref]/settings/general.tsx`
- [ ] `routes/project/$ref/settings/addons.tsx` ← `pages/project/[ref]/settings/addons.tsx`
- [ ] `routes/project/$ref/settings/api.tsx` ← `pages/project/[ref]/settings/api.tsx`
- [ ] `routes/project/$ref/settings/compute-and-disk.tsx` ← `pages/project/[ref]/settings/compute-and-disk.tsx`
- [ ] `routes/project/$ref/settings/dashboard.tsx` ← `pages/project/[ref]/settings/dashboard.tsx`
- [ ] `routes/project/$ref/settings/infrastructure.tsx` ← `pages/project/[ref]/settings/infrastructure.tsx`
- [ ] `routes/project/$ref/settings/integrations.tsx` ← `pages/project/[ref]/settings/integrations.tsx`
- [ ] `routes/project/$ref/settings/log-drains.tsx` ← `pages/project/[ref]/settings/log-drains.tsx`
- [ ] `routes/project/$ref/settings/api-keys/index.tsx` ← `pages/project/[ref]/settings/api-keys/index.tsx`
- [ ] `routes/project/$ref/settings/api-keys/legacy.tsx` ← `pages/project/[ref]/settings/api-keys/legacy.tsx`
- [ ] `routes/project/$ref/settings/billing/usage.tsx` ← `pages/project/[ref]/settings/billing/usage.tsx`
- [ ] `routes/project/$ref/settings/jwt/index.tsx` ← `pages/project/[ref]/settings/jwt/index.tsx`
- [ ] `routes/project/$ref/settings/jwt/legacy.tsx` ← `pages/project/[ref]/settings/jwt/legacy.tsx`
- [ ] `routes/project/$ref/settings/webhooks/index.tsx` ← `pages/project/[ref]/settings/webhooks/index.tsx`
- [ ] `routes/project/$ref/settings/webhooks/$endpointId.tsx` ← `pages/project/[ref]/settings/webhooks/[endpointId].tsx`

### Project shell — `/integrations/*`

- [ ] `routes/project/$ref/integrations/index.tsx` ← `pages/project/[ref]/integrations/index.tsx`
- [ ] `routes/project/$ref/integrations/$id/index.tsx` ← `pages/project/[ref]/integrations/[id]/index.tsx`
- [ ] `routes/project/$ref/integrations/$id/$pageId/index.tsx` ← `pages/project/[ref]/integrations/[id]/[pageId]/index.tsx`
- [ ] `routes/project/$ref/integrations/$id/$pageId/$childId/index.tsx` ← `pages/project/[ref]/integrations/[id]/[pageId]/[childId]/index.tsx`

### Project shell — `/sql/*`

- [ ] `routes/project/$ref/sql/index.tsx` ← `pages/project/[ref]/sql/index.tsx`
- [ ] `routes/project/$ref/sql/$id.tsx` ← `pages/project/[ref]/sql/[id].tsx`
- [ ] `routes/project/$ref/sql/templates.tsx` ← `pages/project/[ref]/sql/templates.tsx`
- [ ] `routes/project/$ref/sql/quickstarts.tsx` ← `pages/project/[ref]/sql/quickstarts.tsx`

### Project shell — `/editor/*`

- [ ] `routes/project/$ref/editor/index.tsx` ← `pages/project/[ref]/editor/index.tsx`
- [ ] `routes/project/$ref/editor/$id.tsx` ← `pages/project/[ref]/editor/[id].tsx`
- [ ] `routes/project/$ref/editor/new.tsx` ← `pages/project/[ref]/editor/new.tsx`

### Auth shell — `/sign-in`, `/sign-up`, etc.

- [x] A `routes/_auth/sign-in.tsx` ← `pages/sign-in.tsx`
- [x] A `routes/_auth/sign-up.tsx` ← `pages/sign-up.tsx`
- [x] A `routes/_auth/sign-in-sso.tsx` ← `pages/sign-in-sso.tsx`
- [x] A `routes/_auth/sign-in-partner.tsx` ← `pages/sign-in-partner.tsx`
- [x] A `routes/_auth/sign-in-mfa.tsx` ← `pages/sign-in-mfa.tsx` (page inlines SignInLayout)
- [x] A `routes/_auth/forgot-password.tsx` ← `pages/forgot-password.tsx`
- [x] A `routes/_auth/forgot-password-mfa.tsx` ← `pages/forgot-password-mfa.tsx` (page inlines ForgotPasswordLayout)
- [x] A `routes/_auth/reset-password.tsx` ← `pages/reset-password.tsx` (page default already withAuth-wrapped)
- [x] A `routes/_auth/cli/login.tsx` ← `pages/cli/login.tsx` (page inlines APIAuthorizationLayout, withAuth)
- [x] A `routes/_auth/partners/stripe/projects/login.tsx` ← `pages/partners/stripe/projects/login.tsx` (page inlines APIAuthorizationLayout, withAuth)

### Standalone (no shared shell)

- [x] A `routes/authorize.tsx` ← `pages/authorize.tsx` (APIAuthorizationLayout)
- [x] A `routes/redeem.tsx` ← `pages/redeem.tsx` (RedeemCreditsLayout)
- [x] A `routes/logout.tsx` ← `pages/logout.tsx`
- [x] A `routes/maintenance.tsx` ← `pages/maintenance.tsx`

### Error pages (handled at root)

- [x] A `__root.tsx` — wired `notFoundComponent` to `pages/404.tsx`
- [ ] `__root.tsx` — wire `errorComponent` for `pages/500.tsx` / `_error.jsx`

---

## API routes

**Strategy — shim + re-export.** `compat/next/api.ts` exposes
`toWebHandler(nextHandler)` that adapts a `(req, res) => …` Next.js handler
into a TanStack Start Web-fetch handler. Each `routes/api/...` file imports
the default export from `pages/api/...`, wraps with `toWebHandler`, and
registers via `createFileRoute(...).server.handlers`. `apiWrapper` and
`apiAuthenticate` stay untouched — they run inside the shim, seeing a
NextApiRequest-shaped `req` and a proxy `res`.

**Path conventions** — `pages/api/foo/[bar]/baz.ts` → `routes/api/foo/$bar/baz.ts`;
`pages/api/foo/[[...slug]].ts` → `routes/api/foo/$.ts`.

**Shim limitations** — body is buffered, not streamed. 3 routes need bespoke
treatment instead:

- `pages/api/mcp/index.ts` — `StreamableHTTPServerTransport.handleRequest` expects
  Node req/res. Investigate whether the MCP SDK has a Web-fetch transport.
- `pages/api/v1/projects/[ref]/functions/[slug]/body.ts` — pipes `fs.createReadStream`
  into `res`. Rewrite with a Web `ReadableStream`.
- `pages/api/ai/docs.ts` — already edge-runtime + Web `Response`. Direct re-export
  as `GET`/`POST` handlers; no shim needed.

Tracking below is coarse — each bullet is a `pages/api/**` subtree. Check off
once every file in the subtree has a `routes/api/**` counterpart. Expand into
per-file items only when a subtree has special cases.

- [x] `routes/api/get-ip-address.ts` — canary port (validates the shim)
- [x] `routes/api/**` — root-level simple endpoints (`check-cname`,
      `cli-release-version`, `enabled-features-overrides`, `generate-attachment-url`,
      `get-deployment-commit`, `get-utc-time`, `status-override`)
- [x] `routes/api/ai/**` — AI endpoints (`docs.ts` direct-ported as Web-native)
- [x] `routes/api/connect/**`
- [x] `routes/api/content/**`
- [x] `routes/api/edge-functions/**`
- [x] `routes/api/integrations/**`
- [x] `routes/api/platform/**` (60 files, scripted port)
- [x] `routes/api/v1/**` — except `body.ts` (streaming rewrite)
- [ ] `routes/api/v1/projects/$ref/functions/$slug/body.ts` — rewrite with Web streams
- [ ] `routes/api/mcp/index.ts` — needs MCP SDK Web-fetch transport (investigate)
- [x] `routes/api/incident-banner.ts`, `routes/api/incident-status.ts` — App
      Router routes under `app/api/**` (already Web-native, direct re-export)

---

## Deferred / revisit

- `pages/org/_/[[...routeSlug]].tsx` — catch-all placeholder; revisit after all `/org/*` pages are migrated
- `pages/project/_/[[...routeSlug]].tsx` — catch-all placeholder; revisit after all `/project/*` pages are migrated
- Remove `RouteValidationWrapper` + `next/router` compat shim once no page under `pages/` remains
- Remove `compat/next/` directory entirely once all Next imports are gone from workspace source
- Delete this file
