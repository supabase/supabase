---
name: dev-toolbar-review
description: Safety rules for the dev toolbar, PostHog client, and feature flags. Use
  when writing or reviewing any change to packages/dev-tools/, packages/common/posthog-client.ts,
  or packages/common/feature-flags.tsx. Covers environment guards, flag override cookies,
  telemetry event subscription, and SSE stream safety.
---

# Dev Toolbar Review Guide

Review checklist for PRs touching the dev toolbar (`packages/dev-tools/`) and its
integration points in `packages/common/`. The toolbar surfaces telemetry events and
allows feature flag overrides in local and staging environments only.

## When This Applies

PRs modifying any of these paths need growth eng review:

- `packages/dev-tools/**` (owned by `@supabase/growth-eng` in CODEOWNERS)
- `packages/common/posthog-client.ts` (flag override reads, event subscription)
- `packages/common/feature-flags.tsx` (flag override merge logic)
- App-level mounting: `DevToolbarProvider`/`DevToolbar`/`DevToolbarTrigger` in `apps/studio/`, `apps/www/`, `apps/docs/`

Note: `posthog-client.ts` and `feature-flags.tsx` are NOT in CODEOWNERS for growth-eng,
so PRs touching only those files won't auto-request review. Watch for these in the PR feed.

## Review Checklist

### 1. Environment Guards

**Files:** `packages/dev-tools/index.ts`, `DevToolbar.tsx`, `DevToolbarTrigger.tsx`, `DevToolbarContext.tsx`

The toolbar uses two layers of protection:

- **Build-time tree-shaking** in `index.ts`: the bundler inlines `process.env.NEXT_PUBLIC_ENVIRONMENT`, so `isToolbarEnabled = env === 'local' || env === 'staging'` makes the export ternaries static. Outside those two environments every export is a stub (`DevToolbar` and `DevToolbarTrigger` render `null`, `DevToolbarProvider` passes children through, `useDevToolbar` returns a no-op context) and the implementation modules are eliminated from the bundle. The same literal `process.env` check is duplicated in `DevToolbarContext.tsx`, `DevToolbar.tsx`, `DevToolbarTrigger.tsx`, and `feature-flags.tsx` because the bundler must see it directly — keep them in sync.
- **Runtime guards** inside the implementation: `IS_LOCAL_DEV = env === 'local'` gates the local-only pieces — the SSE event stream in `DevToolbarContext.tsx` and local-only UI in `DevToolbar.tsx` — so staging gets the toolbar without them.

**Check for:**

- Guards being removed or broadened. The toolbar is enabled only for `local` and `staging`; preview and production builds must keep getting the stubs.
- Tree-shaking ternaries in `index.ts` staying intact — these are the primary production safety mechanism.
- New components or exports that bypass the existing guard pattern.

### 2. Flag Override Cookies

**Files:** `packages/dev-tools/DevToolbar.tsx`, `packages/common/posthog-client.ts`, `packages/common/feature-flags.tsx`

The toolbar writes two cookies that override feature flags locally:

- `x-ph-flag-overrides` — PostHog flag overrides
- `x-cc-flag-overrides` — ConfigCat flag overrides

These are read by:

- `posthog-client.ts:getFeatureFlag()` — checks the PostHog override cookie before querying the SDK
- `feature-flags.tsx` — merges both override cookies into the flag store during initialization

**Check for:**

- Cookie name changes (must stay in sync across writer and all readers)
- Changes to the merge/precedence logic in `feature-flags.tsx` (currently: `vercel-flag-overrides` first, then `x-cc-flag-overrides` takes precedence in local dev)
- Override cookies being read outside the `IS_LOCAL_DEV` / `isLocalDev` guard — overrides must never affect production flag evaluation
- Changes to `parseOverrideValue` or `valuesAreEqual` in `packages/dev-tools/utils.ts` that could cause type coercion bugs

### 3. Telemetry Event Subscription

**Files:** `packages/common/posthog-client.ts`, `packages/dev-tools/DevToolbarContext.tsx`

The toolbar subscribes to client-side PostHog events via `posthogClient.subscribeToEvents()`.
The PostHog client calls `emitToDevListeners()` after `capturePageView`, `capturePageLeave`,
and `identify`. Note: `captureExperimentExposure` calls `posthog.capture()` directly
without emitting to dev listeners — experiment exposure events are invisible in the toolbar.

**Check for:**

- Changes to `emitToDevListeners` or `subscribeToEvents` that could introduce side effects on the actual capture path (e.g., throwing errors, blocking, mutating event data)
- The listener set (`devListeners`) being iterated synchronously in a way that could delay event dispatch
- New PostHog client methods that capture events but don't call `emitToDevListeners` (gap in toolbar visibility)

### 4. SSE Server Telemetry Stream

**Files:** `packages/dev-tools/DevToolbarContext.tsx`

The toolbar connects to `${apiUrl}/telemetry/stream` via Server-Sent Events to display
server-side telemetry. Uses exponential backoff on connection errors.

**Check for:**

- Changes to the SSE endpoint URL or `session_id` cookie handling
- Reconnection logic changes that could cause excessive retries or connection leaks
- Note: the stream endpoint lives in the platform repo — cross-repo changes need coordinated review

### 5. App-Level Mounting

**Provider + toolbar panel** (`DevToolbarProvider`, `DevToolbar`):

- `apps/studio/pages/_app.tsx`
- `apps/www/pages/_app.tsx`, `apps/www/app/providers.tsx`
- `apps/docs/features/app.providers.tsx`

**Trigger button** (`DevToolbarTrigger`) — rendered separately in nav/header components:

- `apps/studio/components/layouts/Navigation/LayoutHeader/LayoutHeader.tsx`
- `apps/www/components/Nav/index.tsx`
- `apps/docs/components/Navigation/NavigationMenu/TopNavBar.tsx`

**Check for:**

- Provider being added or removed from an app
- `apiUrl` prop changes (must point to the correct platform API)
- Rendering order changes that could affect the toolbar's access to PostHog context

## What Doesn't Need Growth Review

Changes that are purely UI/UX within the toolbar panel itself — styling, layout, copy
changes, drag behavior, popover positioning — don't need growth eng review unless they
also touch the integration points above.
