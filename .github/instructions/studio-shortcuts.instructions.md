---
applyTo: 'apps/studio/**'
---

# Studio Shortcut Review Rules

All comments are **advisory**.

## Core Principle

When Studio UI changes introduce or materially alter repeated user actions, consider whether keyboard shortcut coverage should be added or updated. Shortcuts should use the shared Studio shortcut system and be discoverable from the visible UI.

## When to Flag

- PR adds a primary repeated action, toolbar action, list/table operation, or sub-page navigation without considering shortcut coverage.
- PR adds a one-off `keydown` listener for a normal Studio action instead of using the shortcut registry and `useShortcut`.
- PR registers a shortcut but does not expose it via `ShortcutTooltip`, `ShortcutBadge`, or command-menu badge where the action is visible.
- PR uses `G then ...` for a non-navigation action.
- PR adds a broad `Mod+letter` shortcut that overlaps common browser, editor, system, copy/save/search, or devtools behaviour.
- PR adds a shortcut without checking existing registry and non-registry listeners for collisions.
- PR adds a search/filter `<Input>` without `onKeyDown={onSearchInputEscape(...)}` — see **Search Inputs** below.

## Preferred Pattern

- Add definitions in `apps/studio/state/shortcuts/registry.ts` or `apps/studio/state/shortcuts/registry/*`.
- Register with `useShortcut`.
- Gate availability with `enabled`.
- Surface visible actions with `ShortcutTooltip` or `ShortcutBadge`.
- Prefer scoped, mnemonic sequential chords over global modifier chords.
- Set `showInSettings: false` on contextual shortcuts (scoped to a specific page state, sheet, or panel).
- When a shortcut group should appear in the reference sheet (`Mod+/`), add the group key to `SHORTCUT_REFERENCE_GROUP_ORDER` in `apps/studio/state/shortcuts/referenceGroups.ts` and a human label to `GROUP_LABELS` in `ShortcutsReferenceSheet.tsx`.
- For sheet-scoped shortcuts (active only while a `<Sheet>` is open), mount `useShortcut` inside the sheet component gated by the `open` prop — see `apps/studio/components/interfaces/ConnectSheet/useConnectSheetShortcut.ts` as the canonical example.

## Search Inputs

Every `<Input>` used as a search or filter field must include the staged-Escape handler from `apps/studio/lib/keyboard.ts`:

```tsx
import { onSearchInputEscape } from '@/lib/keyboard'

;<Input
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onKeyDown={onSearchInputEscape(query, setQuery)}
/>
```

Behaviour:

- **Escape while the input has a value** → clears the value, keeps focus (so a second Escape then blurs)
- **Escape while the input is empty** → blurs the input
- Stops propagation on Escape so the keystroke does not accidentally close a parent dialog or sheet

When pairing with `useShortcut(LIST_PAGE_FOCUS_SEARCH, ...)` to focus a search input via keyboard, always also add `onSearchInputEscape` on the same input — focus and escape-to-blur are always a pair.

Canonical implementation context: `apps/studio/state/shortcuts/registry.ts`, `apps/studio/state/shortcuts/useShortcut.tsx`, and `apps/studio/components/ui/Shortcut*.tsx`
