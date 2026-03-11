---
name: telemetry-standards
description: PostHog event tracking standards for Supabase Studio. Use when reviewing
  PRs for telemetry compliance or implementing new event tracking. Covers event naming,
  property conventions, approved patterns, and implementation guide.
---

# Telemetry Standards for Supabase Studio

Standards for PostHog event tracking in `apps/studio/`. Apply these when
reviewing PRs that touch tracking or when implementing new tracking.

## Event Naming

**Format:** `[object]_[verb]` in snake_case

**Approved verbs only:**
opened, clicked, submitted, created, removed, updated, retrieved, intended, evaluated, added,
enabled, disabled, copied, exposed, failed, converted

**Flag these:**
- Unapproved verbs (saved, viewed, seen, pressed, etc.)
- Wrong order: `click_product_card` → should be `product_card_clicked`
- Wrong casing: `productCardClicked` → should be `product_card_clicked`

**Good examples:**
- `product_card_clicked`
- `backup_button_clicked`
- `sql_query_submitted`

**Common mistakes with corrections:**
- `database_saved` → `save_button_clicked` or `database_updated` (unapproved verb)
- `click_backup_button` → `backup_button_clicked` (wrong order)
- `dashboardViewed` → don't track passive views on page load
- `component_rendered` → don't track — no user interaction

## Property Standards

**Casing:** camelCase preferred for new events. The codebase has existing snake_case properties (e.g., `schema_name`, `table_name`) — when adding properties to an existing event, match its established convention.

**Names must be self-explanatory:**
- `{ productType: 'database', planTier: 'pro' }`
- `{ assistantType: 'sql', suggestionType: 'optimization' }`

**Flag these:**
- Generic names: `label`, `value`, `name`, `data`
- PascalCase properties
- Inconsistent names across similar events (e.g., `assistantType` in one event, `aiType` in a related event)
- Mixing camelCase and snake_case within the same event

## What NOT to Track

- Passive views/renders on page load (`dashboard_viewed`, `sidebar_appeared`, `page_loaded`)
- Component appearances without user interaction
- Generic "viewed" or "seen" events — already captured by pageview events

**DO track:** user clicks, form submissions, explicit opens/closes, user-initiated actions.

**Exception:** `_exposed` events for A/B experiment exposure tracking are valid even though they fire on render.

**Never track PII** (emails, names, IPs, etc.) in event properties.

## Required Pattern

Import `useTrack` from `lib/telemetry/track` (within `apps/studio/`). Never use `useSendEventMutation` (deprecated).

```typescript
import { useTrack } from 'lib/telemetry/track'

const MyComponent = () => {
  const track = useTrack()

  const handleClick = () => {
    track('product_card_clicked', {
      productType: 'database',
      planTier: 'pro',
      source: 'dashboard',
    })
  }

  return <button onClick={handleClick}>Click me</button>
}
```

## Event Definitions

All events must be defined as TypeScript interfaces in `packages/common/telemetry-constants.ts`:

```typescript
/**
 * [Event description]
 *
 * @group Events
 * @source [what triggers this event]
 */
export interface MyFeatureClickedEvent {
  action: 'my_feature_clicked'
  properties: {
    /** Description of property */
    featureType: string
  }
  groups: TelemetryGroups
}
```

Add the new interface to the `TelemetryEvent` union type so `useTrack` picks it up.
`@group Events` and `@source` must be accurate.

## Review Rules

When reviewing a PR, flag these as **required changes:**

1. **Naming violations** — event not following `[object]_[verb]` snake_case, or using an unapproved verb
2. **Property violations** — not camelCase, generic names, or inconsistent with similar events
3. **Deprecated hook** — any usage of `useSendEventMutation` instead of `useTrack`
4. **Unnecessary view tracking** — events that fire on page load without user interaction
5. **Inaccurate docs** — `@page`/`@source` descriptions that don't match the actual implementation

When a PR adds user-facing interactions (buttons, forms, toggles, modals) **without** tracking, suggest:
- "This adds a user interaction that may benefit from tracking."
- Propose the event name following `[object]_[verb]` convention
- Propose the `useTrack()` call with suggested properties

When checking property consistency, search `packages/common/telemetry-constants.ts` for similar events and verify property names match.

## Well-Formed Event Examples

From the actual codebase:

```typescript
// User copies a connection string
track('connection_string_copied', {
  connectionType: 'psql',
  connectionMethod: 'transaction_pooler',
  connectionTab: 'Connection String',
})

// User enables a feature preview
track('feature_preview_enabled', {
  feature: 'realtime_inspector',
})

// User clicks a banner CTA
track('index_advisor_banner_dismiss_button_clicked')

// Experiment exposure (fires on render — valid exception)
track('home_new_experiment_exposed', {
  variant: 'treatment',
})
```

## Implementing New Tracking

To add tracking for a user action:

1. **Name the event** — `[object]_[verb]` using approved verbs only
2. **Choose properties** — camelCase preferred for new events; check `packages/common/telemetry-constants.ts` for similar events and match their property names and casing
3. **Add interface to telemetry-constants.ts** — with `@group Events` and `@source` JSDoc, add to the `TelemetryEvent` union type
4. **Add to component** — `import { useTrack } from 'lib/telemetry/track'`, call `track('event_name', { properties })`

### Verification checklist

- [ ] Event name follows `[object]_[verb]` with approved verb
- [ ] Event name is snake_case
- [ ] Properties are camelCase and self-explanatory
- [ ] Event defined in telemetry-constants.ts with accurate `@page`/`@source`
- [ ] Using `useTrack` hook (not `useSendEventMutation`)
- [ ] Not tracking passive views/appearances
- [ ] No PII in event properties (emails, names, IPs, etc.)
- [ ] Property names consistent with similar events
