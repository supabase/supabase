# Feature flags in `apps/docs`

Docs has two flag systems. Static flags resolve at build time. PostHog flags resolve in the browser.

## Static flags (`enabled-features`)

- Source: `packages/common/enabled-features/enabled-features.json`. The schema is `enabled-features.schema.json` in the same folder.
- Read a flag with `isFeatureEnabled` from `common/enabled-features`. One key returns a boolean. An array of keys returns an object with camelCased names (`'logs:templates'` becomes `logsTemplates`).
- To add a flag, follow `packages/common/enabled-features/README.md`. Do not copy those steps here.
- Studio-only runtime overrides (`ENABLED_FEATURES_*` env vars, `profile.disabled_features`) do not apply to docs. Docs reads the JSON at build time.
- `ENABLED_FEATURES_OVERRIDE_DISABLE_ALL=true` makes every `isFeatureEnabled` call return `false`. The `embeddings:nimbus` and `embeddings:nimbus:refresh` scripts in `apps/docs/package.json` set it to build the filtered search index.

Where docs uses static flags:

| Place                                                              | Effect                                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `components/Navigation/NavigationMenu/NavigationMenu.constants.ts` | Nav items use an `enabled` value from `isFeatureEnabled([...])`.              |
| `features/directives/Show.ts` (`$Show` in MDX)                     | `<$Show if="flag">` keeps or removes content. `if="!flag"` negates.           |
| `lib/content-listings.utils.ts`                                    | A content listing item with a `feature` field drops out when the flag is off. |
| `internals/generate-reference-markdown.ts`                         | Skips a reference whose `feature` flag is off.                                |

## PostHog flags

- `features/app.providers.tsx` wraps the app in `FeatureFlagProvider` from `packages/common/feature-flags.tsx`. It passes `enabled={IS_PLATFORM}`, so flags load only when the app runs on the platform.
- The provider loads PostHog flags from the platform API path `/telemetry/feature-flags`.
- Read them with `useFeatureFlags()` from `common`. Use the `posthog` object (flag key to value) and the `hasLoaded` boolean. Before `hasLoaded` is `true`, `posthog` is empty.
- Local and staging only: the dev toolbar writes the `x-ph-flag-overrides` cookie, and the provider merges it into `posthog`. See `../../dev-toolbar-review/SKILL.md`.

### Without Supabase access

- A local build is not on the platform, so no PostHog flags load. Variant hooks return `control` (or the cached value from an earlier visit).
- The URL override still works. `?docs-ia-mvp-v1=option-1` shows Option 1 locally with no PostHog access.
- Only Supabase staff can create, change, or ramp PostHog flags. Contributors without access suggest an experiment in the PR or a GitHub issue. See `pm-the-docs` for both paths.

## Variant hook pattern

The template is `apps/docs/features/IaNav/useIaNavVariant.ts`. It reads the `docs-ia-mvp-v1` flag (`IA_NAV_FLAG` in `features/IaNav/constants.ts`). Rules the hook follows:

1. Default to `control` when the flag is loading or unset.
2. Before the flags load, use the value from the last visit. The hook stores it in `localStorage` under `LOCAL_STORAGE_KEYS.IA_NAV_FLAG`. A failed PostHog request keeps this cached value.
3. Let the `?docs-ia-mvp-v1=<variant>` query parameter override the variant. Only known variants count.
4. Treat a `false` flag value as "outside the rollout", not as `control`. The hook uses `isIaNavVariant` to tell them apart.
5. Call `posthogClient.captureExperimentExposure(flag, { variant }, hasAccepted)` only when the loaded flag assigns the visitor and no URL override exists. Pass the consent value from `useConsentState`. A cached value never records an exposure.

The hook has tests in `useIaNavVariant.test.ts`. Write tests for each new variant hook.

## Nav variant mechanism

- `features/IaNav/option1.constants.ts` re-exports everything from `NavigationMenu.constants.ts`. It then overrides the menus that change (for example `database`, `auth`, `GLOBAL_MENU_ITEMS`). The override files live in `features/IaNav/option1/`.
- `features/IaNav/useNavItems.ts` returns `option1NavItems` for the `option-1` variant. Otherwise it returns the current constants.
- Consumers of `useNavItems`: `layouts/MainSkeleton.tsx`, `NavigationMenuGuideList.tsx`, `GlobalNavigationMenu.tsx`, and `GlobalMenuDrawer.tsx`.

## Gotchas

- `$Show` reads static flags only. It cannot read PostHog flags. For a PostHog-driven change, branch in a React component with a variant hook.
- The server renders the control nav, so an `option-1` visitor can see a flicker. The code limits this in two ways. The inline script `IA_NAV_CACHE_SCRIPT` in `app/layout.tsx` runs before paint. It sets `data-ia-nav="option-1"` on `<html>` from the URL override or the cached value. Until hydration, `useIaNavReady` returns `false`, and the nav adds `IA_NAV_PENDING_CLASS` to hide itself when that attribute is set.
- A first-time visitor has no cached value, so the flicker can still happen on the first visit.
- Exposure is not recorded for a forced variant (URL override) or for a cached value.
- The cache is a `localStorage` value. A stale value can show the wrong variant until the flags load.

## Related

- `../../telemetry-standards/SKILL.md`, section "Feature Flag Measurement". It describes Studio patterns (`usePHFlag`). Use it for measurement ideas, not as a docs hook template.
- `../../dev-toolbar-review/SKILL.md` for the override cookies and environment guards.
- PMs: see `pm-the-docs`. Docs engineering owns creating and ramping PostHog flags. Contributors without Supabase access follow the OSS path in `pm-the-docs`.
