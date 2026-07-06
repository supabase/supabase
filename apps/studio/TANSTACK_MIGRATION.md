# TanStack Start migration — route checklist

Temporary tracking doc. Delete once migration is done.

**Runtime model — Next.js and TanStack Start run side-by-side**

Throughout this migration both runtimes coexist in the same workspace:

- The Next.js pages router (`pages/...`) and the TanStack route tree
  (`routes/...`) ship **at the same time**. The Vite/TanStack build is
  what we run today; the Next build (`build:next` / `dev:next` scripts
  in `apps/studio/package.json`) stays alive as a fallback so we can
  bisect regressions and ship either runtime if needed.
- **Do not delete any `apps/studio/pages/...` file during the per-route
  migration.** Path A pages re-export their `pages/` default export, so
  the Next file is load-bearing for both runtimes. Removing it breaks
  the Next build and breaks the TanStack route too.
- Body-moves and `pages/...` deletion happen **only in the final
  cleanup pass**, after every route is represented in `routes/...` and
  we're ready to retire the Next runtime entirely. That's a separate,
  deliberate phase — not something to fold into individual route PRs.
- Same rule for the Next compat shims (`apps/studio/compat/next/`):
  they stay until the cleanup pass, regardless of how many routes have
  moved.

**PR guardrail — mirror page edits into their route**

Because both runtimes ship at once, any change to a `pages/...` file can
leave its `routes/...` mirror stale. A CodeRabbit `path_instructions`
rule (`.coderabbit.yaml`, scoped to `apps/studio/pages/**`) posts a
review reminder on every PR that touches a page, prompting the author to
check whether the corresponding route needs the same change. It's a
verify-not-block reminder: pure body edits on re-export (Path A) pages
propagate automatically, but layout/`getLayout`, `staticData` props,
`withAuth`, redirect-path, or brand-new-page changes must be mirrored by
hand. This guardrail is temporary scaffolding — remove it in the cleanup
pass when `pages/**` is deleted (tracked by FE-3106).

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
- **Never** delete a `pages/...` file mid-migration — both runtimes need to keep working. Body-moves and Next-file deletions are reserved for the cleanup pass at the very end, after every entry in this checklist is `[x]`. See "Runtime model" above.
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
- [x] `routes/_app/new.tsx` — skipped; only `_app/new/index.tsx` lives under \_app (inlines WizardLayout). `new/$slug` is top-level (no AppLayout) so a sub-shell would not actually share state.
- [x] `routes/integrations/vercel.tsx` — VercelIntegrationWindowLayout. **Delta vs plan:** placed at top-level rather than under `_app/` — Next getLayout for all three leaves wraps only in VercelIntegrationWindowLayout, no AppLayout/DefaultLayout.

### Project shell

- [x] `routes/project/$ref.tsx` — DefaultLayout only. **Delta vs plan:** ProjectLayoutWithAuth omitted from the shell because product layouts (DatabaseLayout, AuthLayout, StorageLayout, …) already render `withAuth(... ProjectLayout ...)` internally — adding it here would double-wrap. The home page (`/project/$ref/index.tsx`) wraps itself in `ProjectLayoutWithAuth` since it has no product layout.
- [x] `routes/project/$ref/database.tsx` — DatabaseLayout (reads `databaseLayoutTitle` from leaf `staticData`)
- [x] `routes/project/$ref/database/triggers.tsx` — sub-shell with `PageLayout` + permission gate + nav items, inlined from `DatabaseTriggersLayout`. **Delta vs plan:** the existing `DatabaseTriggersLayout` component wraps `<DatabaseLayout title="Triggers">` internally, so re-using it inside the database.tsx shell would double-wrap. Inlined the inner part instead; the Next-side component is left untouched (still used by the `pages/...` files we re-export).
- [x] `routes/project/$ref/auth.tsx` — AuthLayout (reads `authLayoutTitle` from leaf `staticData`). **Delta vs plan:** shell honours a `skipAuthLayout: true` opt-out in `staticData` for leaves whose own body or sub-layout already wraps in `AuthLayout` (`AuthProvidersLayout`, `AuthEmailsLayout`, `pages/.../auth/third-party.tsx`) — without it those routes would double-wrap (which also doubles `withAuth` + `ProjectLayout`).
- ~~`routes/project/$ref/auth/templates.tsx` — AuthEmailsLayout~~ **Delta vs plan: not landed.** A unified `templates.tsx` sub-shell would force `templates/$templateId.tsx` (which uses plain `AuthLayout`, not `AuthEmailsLayout`) into the wrong wrapping. Instead `templates/index.tsx` and `auth/smtp.tsx` each set `skipAuthLayout: true` and wrap themselves in `AuthEmailsLayout`; `templates/$templateId.tsx` uses the standard auth shell with `authLayoutTitle: 'Emails'`.
- [x] `routes/project/$ref/storage.tsx` — StorageLayout + StorageBucketsLayout (reads `storageLayoutTitle`, optional `skipStorageBucketsLayout`, `storageBucketsLayoutTitle`, `storageBucketsLayoutHideSubtitle` from leaf `staticData`). **Delta vs plan:** the shell wraps in BOTH StorageLayout and StorageBucketsLayout by default — every storage page except bucket-detail pages uses both. Bucket-detail pages set `skipStorageBucketsLayout: true`. `/storage/s3` uses `storageBucketsLayout{Title,HideSubtitle}` to override the inner header.
- [x] `routes/project/$ref/realtime.tsx` — RealtimeLayout (reads `realtimeLayoutTitle` from leaf `staticData`)
- [x] `routes/project/$ref/functions.tsx` — EdgeFunctionsLayout (reads `functionsLayoutTitle` from leaf `staticData`). Honours `skipFunctionsLayout: true` opt-out for the `$functionSlug` subtree, whose `EdgeFunctionDetailsLayout` already wraps `EdgeFunctionsLayout` internally — same pattern as auth.tsx. Sub-shell at `routes/project/$ref/functions/$functionSlug.tsx` provides `EdgeFunctionDetailsLayout` for all 5 slug leaves (reads `edgeFunctionDetailsTitle` from leaf staticData).
- [x] `routes/project/$ref/branches.tsx` — BranchLayout only. **Delta vs plan:** the per-page `PageLayout` (with different titles + primary/secondary actions) stays in each leaf. Hoisted `BranchesPageWrapper` and `MergeRequestsPageWrapper` to top-level exports in their respective `pages/...` files so the route files can import + re-use the same wrapping.
- [x] `routes/project/$ref/logs.tsx` — LogsLayout (reads `logsLayoutTitle` from leaf staticData). Honours `skipLogsLayout: true` for `logs/index` (page handles its own ProjectLayout-wrapped content for the UnifiedLogs / no-permission cases). Refactored `pages/.../logs/index.tsx` to move the inline `<DefaultLayout>` into `getLayout` so it isn't duplicated when the TanStack project shell already provides DefaultLayout.
- [x] `routes/project/$ref/observability.tsx` — ObservabilityLayout (reads `observabilityLayoutTitle` from leaf staticData)
- [x] `routes/project/$ref/advisors.tsx` — AdvisorsLayout (reads `advisorsLayoutTitle` from leaf staticData). Honours `skipAdvisorsLayout: true` opt-out for the rules sub-shell, which provides its own AdvisorsLayout-less-DefaultLayout wrap. Scans whole match chain (same pattern as functions.tsx).
- [x] `routes/project/$ref/advisors/rules.tsx` — sub-shell that inlines the inner body of `AdvisorRulesLayout` (AdvisorsLayout + PageLayout with title/tabs/feature-preview badge), minus the outer DefaultLayout (already provided by the parent project shell). Sets `skipAdvisorsLayout: true` on its own staticData. **Delta vs plan:** the existing `AdvisorRulesLayout` component wraps in DefaultLayout + AdvisorsLayout internally, so reusing it as-is would double-wrap both. Inlined the inner part; the Next-side component is untouched.
- [x] `routes/project/$ref/settings.tsx` — SettingsLayout (reads `settingsLayoutTitle` from leaf staticData). Honours `skipSettingsLayout: true` for `settings/api` (redirect-only page). Adds a sub-shell at `routes/project/$ref/settings/api-keys.tsx` providing `ApiKeysLayout` for both api-keys leaves; `jwt/index` wraps in `JWTKeysLayout` inline since `jwt/legacy` doesn't share it.
- [x] `routes/project/$ref/integrations.tsx` — ProjectIntegrationsLayout (no staticData; all 4 leaves share identical layout). Layout is `withAuth(({ children }) => <ProjectLayout>{children}</ProjectLayout>)`, so the shell just wraps `<Outlet />` once.
- [x] `routes/project/$ref/sql.tsx` — EditorBaseLayout + SQLEditorLayout. Twin of editor.tsx; all four leaves share identical layout props so the shell hardcodes them (no `staticData` overrides). EditorBaseLayout wraps in ProjectLayoutWithAuth; SQLEditorLayout adds its own `withAuth` HOC but no extra ProjectLayout — same shape as the table editor (auth check runs twice but no double render).
- [x] `routes/project/$ref/editor.tsx` — EditorBaseLayout + TableEditorLayout. All three leaves share identical layout props so the shell hardcodes them (no `staticData` overrides). EditorBaseLayout wraps in `ProjectLayoutWithAuth` internally; TableEditorLayout's happy path is just a fragment + side-effect (banner) and only wraps in `ProjectLayoutWithAuth` on its no-permission branch — same as Next, no double-wrap in normal use.

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
- [x] `routes/_app/new/index.tsx` ← `pages/new/index.tsx` (inlines WizardLayout; sets `defaultLayoutHeaderTitle: 'New organization'` + `hideMobileMenu: true` on staticData). **Delta vs plan:** no `_app/new.tsx` sub-shell — `new/$slug` doesn't fit under \_app and uses a different inner wrapper (PageLayout), so a shared shell wouldn't share anything.
- [x] A `routes/new/$slug.tsx` ← `pages/new/[slug].tsx` **Delta vs plan:** placed at top-level rather than under `_app/` — Next getLayout omits AppLayout and uses PageLayout (not WizardLayout) inside DefaultLayout, so leaf inlines the full DefaultLayout + PageLayout wrap itself.
- [x] A `routes/aws-marketplace-onboarding.tsx` ← `pages/aws-marketplace-onboarding.tsx` **Delta vs plan:** placed at root rather than under `_app/` — page uses its own `LinkAwsMarketplaceLayout` and doesn't want `AppLayout` + `DefaultLayout` wrapping.
- [x] A `routes/claim-project.tsx` ← `pages/claim-project.tsx` **Delta vs plan:** placed at root rather than under `_app/` — page uses its own `<Head>` + `<main>` layout and doesn't want `AppLayout` + `DefaultLayout` wrapping.
- [x] A `routes/join.tsx` ← `pages/join.tsx` **Delta vs plan:** placed at root rather than under `_app/` — page uses a centered-div layout and doesn't want `AppLayout` + `DefaultLayout` wrapping.
- [x] `routes/_app/support/new.tsx` ← `pages/support/new.tsx` (sets `hideMobileMenu: true` staticData; existing page is `withAuth`-wrapped so no beforeLoad migration needed yet)
- [x] `routes/_app/support/link.tsx` ← `pages/support/link.tsx`

### App shell — integrations

- [x] A `routes/integrations/vercel/install.tsx` ← `pages/integrations/vercel/install.tsx`
- [x] A `routes/integrations/vercel/$slug/marketplace/choose-project.tsx` ← `pages/integrations/vercel/[slug]/marketplace/choose-project.tsx`
- [x] A `routes/integrations/vercel/$slug/deploy-button/new-project.tsx` ← `pages/integrations/vercel/[slug]/deploy-button/new-project.tsx`
- [x] A `routes/integrations/github/authorize.tsx` ← `pages/integrations/github/authorize.tsx` **Delta vs plan:** placed at top-level rather than under `_app/` — Next page has no getLayout (renders bare), so adding AppLayout/DefaultLayout via \_app would be a behaviour change.

### Project shell — home

- [x] A `routes/project/$ref/index.tsx` ← `pages/project/[ref]/index.tsx` (route wraps in `ProjectLayoutWithAuth` itself — see shell delta above)
- [x] `routes/project/$ref/merge.tsx` ← `pages/project/[ref]/merge.tsx` (leaf wraps body in `ProjectLayoutWithAuth`; parent `project/$ref.tsx` shell provides DefaultLayout)

### Project shell — `/api/*`

- [x] `routes/project/$ref/api/index.tsx` ← `pages/project/[ref]/api/index.tsx` (redirect-only page; no extra wrap needed beyond the parent DefaultLayout shell)

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
- [x] A `routes/project/$ref/database/tables/index.tsx` ← `pages/project/[ref]/database/tables/index.tsx`
- [x] A `routes/project/$ref/database/tables/$id.tsx` ← `pages/project/[ref]/database/tables/[id].tsx`
- [x] A `routes/project/$ref/database/publications/index.tsx` ← `pages/project/[ref]/database/publications/index.tsx`
- [x] A `routes/project/$ref/database/publications/$id.tsx` ← `pages/project/[ref]/database/publications/[id].tsx`
- [x] A `routes/project/$ref/database/replication/index.tsx` ← `pages/project/[ref]/database/replication/index.tsx`
- [x] A `routes/project/$ref/database/replication/$pipelineId.tsx` ← `pages/project/[ref]/database/replication/[pipelineId].tsx`
- [x] A `routes/project/$ref/database/replication/replica/$replicaId.tsx` ← `pages/project/[ref]/database/replication/replica/[replicaId].tsx`
- [x] A `routes/project/$ref/database/triggers/index.tsx` ← `pages/project/[ref]/database/triggers/index.tsx`
- [x] A `routes/project/$ref/database/triggers/data.tsx` ← `pages/project/[ref]/database/triggers/data.tsx` (sub-shell at `database/triggers.tsx` provides PageLayout + nav, parent shell provides DatabaseLayout)
- [x] A `routes/project/$ref/database/triggers/event.tsx` ← `pages/project/[ref]/database/triggers/event.tsx` (same as data)
- [x] A `routes/project/$ref/database/backups/pitr.tsx` ← `pages/project/[ref]/database/backups/pitr.tsx`
- [x] A `routes/project/$ref/database/backups/restore-to-new-project.tsx` ← `pages/project/[ref]/database/backups/restore-to-new-project.tsx`
- [x] A `routes/project/$ref/database/backups/scheduled.tsx` ← `pages/project/[ref]/database/backups/scheduled.tsx`

### Project shell — `/auth/*`

- [x] A `routes/project/$ref/auth/overview.tsx` ← `pages/project/[ref]/auth/overview.tsx`
- [x] A `routes/project/$ref/auth/users.tsx` ← `pages/project/[ref]/auth/users.tsx`
- [x] A `routes/project/$ref/auth/policies.tsx` ← `pages/project/[ref]/auth/policies.tsx`
- [x] A `routes/project/$ref/auth/providers.tsx` ← `pages/project/[ref]/auth/providers.tsx` (sets `skipAuthLayout: true`, wraps in `AuthProvidersLayout` directly)
- [x] A `routes/project/$ref/auth/mfa.tsx` ← `pages/project/[ref]/auth/mfa.tsx`
- [x] A `routes/project/$ref/auth/hooks.tsx` ← `pages/project/[ref]/auth/hooks.tsx`
- [x] A `routes/project/$ref/auth/smtp.tsx` ← `pages/project/[ref]/auth/smtp.tsx` (sets `skipAuthLayout: true`, wraps in `AuthEmailsLayout` directly)
- [x] A `routes/project/$ref/auth/sessions.tsx` ← `pages/project/[ref]/auth/sessions.tsx`
- [x] A `routes/project/$ref/auth/passkeys.tsx` ← `pages/project/[ref]/auth/passkeys.tsx`
- [x] A `routes/project/$ref/auth/performance.tsx` ← `pages/project/[ref]/auth/performance.tsx`
- [x] A `routes/project/$ref/auth/protection.tsx` ← `pages/project/[ref]/auth/protection.tsx`
- [x] A `routes/project/$ref/auth/rate-limits.tsx` ← `pages/project/[ref]/auth/rate-limits.tsx`
- [x] A `routes/project/$ref/auth/third-party.tsx` ← `pages/project/[ref]/auth/third-party.tsx` (sets `skipAuthLayout: true` — page body inlines `<AuthProvidersLayout>` which already wraps `<AuthLayout>`)
- [x] A `routes/project/$ref/auth/oauth-apps.tsx` ← `pages/project/[ref]/auth/oauth-apps.tsx`
- [x] A `routes/project/$ref/auth/oauth-server.tsx` ← `pages/project/[ref]/auth/oauth-server.tsx`
- [x] A `routes/project/$ref/auth/url-configuration.tsx` ← `pages/project/[ref]/auth/url-configuration.tsx`
- [x] A `routes/project/$ref/auth/audit-logs.tsx` ← `pages/project/[ref]/auth/audit-logs.tsx`
- [x] A `routes/project/$ref/auth/templates/index.tsx` ← `pages/project/[ref]/auth/templates/index.tsx` (sets `skipAuthLayout: true`, wraps in `AuthEmailsLayout` directly)
- [x] A `routes/project/$ref/auth/templates/$templateId.tsx` ← `pages/project/[ref]/auth/templates/[templateId].tsx` (`authLayoutTitle: 'Emails'` — page uses plain `AuthLayout`, not `AuthEmailsLayout`)

### Project shell — `/storage/*`

- [x] A `routes/project/$ref/storage/s3.tsx` ← `pages/project/[ref]/storage/s3.tsx`
- [x] A `routes/project/$ref/storage/files/index.tsx` ← `pages/project/[ref]/storage/files/index.tsx`
- [x] A `routes/project/$ref/storage/files/policies.tsx` ← `pages/project/[ref]/storage/files/policies.tsx`
- [x] A `routes/project/$ref/storage/files/settings.tsx` ← `pages/project/[ref]/storage/files/settings.tsx`
- [x] A `routes/project/$ref/storage/files/buckets/$bucketId.tsx` ← `pages/project/[ref]/storage/files/buckets/[bucketId].tsx` (sets `skipStorageBucketsLayout: true`)
- [x] A `routes/project/$ref/storage/analytics/index.tsx` ← `pages/project/[ref]/storage/analytics/index.tsx`
- [x] A `routes/project/$ref/storage/analytics/buckets/$bucketId.tsx` ← `pages/project/[ref]/storage/analytics/buckets/[bucketId].tsx` (sets `skipStorageBucketsLayout: true`)
- [x] A `routes/project/$ref/storage/vectors/index.tsx` ← `pages/project/[ref]/storage/vectors/index.tsx`
- [x] A `routes/project/$ref/storage/vectors/buckets/$bucketId.tsx` ← `pages/project/[ref]/storage/vectors/buckets/[bucketId].tsx` (sets `skipStorageBucketsLayout: true`)

### Project shell — `/realtime/*`

- [x] A `routes/project/$ref/realtime/inspector.tsx` ← `pages/project/[ref]/realtime/inspector.tsx`
- [x] A `routes/project/$ref/realtime/policies.tsx` ← `pages/project/[ref]/realtime/policies.tsx`
- [x] A `routes/project/$ref/realtime/settings.tsx` ← `pages/project/[ref]/realtime/settings.tsx`

### Project shell — `/functions/*`

- [x] A `routes/project/$ref/functions/index.tsx` ← `pages/project/[ref]/functions/index.tsx` (route wraps in exported `EdgeFunctionsIndexPageWrapper` for the inline PageHeader + actions)
- [x] A `routes/project/$ref/functions/new.tsx` ← `pages/project/[ref]/functions/new.tsx`
- [x] A `routes/project/$ref/functions/secrets.tsx` ← `pages/project/[ref]/functions/secrets.tsx` (route wraps in exported `SecretsPageWrapper`)
- [x] A `routes/project/$ref/functions/$functionSlug/index.tsx` ← `pages/project/[ref]/functions/[functionSlug]/index.tsx`
- [x] A `routes/project/$ref/functions/$functionSlug/code.tsx` ← `pages/project/[ref]/functions/[functionSlug]/code.tsx`
- [x] A `routes/project/$ref/functions/$functionSlug/details.tsx` ← `pages/project/[ref]/functions/[functionSlug]/details.tsx`
- [x] A `routes/project/$ref/functions/$functionSlug/invocations.tsx` ← `pages/project/[ref]/functions/[functionSlug]/invocations.tsx`
- [x] A `routes/project/$ref/functions/$functionSlug/logs.tsx` ← `pages/project/[ref]/functions/[functionSlug]/logs.tsx`

### Project shell — `/branches/*`

- [x] A `routes/project/$ref/branches/index.tsx` ← `pages/project/[ref]/branches/index.tsx` (route wraps in exported `BranchesPageWrapper` to preserve the page's `PageLayout` + Create-branch action)
- [x] A `routes/project/$ref/branches/merge-requests.tsx` ← `pages/project/[ref]/branches/merge-requests.tsx` (route wraps in exported `MergeRequestsPageWrapper`)

### Project shell — `/logs/*`

- [x] A `routes/project/$ref/logs/index.tsx` ← `pages/project/[ref]/logs/index.tsx` (sets `skipLogsLayout: true`; page handles its own ProjectLayout; DefaultLayout moved to page's `getLayout` so Next still wraps it)
- [x] A `routes/project/$ref/logs/auth-logs.tsx` ← `pages/project/[ref]/logs/auth-logs.tsx`
- [x] A `routes/project/$ref/logs/cron-logs.tsx` ← `pages/project/[ref]/logs/cron-logs.tsx`
- [x] A `routes/project/$ref/logs/dedicated-pooler-logs.tsx` ← `pages/project/[ref]/logs/dedicated-pooler-logs.tsx`
- [x] A `routes/project/$ref/logs/edge-functions-logs.tsx` ← `pages/project/[ref]/logs/edge-functions-logs.tsx`
- [x] A `routes/project/$ref/logs/edge-logs.tsx` ← `pages/project/[ref]/logs/edge-logs.tsx`
- [x] A `routes/project/$ref/logs/pg-upgrade-logs.tsx` ← `pages/project/[ref]/logs/pg-upgrade-logs.tsx`
- [x] A `routes/project/$ref/logs/pgcron-logs.tsx` ← `pages/project/[ref]/logs/pgcron-logs.tsx`
- [x] A `routes/project/$ref/logs/pooler-logs.tsx` ← `pages/project/[ref]/logs/pooler-logs.tsx`
- [x] A `routes/project/$ref/logs/postgres-logs.tsx` ← `pages/project/[ref]/logs/postgres-logs.tsx`
- [x] A `routes/project/$ref/logs/postgrest-logs.tsx` ← `pages/project/[ref]/logs/postgrest-logs.tsx`
- [x] A `routes/project/$ref/logs/realtime-logs.tsx` ← `pages/project/[ref]/logs/realtime-logs.tsx`
- [x] A `routes/project/$ref/logs/replication-logs.tsx` ← `pages/project/[ref]/logs/replication-logs.tsx`
- [x] A `routes/project/$ref/logs/storage-logs.tsx` ← `pages/project/[ref]/logs/storage-logs.tsx`
- [x] A `routes/project/$ref/logs/explorer/index.tsx` ← `pages/project/[ref]/logs/explorer/index.tsx`
- [x] A `routes/project/$ref/logs/explorer/recent.tsx` ← `pages/project/[ref]/logs/explorer/recent.tsx`
- [x] A `routes/project/$ref/logs/explorer/saved.tsx` ← `pages/project/[ref]/logs/explorer/saved.tsx`
- [x] A `routes/project/$ref/logs/explorer/templates.tsx` ← `pages/project/[ref]/logs/explorer/templates.tsx`

### Project shell — `/observability/*`

- [x] A `routes/project/$ref/observability/index.tsx` ← `pages/project/[ref]/observability/index.tsx`
- [x] A `routes/project/$ref/observability/$id.tsx` ← `pages/project/[ref]/observability/[id].tsx`
- [x] A `routes/project/$ref/observability/auth.tsx` ← `pages/project/[ref]/observability/auth.tsx`
- [x] A `routes/project/$ref/observability/database.tsx` ← `pages/project/[ref]/observability/database.tsx`
- [x] A `routes/project/$ref/observability/api-overview.tsx` ← `pages/project/[ref]/observability/api-overview.tsx`
- [x] A `routes/project/$ref/observability/edge-functions.tsx` ← `pages/project/[ref]/observability/edge-functions.tsx`
- [x] A `routes/project/$ref/observability/postgrest.tsx` ← `pages/project/[ref]/observability/postgrest.tsx`
- [x] A `routes/project/$ref/observability/query-insights.tsx` ← `pages/project/[ref]/observability/query-insights.tsx`
- [x] A `routes/project/$ref/observability/query-performance.tsx` ← `pages/project/[ref]/observability/query-performance.tsx`
- [x] A `routes/project/$ref/observability/realtime.tsx` ← `pages/project/[ref]/observability/realtime.tsx`
- [x] A `routes/project/$ref/observability/storage.tsx` ← `pages/project/[ref]/observability/storage.tsx`

### Project shell — `/advisors/*`

- [x] A `routes/project/$ref/advisors/performance.tsx` ← `pages/project/[ref]/advisors/performance.tsx`
- [x] A `routes/project/$ref/advisors/security.tsx` ← `pages/project/[ref]/advisors/security.tsx`
- [x] A `routes/project/$ref/advisors/rules/performance.tsx` ← `pages/project/[ref]/advisors/rules/performance.tsx`
- [x] A `routes/project/$ref/advisors/rules/security.tsx` ← `pages/project/[ref]/advisors/rules/security.tsx`

### Project shell — `/settings/*`

- [x] A `routes/project/$ref/settings/general.tsx` ← `pages/project/[ref]/settings/general.tsx`
- [x] A `routes/project/$ref/settings/addons.tsx` ← `pages/project/[ref]/settings/addons.tsx`
- [x] A `routes/project/$ref/settings/api.tsx` ← `pages/project/[ref]/settings/api.tsx` (sets `skipSettingsLayout: true` — page is a useEffect redirect)
- [x] A `routes/project/$ref/settings/compute-and-disk.tsx` ← `pages/project/[ref]/settings/compute-and-disk.tsx`
- [x] A `routes/project/$ref/settings/dashboard.tsx` ← `pages/project/[ref]/settings/dashboard.tsx`
- [x] A `routes/project/$ref/settings/infrastructure.tsx` ← `pages/project/[ref]/settings/infrastructure.tsx`
- [x] A `routes/project/$ref/settings/integrations.tsx` ← `pages/project/[ref]/settings/integrations.tsx`
- [x] A `routes/project/$ref/settings/log-drains.tsx` ← `pages/project/[ref]/settings/log-drains.tsx`
- [x] A `routes/project/$ref/settings/api-keys/index.tsx` ← `pages/project/[ref]/settings/api-keys/index.tsx` (under `api-keys.tsx` sub-shell with ApiKeysLayout)
- [x] A `routes/project/$ref/settings/api-keys/legacy.tsx` ← `pages/project/[ref]/settings/api-keys/legacy.tsx` (under `api-keys.tsx` sub-shell)
- [x] A `routes/project/$ref/settings/billing/usage.tsx` ← `pages/project/[ref]/settings/billing/usage.tsx`
- [x] A `routes/project/$ref/settings/jwt/index.tsx` ← `pages/project/[ref]/settings/jwt/index.tsx` (wraps in JWTKeysLayout inline)
- [x] A `routes/project/$ref/settings/jwt/legacy.tsx` ← `pages/project/[ref]/settings/jwt/legacy.tsx`
- [x] A `routes/project/$ref/settings/webhooks/index.tsx` ← `pages/project/[ref]/settings/webhooks/index.tsx`
- [x] A `routes/project/$ref/settings/webhooks/$endpointId.tsx` ← `pages/project/[ref]/settings/webhooks/[endpointId].tsx`

### Project shell — `/integrations/*`

- [x] `routes/project/$ref/integrations/index.tsx` ← `pages/project/[ref]/integrations/index.tsx`
- [x] `routes/project/$ref/integrations/$id/index.tsx` ← `pages/project/[ref]/integrations/[id]/index.tsx`
- [x] `routes/project/$ref/integrations/$id/$pageId/index.tsx` ← `pages/project/[ref]/integrations/[id]/[pageId]/index.tsx`
- [x] `routes/project/$ref/integrations/$id/$pageId/$childId/index.tsx` ← `pages/project/[ref]/integrations/[id]/[pageId]/[childId]/index.tsx`

### Project shell — `/sql/*`

- [x] A `routes/project/$ref/sql/index.tsx` ← `pages/project/[ref]/sql/index.tsx`
- [x] A `routes/project/$ref/sql/$id.tsx` ← `pages/project/[ref]/sql/[id].tsx`
- [x] A `routes/project/$ref/sql/templates.tsx` ← `pages/project/[ref]/sql/templates.tsx`
- [x] A `routes/project/$ref/sql/quickstarts.tsx` ← `pages/project/[ref]/sql/quickstarts.tsx`

### Project shell — `/editor/*`

- [x] A `routes/project/$ref/editor/index.tsx` ← `pages/project/[ref]/editor/index.tsx`
- [x] A `routes/project/$ref/editor/$id.tsx` ← `pages/project/[ref]/editor/[id].tsx`
- [x] A `routes/project/$ref/editor/new.tsx` ← `pages/project/[ref]/editor/new.tsx`

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

- [x] B `routes/index.tsx` — redirect-only root route. Mirrors the Next.js `redirects()` rules in `next.config.ts`: platform sends users to `/org` (or `/new/new-project` when deep-linked with `?next=new-project`), self-hosted sends them to `/project/default`. **Follow-up:** the redirect targets currently use `href` (full reload) because they were on the Next side when this was written; switch to `to` now that all of them live in the TanStack tree.
- [x] A `routes/authorize.tsx` ← `pages/authorize.tsx` (APIAuthorizationLayout)
- [x] A `routes/redeem.tsx` ← `pages/redeem.tsx` (RedeemCreditsLayout)
- [x] A `routes/logout.tsx` ← `pages/logout.tsx`
- [x] A `routes/maintenance.tsx` ← `pages/maintenance.tsx`

### Error pages (handled at root)

- [x] A `__root.tsx` — wired `notFoundComponent` to `pages/404.tsx`
- [x] `__root.tsx` — wired `errorComponent` to `pages/500.tsx`. Mirrors the in-tree `react-error-boundary` Sentry capture (`scope.setTag('routerErrorComponent', true)`) so router-level errors (loader/component-render failures before the in-tree boundary mounts) still report. `pages/_error.jsx` stays load-bearing under Next but isn't reached at runtime under TanStack — it's the pages-router catch-all that has no TanStack equivalent.

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

**Shim coverage.** The proxy `req` / `res` cover both the buffered and
streaming patterns that pages-router handlers use:

- **Buffered responses** — `res.status`/`setHeader`/`json`/`send`/`write`/
  `end` accumulate into a single `Response` body when the handler returns.
- **Streaming responses** — `res.writeHead(status, headers?)` (or
  `res.flushHeaders()`) flips the proxy into streaming mode: a Web
  `ReadableStream` opens, buffered chunks flush into it, subsequent
  `res.write(chunk)` enqueues live, `res.end()` closes it. `finalize()`
  returns the `Response` while the handler keeps pushing chunks. This is
  what makes `result.pipeUIMessageStreamToResponse(res, …)` (AI SDK)
  stream token-by-token to the browser.
- **Client abort** — Web `Request.signal` is plumbed through as
  `req.on('close' | 'aborted', …)`. AI handlers that wire
  `abortController.abort()` off those events keep working.
- **EventEmitter surface** — `req.on`/`once`/`off`/`emit` (events `close`
  / `aborted` are real; other names accepted but no-op). `res.on`/etc.
  are no-op stubs so pipe helpers attaching `drain`/`close`/`error`
  listeners don't crash.
- **Body parsing** — JSON and `application/x-www-form-urlencoded` parsed
  to `req.body`; everything else is the raw text. Multipart inbound is
  not implemented — no studio handler reads multipart in.

Two routes still bypass the shim because they're easier to write
Web-natively from scratch:

- `routes/api/v1/projects/$ref/functions/$slug/body.ts` — multipart
  streaming OUT (artifact download). Builds the `Response` body as a
  `ReadableStream`; each artifact file converts via
  `Readable.toWeb(createReadStream(...))` and pulls chunk-by-chunk into
  the stream.
- `routes/api/mcp/index.ts` — uses MCP SDK's
  `WebStandardStreamableHTTPServerTransport` (`handleRequest(request)`
  returns a `Response` directly).
- `pages/api/ai/docs.ts` was already edge-runtime / Web-Response native
  — direct re-export, no shim involved.

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
- [x] `routes/api/v1/projects/$ref/functions/$slug/body.ts` — Web-streams rewrite. Returns a `Response` whose body is a `ReadableStream`; each artifact file is converted via `Readable.toWeb(createReadStream(...))` and pulled chunk-by-chunk into the multipart stream. Skips the `apiWrapper` since `getFunctionsArtifactStore` already asserts self-hosted mode (the pages-router `withAuth` was a no-op outside `IS_PLATFORM`).
- [x] `routes/api/mcp/index.ts` — uses `WebStandardStreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js`. Takes a Web `Request`, returns a `Response` directly — no shim needed. Query parsing pulled from `request.url`'s search params; headers passed through unchanged.
- [x] `routes/api/incident-banner.ts`, `routes/api/incident-status.ts` — App
      Router routes under `app/api/**` (already Web-native, direct re-export)

---

## Compat shim surface (`compat/next/`)

The Next compat shims stay alive as long as any `pages/...` file is
load-bearing. Listed here so the cleanup PR knows what to delete /
inline.

- `router.ts` — `useRouter()` for hook callers (TanStack `useRouter` +
  `useLocation` + `useMatches` + `useParams` + `useSearch` glued
  together), plus a `default` export (`SingletonRouter` shape) for the
  one module-scope `import router from 'next/router'` consumer
  (Support/DiscordCTACard) that reads `router.basePath` outside React.
  `router.pathname` strips the trailing slash TanStack appends to index
  routes (without it, `router.pathname.split('/')[3]` returns `''`
  instead of `undefined` for index pages and the project sidebar's
  active-route check breaks).
- `_router-events.ts` — adapts `router.events.on(event, handler)` onto
  `router.subscribe(tsEvent, …)`. Forwards Next's `(url, { shallow })`
  args. Maps `routeChangeStart` / `routeChangeComplete` /
  `beforeHistoryChange` / `hashChangeStart` / `hashChangeComplete`.
  **Known gap:** Next's throw-from-`routeChangeStart`-to-cancel pattern
  isn't supportable — `subscribe` is fire-and-forget.
  `usePreventNavigationOnUnsavedChanges` relies on it and needs
  migrating to TanStack's `useBlocker` separately.
- `api.ts` — `toWebHandler(nextHandler)`. See **API routes → Shim
  coverage** above.
- `link.tsx`, `navigation.ts`, `dynamic.tsx`, `image.tsx`,
  `legacy/image.tsx`, `script.tsx`, `head.tsx`, `server.ts` — comprehensive
  drop-in replacements for the `next/*` modules studio imports. All
  bundled via `vite.config.ts`'s `nextCompat()` plugin (alias) +
  `ssr.noExternal: [/^next(\/|$)/]` so the shims always win over the
  real Next packages.

---

## Build / bundler workarounds

`vite.config.ts` carries two classes of build-time guard that exist
purely because of how Rolldown chunks our specific dependency graph.
They should be revisited (and ideally lifted) once the migration is
done.

### `manualChunks` pins

Pin shared library code into dedicated chunks so per-component chunks
can't import from a chunk that (transitively) imports them back —
chunk-level cycles surface in the browser as
`TypeError: <name> is not a function` at module-load time.

- `class-variance-authority` — entry #1 in CIRCULAR_IMPORTS.md.
- `lucide-react` — keeps Lucide icons from being per-icon-split into
  chunks that import `createLucideIcon` back from the `ui` chunk
  (`folder-open-<hash>.js` was the canary).
- `react-vendor` (react + react-dom + scheduler + jsx-runtime) — pinned
  before `lucide-react` so Rolldown doesn't suck React into the
  lucide chunk for CJS interop and shift live-bindings across the rest
  of the graph (`Alert-<hash>.js` was the canary).

All three are documented in `CIRCULAR_IMPORTS.md` — slated for a
follow-up structural fix in `packages/ui` so the pins can be lifted.

### `assertNoChunkCycles` build plugin

Vite plugin that runs Tarjan's SCC on the emitted chunk graph in
`generateBundle` and fails the build if any unknown chunk cycle exists.
The pre-existing CVA cycle is allowlisted by chunk basename
(`KNOWN_CHUNK_CYCLES` constant) so the build still passes; any **new**
cycle blocks the build with a message pointing at CIRCULAR_IMPORTS.md.

Keep this plugin even after migration — it's not a Next-related shim,
it's general protection against this entire class of bug. Just clear
the allowlist when the underlying cycle is gone.

### Other build-side migration changes

- `pnpm-workspace.yaml` catalog now includes `@tanstack/react-router`,
  `@tanstack/react-start`, `@tanstack/react-table` so studio and
  ui-library stay aligned. `react-query` is **not** in the catalog yet
  — three consumers (studio, docs, ui-library) sit on different 5.x
  ranges and unifying them is a separate decision.
- `NODE_OPTIONS=--max-old-space-size=8192` is set on the studio
  `dev` script — Vite's Rolldown-RC frontend hits the default 4 GB
  ceiling when chewing through studio's module graph in watch mode.

---

## Deferred / revisit

- ~~`pages/org/_/[[...routeSlug]].tsx`~~ landed as `routes/org.[_].tsx` + `routes/org.[_].$.tsx`. **Naming delta:** path-as-filename form (not `routes/org/[_]/index.tsx`) because the index-file form trips a router-generator bug at `getRouteNodes.js:132` — when an `index.tsx` has a bracket-escaped _parent_ segment, `originalRoutePath` gets wiped wholesale and the escape info is lost, so `_` gets stripped as pathless. The path-as-filename form keeps the last segment non-index and avoids the bug branch entirely. Next page accepts either Next-style `routeSlug` (string[]) or TanStack-style `_splat` (string) and normalises to the array shape.
- ~~`pages/project/_/[[...routeSlug]].tsx`~~ landed as `routes/project.[_].tsx` + `routes/project.[_].$.tsx`. Same naming-delta rationale as the org catch-alls above.

### Cleanup checklist (after every `pages/...` file is gone)

- Switch `routes/index.tsx` redirects from `href` to `to` — all targets
  now live in the TanStack tree.
- Migrate `usePreventNavigationOnUnsavedChanges` from `router.events.on('routeChangeStart', …)` (throw-to-cancel pattern) to TanStack's `useBlocker`.
- Drop the `_splat` / `routeSlug` normalisation block from
  `pages/org/_/[[...routeSlug]].tsx` + `pages/project/_/[[...routeSlug]].tsx` (only there to keep both runtimes mounting the same body).
- Remove `RouteValidationWrapper` + `next/router` compat shim usage from `__root.tsx`.
- Remove `compat/next/` directory entirely once no `next/*` import remains in workspace source.
- Lift `manualChunks` pins (`class-variance-authority`, `lucide-react`, `react-vendor`) once the structural fix in `packages/ui` lands — see CIRCULAR_IMPORTS.md. Keep `assertNoChunkCycles`; just clear `KNOWN_CHUNK_CYCLES`.
- Delete `pages/_app.tsx`, `pages/_document.tsx`, `pages/_error.jsx`, `pages/500.tsx`, `pages/404.tsx` (Next-only catch-alls; TanStack equivalents on `__root.tsx`).
- Drop the `dev:next` / `build:next` / `start:next` scripts from `apps/studio/package.json` once we're committed to TanStack.
- Remove the `apps/studio/pages/**` `path_instructions` guardrail entry from `.coderabbit.yaml` (added in FE-3423; remove it as part of this FE-3106 cleanup) — it's only useful while both runtimes coexist.
- Delete this file.
