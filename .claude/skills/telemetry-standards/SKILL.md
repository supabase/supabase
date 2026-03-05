---
name: telemetry-standards
description: PostHog event tracking standards for Supabase Studio. Use when reviewing
  PRs for telemetry compliance or implementing new event tracking. Covers event naming,
  property conventions, approved patterns, and implementation workflow.
---

# Telemetry Standards for Supabase Studio

Standards and workflows for PostHog event tracking in `apps/studio/`. Use this
when reviewing PRs for tracking compliance or implementing new tracking.

## Event Naming

**Format:** `[object]_[verb]` in snake_case

**Approved verbs only:**
opened, clicked, submitted, created, removed, updated, retrieved, intended, evaluated, added

**Flag these mistakes:**
- New unapproved verbs (saved, viewed, seen, pressed, etc.)
- Wrong order: `click_product_card` should be `product_card_clicked`
- Wrong casing: `productCardClicked` or `Product_Card_Clicked` should be `product_card_clicked`

**Good examples:**
- `product_card_clicked`
- `sql_query_executed` — note: `executed` is not in the approved list, prefer `submitted`
- `assistant_suggestion_accepted` — note: `accepted` is not in the approved list, prefer `clicked`
- `backup_button_clicked`

## Property Standards

**Casing:** camelCase always

**Names must be self-explanatory:**
- `{ productType: 'database', planTier: 'pro' }`
- `{ assistantType: 'sql', suggestionType: 'optimization' }`

**Flag these:**
- Generic names: `label`, `value`, `type`, `name`, `data`
- snake_case or PascalCase properties
- Inconsistent names across similar events (e.g., `assistantType` in one event, `aiType` in a related event)

## What NOT to Track

- Passive views/renders on page load (`dashboard_viewed`, `sidebar_appeared`, `page_loaded`)
- Component appearances without user interaction
- Generic "viewed" or "seen" events — these are already captured by pageview events

**DO track:**
- User clicks
- Form submissions
- Explicit opens/closes by user
- User-initiated actions

## Implementation Pattern

**Required hook:** `useTrack` from `lib/telemetry/track`

```typescript
import { useTrack } from 'common/lib/telemetry'

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

**Deprecated — flag any usage:**
```typescript
// NEVER use useSendEventMutation
const { mutate: sendEvent } = useSendEventMutation()
```

## Event Definitions

All events must be defined in `packages/common/telemetry-constants.ts` with accurate JSDoc:

```typescript
/**
 * [Event description]
 * @page [accurate page/location where this fires]
 * @source [what triggers this event]
 */
export const EVENT_NAME = '[object]_[verb]' as const
```

## Review Workflow

Use when reviewing a PR for telemetry compliance.

### Step 1: Fetch PR Details

```bash
gh pr view [PR_NUMBER] --json files,diff,title,body
gh pr diff [PR_NUMBER]
```

Focus on:
- `packages/common/telemetry-constants.ts`
- Any files using `useTrack`, `track()`, or `useSendEventMutation`

### Step 2: Check telemetry-constants.ts

If modified, check every new or changed event for:
- Event name follows `[object]_[verb]` snake_case format
- Verb is from the approved list
- Properties use camelCase and are self-explanatory
- `@page` and `@source` descriptions are accurate
- Property names are consistent with similar existing events

### Step 3: Check Implementation Files

For files using tracking functions:
- No `useSendEventMutation` usage (must use `useTrack`)
- No unnecessary view tracking (passive renders on page load)
- Properties consistent with similar events in telemetry-constants.ts

### Step 4: Check for Missing Tracking

If the PR adds user-facing interactions (buttons, forms, toggles, modals, dialogs) without tracking:
- Flag it as a suggestion: "This adds a user interaction that may benefit from tracking. Consider adding a `useTrack()` call."
- Propose the event name following `[object]_[verb]` convention
- Propose the `useTrack()` call with suggested properties

### Step 5: Present Issues

Format each issue as:

```
**File:** [filename]
**Line:** [approximate line number from diff]
**Issue:** [specific problem]
**Suggestion:** [exact fix needed]
**Severity:** Request Changes (for violations) or Suggestion (for missing tracking)
```

Present all issues and wait for user approval before posting.

### Step 6: Post Comments (After Approval)

```bash
gh pr comment [PR_NUMBER] --body "[formatted comment]"
```

## Implementation Workflow

Use when adding new event tracking.

### Step 1: Design the Event

Given the user action to track:
1. Name: `[object]_[verb]` using approved verbs only
2. Properties: camelCase, self-explanatory names
3. Search `packages/common/telemetry-constants.ts` for similar events and match their property names

Present the design:

```
Event Name: [object]_[verb]
Properties:
  - propertyName: type (description)
@page: [where this fires]
@source: [what triggers it]
Similar Events: [list any related events found]
```

Wait for approval.

### Step 2: Add to telemetry-constants.ts

Add the event definition with JSDoc to `packages/common/telemetry-constants.ts`.

### Step 3: Implement in Component

1. Import: `import { useTrack } from 'common/lib/telemetry'`
2. Initialize: `const track = useTrack()`
3. Call: `track('object_verb', { propertyName: value })`

### Step 4: Verify

- [ ] Event added to telemetry-constants.ts with accurate @page/@source
- [ ] Event name follows [object]_[verb] pattern with approved verb
- [ ] Event name is snake_case
- [ ] Properties are camelCase and self-explanatory
- [ ] Using useTrack hook (not useSendEventMutation)
- [ ] Not tracking passive views/appearances
- [ ] Consistent with similar events
