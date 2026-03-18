# Copilot Code Review Instructions

## Repo Context

This is a TypeScript/Next.js/React monorepo:

- `apps/studio/` — Supabase Dashboard (primary review target)
- `apps/www/` — Marketing site
- `apps/docs/` — Documentation
- `packages/common/` — Shared code including telemetry definitions

---

## Telemetry Review Rules

These rules apply to changes in `apps/studio/` and `packages/common/telemetry-constants.ts`. All comments are **advisory** — suggest, do not request changes.

### When to Review for Telemetry

1. **Changes to `packages/common/telemetry-constants.ts`** — validate event naming, property conventions, and JSDoc accuracy.
2. **Growth-oriented components adding user interactions without tracking** — suggest adding telemetry when a PR adds buttons, forms, toggles, or modals in components that affect user acquisition, activation, or conversion:
   - Onboarding / getting started flows
   - Connect / setup wizards
   - Upgrade / billing CTAs and modals
   - A/B experiment variants (anything using `usePHFlag`)

When tracking is missing, comment: _"This adds a user interaction that may benefit from tracking."_ Then propose an event name and `useTrack()` call.

### Event Naming

Format: `[object]_[verb]` in snake_case.

Prefer verbs that already exist in `packages/common/telemetry-constants.ts` (reuse existing patterns wherever possible). Common examples include: `opened`, `clicked`, `submitted`, `created`, `removed`, `updated`, `retrieved`, `intended`, `evaluated`, `added`, `enabled`, `disabled`, `copied`, `exposed`, `failed`, `converted`, `closed`, `completed`, `applied`, `sent`.

Flag these:
- Inconsistent or overly generic verbs that don't match existing patterns (e.g. `saved`, `viewed`, `seen`, `pressed`)
- Wrong order: `click_product_card` → should be `product_card_clicked`
- Wrong casing: `productCardClicked` → should be `product_card_clicked`
- Passive view tracking on page load (`dashboard_viewed`, `page_loaded`) — exception: `_exposed` events for A/B experiments are valid

### Event Properties

- **camelCase** for new events; match existing convention when extending an event
- Names must be self-explanatory — flag generic names like `label`, `value`, `name`, `data`
- Check `packages/common/telemetry-constants.ts` for similar events and verify property names are consistent (e.g., don't use `aiType` if related events use `assistantType`)
- Never track PII (emails, names, IPs)

### Event Implementation

- Import `useTrack` from `lib/telemetry/track` — prefer `useTrack` for new telemetry and avoid introducing new `useSendEventMutation` usage
- New events must have a TypeScript interface in `packages/common/telemetry-constants.ts`:
  - Include `@group Events` and `@source` JSDoc tags; add `@page` when applicable (for page-specific events)
  - Add the interface to the `TelemetryEvent` union type
- Flag `@source` descriptions that don't match the actual implementation; when `@page` is present, validate that it matches the actual page usage

### Correct Pattern

```typescript
import { useTrack } from 'lib/telemetry/track'

const track = useTrack()
track('product_card_clicked', {
  productType: 'database',
  planTier: 'pro',
  source: 'dashboard',
})
```

---

## Testing Review Rules

These rules apply to changes in `apps/studio/` that add or modify React components or utility functions. All comments are **advisory**.

### Core Principle

Push logic out of React components into pure `.utils.ts` functions, then test those functions exhaustively. Only use component tests for complex UI interactions.

### When to Comment

- PR adds **business logic inline in a component** that could be extracted to a `ComponentName.utils.ts` file next to the component and unit tested at `tests/components/.../ComponentName.utils.test.ts`
- PR adds a **utility function without test coverage**
- PR uses **component tests for pure logic** that should be a unit test on a pure function
- PR adds a **feature used in both self-hosted and platform** without E2E test consideration

### Which Test Type to Suggest

- **Pure transformation** (parse, format, validate, compute) → extract to `.utils.ts` + unit test with vitest
- **Complex UI interaction** → component test with `customRender` (or E2E if shared with self-hosted)
- **E2E tests** should cover both click interactions AND keyboard shortcuts
- **No tests at all** for non-trivial changes → nudge to add coverage

---

## References

For the full, authoritative versions of these standards:

- Telemetry: `.claude/skills/telemetry-standards/SKILL.md`
- Testing: `.claude/skills/studio-testing/SKILL.md`
