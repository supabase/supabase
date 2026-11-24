---
name: telemetry-standards
description: PostHog event tracking standards for Supabase Studio. Use when adding
  useTrack() calls, defining events in packages/common/telemetry-constants.ts,
  implementing tracking for a new feature, or reviewing PRs for telemetry compliance.
  Covers event naming, property conventions, approved patterns, and implementation
  guide.
---

# Telemetry Standards for Supabase Studio

Standards for PostHog event tracking in `apps/studio/`. Apply these when
reviewing PRs that touch tracking or when implementing new tracking.

## Event Naming

**Format:** `[object]_[verb]` in snake_case

**Approved verbs only** (canonical list — derived from `packages/common/telemetry-constants.ts`):
opened, clicked, submitted, created, removed, updated, intended, evaluated, added,
enabled, disabled, copied, exposed, failed, converted, closed, completed, applied, sent, moved

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

**Casing:** camelCase preferred for new events. The codebase has existing snake_case properties (e.g., `schema_name`, `table_name`) — when adding properties to an existing event, match its established casing. Match casing only: don't copy these properties into new events, because they carry user-defined names (see [Privacy](#privacy-user-defined-names-and-identifiers)).

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

## Privacy: User-Defined Names and Identifiers

**Never track PII** (emails, names, IPs, etc.) in event properties.

Event properties must also never contain anything a user chose or typed for their own project. These are customer data even though they are not PII, and sending them is outside our privacy policy. Mask or omit:

- Schema, table, column, function, bucket, policy, project and branch names
- Any other user-defined name or label (index, trigger, role, extension setting, edge function, secret key, and so on)
- SQL text, filters, search terms, file or object paths, and other free-text input
- Row, object or record IDs, and any ID or ref not already attached by `useTrack`

`useTrack` already attaches `groups.project` (project ref) and `groups.organization` (org slug) to every event. Don't add these, or other IDs, as properties.

**Send a count, enum, boolean or action category instead of the raw value.** Type new properties as string-literal unions or `boolean`/`number`, never plain `string`, so a raw name can't compile in.

```typescript
// Don't (illustrative): raw names identify the customer's data model
track('table_copied', { schemaName: 'billing_internal', tableName: 'invoices' })

// Do (illustrative): categories, counts and booleans carry the same product insight
track('database_schema_visualizer_copied', { content: 'table_sql' })
track('database_schema_selector_updated', { schemaType: 'custom' }) // 'public' | 'protected' | 'custom'
track('policy_created', { operation: 'select', hasCheckExpression: true })
```

If you need to tell values apart, derive a category (`public` / `protected` / `custom`), a count (`tableCount`), or a boolean (`isDefaultSchema`). If a raw name seems essential, stop and ask before adding it.

`data-attr` attributes are not tracked while PostHog autocapture is off (`autocapture: false` in `packages/common/posthog-client.ts`). Keep their values static strings, and never build them from user-defined names, in case autocapture is enabled later.

## Required Pattern

Import `useTrack` from `@/lib/telemetry/track` (within `apps/studio/`).

```typescript
import { useTrack } from '@/lib/telemetry/track'

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

## Feature Flag Measurement

A feature flag that gates behavior needs telemetry on both the flag state and how users respond to the new behavior (toggle clicks, opt-in actions), so the rollout can be measured.

- **PostHog flags** (`usePHFlag`, or PostHog-backed hooks such as `useDataApiRevokeOnCreateDefaultEnabled`): capture the flag value in a relevant `track()` call.
- **ConfigCat flags** (`useFlag` from `common`) are a different system — this pattern does not apply to them.

`usePHFlag` returns `undefined` while the PostHog store is still loading. Read the raw flag via `usePHFlag('flagName')`, **not** through wrapper hooks that coerce `undefined` to `false`, and use a conditional spread so the property is omitted (not `false`) until the flag has resolved:

As always, `track()` runs inside the user-action handler — never in the component body or an effect:

```typescript
const track = useTrack()
const flagValue = usePHFlag<boolean>('myBooleanFlag') // for boolean flags

const handleSubmit = () => {
  track('event_name', {
    ...(flagValue !== undefined && { myFlagEnabled: flagValue }),
  })
}
```

For string-valued flags (e.g. experiment variants), use `usePHFlag<string>('flagName')`; a flag that may be migrated from boolean to multivariate is typed `usePHFlag<boolean | string>`. `ProjectCreationForm.tsx` (`dataApiRevokeOnCreateDefault`) is the canonical example.

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
    featureType: 'basic' | 'advanced'
  }
  groups: TelemetryGroups
}
```

Add the new interface to the `TelemetryEvent` union type so `useTrack` picks it up.
`@group Events` and `@source` are required on every event; add `@page` when the event fires from a specific page. All three must be accurate.

## Review Rules

When reviewing a PR, flag these as **required changes:**

1. **Naming violations** — event not following `[object]_[verb]` snake_case, or using an unapproved verb
2. **Property violations** — not camelCase, generic names, or inconsistent with similar events
3. **Unnecessary view tracking** — events that fire on page load without user interaction
4. **Inaccurate docs** — `@source`/`@page` descriptions that don't match the actual implementation
5. **Unmeasured feature flags** — a PostHog flag gates new behavior but its value is not captured in any `track()` call, or there is no outcome tracking for the gated behavior
6. **User-defined names or identifiers in properties** — schema, table, column, function, bucket, policy, project or branch names, SQL or other free text, or extra IDs sent as property values, or a new property typed as plain `string` that could hold one. Required even when the value looks harmless; ask for a count, enum, boolean or category instead

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
3. **Add interface to telemetry-constants.ts** — with `@group Events` and `@source` JSDoc (plus `@page` when page-specific), add to the `TelemetryEvent` union type
4. **Add to component** — `import { useTrack } from '@/lib/telemetry/track'`, call `track('event_name', { properties })`

### Verification checklist

- [ ] Event name follows `[object]_[verb]` with approved verb
- [ ] Event name is snake_case
- [ ] Properties are camelCase and self-explanatory
- [ ] Event defined in telemetry-constants.ts with accurate `@group Events`, `@source`, and (if page-specific) `@page`
- [ ] Using the `useTrack` hook
- [ ] Not tracking passive views/appearances
- [ ] No PII in event properties (emails, names, IPs, etc.)
- [ ] No user-defined names or identifiers in properties (schema, table, column, function, bucket, policy, project, branch), and no free text or extra IDs
- [ ] New properties are typed as string-literal unions, booleans or numbers, not plain `string`
- [ ] Property names consistent with similar events
