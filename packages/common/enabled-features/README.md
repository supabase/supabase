# enabled-features

Static feature-flag source used across Studio, docs, and www. The source of truth is `enabled-features.json`; every flag listed there is enabled (`true`) or disabled (`false`) at build time.

## Using a flag

```ts
import { isFeatureEnabled } from 'common/enabled-features'

if (isFeatureEnabled('logs:templates')) {
  // ...
}

const { logsTemplates, logsMetadata } = isFeatureEnabled(['logs:templates', 'logs:metadata'])
```

Passing an array returns a camelCased object so consumers can destructure.

`isFeatureEnabled(feature, runtimeDisabledFeatures?)` accepts an optional list of features disabled at runtime (e.g. from the authenticated profile) that compose on top of the static defaults.

In Studio, prefer `useIsFeatureEnabled` from `@/hooks/misc/useIsFeatureEnabled` — it layers the authenticated profile's `disabled_features` and the self-hosted runtime override (below) on top of the static JSON.

## Runtime override (Studio self-hosted)

Self-hosted Studio deployments can disable flags at container start time without rebuilding the image. Set one env var per flag under the `ENABLED_FEATURES_` prefix:

```bash
ENABLED_FEATURES_LOGS_ALL=false
ENABLED_FEATURES_LOGS_TEMPLATES=false
ENABLED_FEATURES_BRANDING_LARGE_LOGO=true
```

Env var values are `true` / `false` (case-insensitive). Any other value is logged and ignored.

### Key → env name mapping

Uppercase the feature key and replace every non-alphanumeric character (`:`, `_`, `-`) with `_`:

| Feature key                      | Env var name                                      |
| -------------------------------- | ------------------------------------------------- |
| `logs:all`                       | `ENABLED_FEATURES_LOGS_ALL`                       |
| `branding:large_logo`            | `ENABLED_FEATURES_BRANDING_LARGE_LOGO`            |
| `docs:self-hosting`              | `ENABLED_FEATURES_DOCS_SELF_HOSTING`              |
| `logs:show_metadata_ip_template` | `ENABLED_FEATURES_LOGS_SHOW_METADATA_IP_TEMPLATE` |

Mapping is forward-only (known key → expected env name), so snake_case vs colon collisions like `branding:large_logo` / `branding_large:logo` never come up.

Env vars prefixed with `ENABLED_FEATURES_` that don't match a known feature are logged and ignored — a catch for typos.

### Resolution order (Studio runtime)

1. `ENABLED_FEATURES_*` env vars (self-hosted only — route is a no-op when `IS_PLATFORM === true`)
2. `profile.disabled_features` from `/platform/profile`
3. `enabled-features.json` static value
4. Default (enabled)

### Scope & limitations

- **Studio only.** The runtime override is surfaced through a Next.js API route and React Query, which docs and www don't use — their flag resolution stays build-time from `enabled-features.json`.
- **Hosted is unaffected.** The API route returns an empty list when `IS_PLATFORM === true`; hosted Studio continues to derive disabled features exclusively from the authenticated profile.
- **Brief flash of unstyled flags.** Before the override fetch resolves, flags default to their JSON value. For features gated as "enabled in JSON, disabled by runtime override", there's a brief window where the UI shows the feature before it's hidden.
- **`Support.constants.ts` call site is build-time only.** `apps/studio/components/interfaces/Support/Support.constants.ts` calls `isFeatureEnabled('billing:all')` at module load to build `CATEGORY_OPTIONS`, which is then spread into Zod form schemas. That one call site resolves from the static JSON and cannot be runtime-overridden without a larger refactor.

## Disable everything (for tooling)

`ENABLED_FEATURES_OVERRIDE_DISABLE_ALL=true` forces every flag to `false`. Used by the docs embeddings pipeline to produce a filtered index. This is a server-only env (no `NEXT_PUBLIC_` prefix) and short-circuits over everything else.

## Adding a new flag

1. Add the key to `enabled-features.json` with the desired default.
2. Add the key and a description to `enabled-features.schema.json`, including it in the `required` array.
