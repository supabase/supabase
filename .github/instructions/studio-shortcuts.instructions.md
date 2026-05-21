---
applyTo: "apps/studio/**"
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

## Preferred Pattern

- Add definitions in `apps/studio/state/shortcuts/registry.ts` or `apps/studio/state/shortcuts/registry/*`.
- Register with `useShortcut`.
- Gate availability with `enabled`.
- Surface visible actions with `ShortcutTooltip` or `ShortcutBadge`.
- Prefer scoped, mnemonic sequential chords over global modifier chords.

Canonical implementation context: `apps/studio/state/shortcuts/registry.ts`, `apps/studio/state/shortcuts/useShortcut.tsx`, and `apps/studio/components/ui/Shortcut*.tsx`
