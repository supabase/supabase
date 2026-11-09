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
- Reload the page to apply a toolbar override. The provider ignores the cookie when no PostHog flags load, so the override does nothing in a local build.

### Without Supabase access

- A local build is not on the platform, so no PostHog flags load. Variant hooks return `control` (or the cached value from an earlier visit).
- The URL override still works. `?<flag>=<variant>` shows that variant locally with no PostHog access.
- The URL override applies only to the page that has it in its URL. Navigation links drop the query parameter, and the hook does not cache the override. After you follow a link, the page returns to `control` or the cached variant. Add the parameter to each page that you want to preview.
- Only Supabase staff can create, change, or ramp PostHog flags. Contributors without access suggest an experiment in the PR or a GitHub issue. See `pm-the-docs` for both paths.

## Variant hook pattern

Each experiment reads its flag through a variant hook. To find the current hooks, search `apps/docs` for `captureExperimentExposure`. A variant hook follows these rules:

1. Before the flags load, use the value from the last visit. The hook stores it in `localStorage`. The cached value can be any variant, not only `control`.
2. Keep the cached value after `hasLoaded` is `true` if PostHog returns no flags (an empty response or a failed request). Only a non-empty response replaces the cache.
3. If the cached or loaded flag value is not a known variant, use `control` unless a valid URL override applies.
4. Let the `?<flag>=<variant>` query parameter override the variant. Only known variants count.
5. Treat a `false` flag value as "outside the rollout", not as an assignment to `control`.
6. Call `posthogClient.captureExperimentExposure(flag, { variant }, hasAccepted)` only when the loaded flag assigns the visitor and no URL override exists. Pass the consent value from `useConsentState`. A cached value never records an exposure.

Write tests for each variant hook, next to the hook.

To test a nav variant, override the nav constants for that variant and select them in a hook. Every nav consumer must read the nav items from that hook.

## Gotchas

- `$Show` reads static flags only. It cannot read PostHog flags. For a PostHog-driven change, branch in a React component with a variant hook.
- The server renders `control`, so a visitor in another variant can see a flicker. To limit it, add an inline script to `app/layout.tsx`. The script reads the URL override or the cached value before paint and marks `<html>`. The changed component hides itself until hydration when that mark is set. Add a fallback that restores visibility if hydration does not complete.
- A first-time visitor has no cached value, so the flicker can still happen on the first visit.
- Exposure is not recorded for a forced variant (URL override) or for a cached value.
- The cache is a `localStorage` value. A stale value can show the wrong variant until the flags load.

## Related

- `../../telemetry-standards/SKILL.md`, section "Feature Flag Measurement". It describes Studio patterns (`usePHFlag`). Use it for measurement ideas, not as a docs hook template.
- `../../dev-toolbar-review/SKILL.md` for the override cookies and environment guards.
- PMs: see `pm-the-docs`. Docs engineering owns creating and ramping PostHog flags. Contributors without Supabase access follow the OSS path in `pm-the-docs`.
- Example (2026): the IA nav experiment, flag `docs-ia-mvp-v1`, in `features/IaNav/`. It can be removed after the experiment ends.
