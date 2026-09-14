---
name: studio-shortcuts
description: Keyboard shortcut conventions for Supabase Studio. Use when adding a
  repeated user action, toolbar action, list/table operation, or sub-page navigation
  that should have shortcut coverage, when registering or changing a shortcut, or when
  adding a search/filter Input (which needs the staged-Escape handler). Covers the
  shortcut registry, useShortcut, ShortcutTooltip/ShortcutBadge, the reference sheet,
  and collision rules.
---

# Studio Keyboard Shortcuts

When Studio UI changes introduce or materially alter repeated user actions, consider whether keyboard shortcut coverage should be added or updated. Shortcuts use the shared Studio shortcut system and must be discoverable from the visible UI.

## Rules

- Never add a one-off `keydown` listener for a normal Studio action — register it through the shortcut registry and `useShortcut`.
- Every registered shortcut is exposed where the action is visible, via `ShortcutTooltip`, `ShortcutBadge`, or a command-menu badge.
- `G then …` chords are reserved for navigation.
- Avoid broad `Mod+letter` shortcuts that overlap common browser, editor, system, copy/save/search, or devtools behavior.
- Before adding a shortcut, check the registry and any remaining non-registry listeners for collisions.
- Every search/filter `<Input>` gets `onKeyDown={onSearchInputEscape(...)}` — see [Search inputs](#search-inputs).

## Preferred pattern

- Add definitions in `apps/studio/state/shortcuts/registry.ts` or `apps/studio/state/shortcuts/registry/*`.
- Register with `useShortcut`.
- Gate availability with `enabled`.
- Surface visible actions with `ShortcutTooltip` or `ShortcutBadge`.
- Prefer scoped, mnemonic sequential chords over global modifier chords.
- Set `showInSettings: false` on contextual shortcuts (scoped to a specific page state, sheet, or panel).
- When a shortcut group should appear in the reference sheet (`Shift+?`), add the group key to `SHORTCUT_REFERENCE_GROUP_ORDER` in `apps/studio/state/shortcuts/referenceGroups.ts` and a human label to `GROUP_LABELS` in `ShortcutsReferenceSheet.tsx`.
- For sheet-scoped shortcuts (active only while a `<Sheet>` is open), mount `useShortcut` inside the sheet component gated by the `open` prop (`{ enabled: open }`) — `apps/studio/components/interfaces/Platform/Webhooks/PlatformWebhooksDeliveryDetailsSheet.tsx` is the canonical example. A shortcut that _opens_ a sheet from anywhere is global instead, gated by whatever makes the action valid (e.g. `useConnectSheetShortcut` checks project health).

## Search inputs

Every `<Input>` used as a search or filter field must include the staged-Escape handler from `apps/studio/lib/keyboard.ts`:

```tsx
import { onSearchInputEscape } from '@/lib/keyboard'

;<Input
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onKeyDown={onSearchInputEscape(query, setQuery)}
/>
```

Behavior:

- **Escape while the input has a value** → clears the value, keeps focus (so a second Escape then blurs)
- **Escape while the input is empty** → blurs the input
- Stops propagation on Escape so the keystroke does not accidentally close a parent dialog or sheet

When pairing with `useShortcut(LIST_PAGE_FOCUS_SEARCH, ...)` to focus a search input via keyboard, always also add `onSearchInputEscape` on the same input — focus and escape-to-blur are always a pair.

## Key files

`apps/studio/state/shortcuts/registry.ts`, `apps/studio/state/shortcuts/useShortcut.tsx`, `apps/studio/components/ui/Shortcut*.tsx`, `apps/studio/lib/keyboard.ts`.

## Tests

E2E tests for a feature with shortcuts cover both click interactions and the keyboard path — see `studio-e2e-tests`.
