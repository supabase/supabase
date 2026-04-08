---
applyTo: "apps/studio/**,packages/common/telemetry*"
---

# Studio Telemetry Review Rules

All comments are **advisory** — suggest, do not request changes.

## When to Flag Missing Telemetry

Use judgment — not every PR needs telemetry. But **always flag** when:

1. **Changes to `packages/common/telemetry-constants.ts`** — validate event naming, property conventions, and JSDoc accuracy.
2. **PostHog feature flags without measurement.** If a PR uses `usePHFlag` or PostHog-backed hooks like `useDataApiGrantTogglesEnabled` to gate behavior, the flag state should be captured in a telemetry event so the rollout can be measured. Flag if the flag value isn't included in a relevant `track()` call. (Note: `useFlag` from `common` reads ConfigCat flags, not PostHog — different system, different guidance.)
3. **Feature-flagged rollouts without outcome tracking.** If a flag gates new behavior, there should be telemetry on both the flag state *and* how users respond to the new behavior (e.g., toggle clicks, opt-in actions).
4. **Growth-oriented components adding user interactions without tracking** — onboarding flows, setup wizards, upgrade CTAs, A/B experiment variants.

When tracking is missing, comment: _"This adds a user interaction (or feature flag) that may benefit from tracking."_ Then propose an event name and `useTrack()` call.

## Feature Flag Telemetry Pattern

When capturing a PostHog flag value for telemetry, read the raw flag via `usePHFlag('flagName')` — **not** through wrapper hooks that coerce `undefined` to `false`. Use conditional spread so the property is omitted (not false) when the flag store hasn't loaded:

```typescript
const flagValue = usePHFlag<boolean>('myBooleanFlag') // for boolean flags
track('event_name', {
  ...(flagValue !== undefined && { myFlagEnabled: flagValue }),
})
```

For string-valued flags (e.g., experiment variants), use `usePHFlag<string>('flagName')` instead.

## Event Naming

Format: `[object]_[verb]` in snake_case.

Prefer verbs already in use in `packages/common/telemetry-constants.ts`: `opened`, `clicked`, `submitted`, `created`, `removed`, `updated`, `intended`, `evaluated`, `added`, `enabled`, `disabled`, `copied`, `exposed`, `failed`, `converted`, `closed`, `completed`, `applied`, `sent`, `moved`.

Flag: unapproved verbs (`saved`, `viewed`, `pressed`), wrong order (`click_product_card`), wrong casing (`productCardClicked`), passive view tracking on page load (exception: `_exposed` events for A/B experiments).

## Event Properties

- **camelCase** for new events; match existing convention when extending
- Self-explanatory names — flag generic (`label`, `value`, `name`, `data`)
- Check `telemetry-constants.ts` for consistency with similar events
- Never track PII

## Event Implementation

- Use `useTrack` from `lib/telemetry/track` — avoid introducing new `useSendEventMutation` usage
- New events need a TypeScript interface in `telemetry-constants.ts` with `@group Events` and `@source` JSDoc tags (add `@page` when applicable for page-specific events), added to the `TelemetryEvent` union

```typescript
import { useTrack } from 'lib/telemetry/track'
const track = useTrack()
track('product_card_clicked', { productType: 'database', planTier: 'pro' })
```

Canonical standards: `.claude/skills/telemetry-standards/SKILL.md`
