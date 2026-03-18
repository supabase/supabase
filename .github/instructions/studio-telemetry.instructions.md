---
applyTo: "apps/studio/**,packages/common/telemetry-constants.ts"
---

# Studio Telemetry Review Rules

All comments are **advisory** — suggest, do not request changes.

## When to Flag Missing Telemetry

Use judgment — not every PR needs telemetry. But **always flag** when:

1. **Feature flags without measurement.** If a PR uses `usePHFlag`, `useFlag`, or `useDataApiGrantTogglesEnabled` to gate behavior, the flag state **must** be captured in a telemetry event so the rollout can be measured in PostHog. Flag if the flag value isn't included in a relevant `track()` call.
2. **Feature-flagged rollouts without outcome tracking.** If a flag gates new behavior (e.g., revoking grants, changing defaults), there should be telemetry on both the flag state *and* how users respond to the new behavior (e.g., toggle clicks, opt-in actions).
3. **Growth-oriented components adding user interactions without tracking** — suggest adding telemetry when a PR adds buttons, forms, toggles, or modals in components that affect user acquisition, activation, or conversion:
   - Onboarding / getting started flows
   - Connect / setup wizards
   - Upgrade / billing CTAs and modals
   - A/B experiment variants (anything using `usePHFlag`)
4. **Changes to `packages/common/telemetry-constants.ts`** — validate event naming, property conventions, and JSDoc accuracy.

When tracking is missing, comment: _"This adds a user interaction (or feature flag) that may benefit from tracking."_ Then propose an event name and `useTrack()` call.

## Feature Flag Telemetry Pattern

When capturing a PostHog flag value for telemetry, read the raw flag via `usePHFlag<boolean>('flagName')` — **not** through wrapper hooks that coerce `undefined` to `false`. The `undefined` state (flag store still loading) must be preserved so PostHog omits the property rather than recording a false negative. Use conditional spread:

```typescript
const flagValue = usePHFlag<boolean>('myFlag')
track('event_name', {
  ...(flagValue !== undefined && { myFlagEnabled: flagValue }),
})
```

## Event Naming

Format: `[object]_[verb]` in snake_case.

Reuse verbs from `packages/common/telemetry-constants.ts`: `opened`, `clicked`, `submitted`, `created`, `removed`, `updated`, `enabled`, `disabled`, `copied`, `exposed`, `failed`, `converted`, `closed`, `completed`, `applied`, `sent`.

Flag these:
- Inconsistent or overly generic verbs that don't match existing patterns (e.g. `saved`, `viewed`, `seen`, `pressed`)
- Wrong order: `click_product_card` → should be `product_card_clicked`
- Wrong casing: `productCardClicked` → should be `product_card_clicked`
- Passive view tracking on page load (`dashboard_viewed`, `page_loaded`) — exception: `_exposed` events for A/B experiments are valid

## Event Properties

- **camelCase** for new events; match existing convention when extending an event
- Names must be self-explanatory — flag generic names like `label`, `value`, `name`, `data`
- Check `packages/common/telemetry-constants.ts` for similar events and verify property names are consistent (e.g., don't use `aiType` if related events use `assistantType`)
- Never track PII (emails, names, IPs)

## Event Implementation

- Use `useTrack` from `lib/telemetry/track` (not `useSendEventMutation`)
- New events need a TypeScript interface in `telemetry-constants.ts` with `@group Events`, `@source`, `@page` JSDoc tags, added to the `TelemetryEvent` union
- Flag `@source`/`@page` that don't match actual usage

See `.claude/skills/telemetry-standards/SKILL.md` for the full standard.
