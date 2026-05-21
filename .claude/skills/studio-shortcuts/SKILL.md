---
name: studio-shortcuts
description: Keyboard shortcut coverage and collision guidance for Supabase Studio UI work.
---

# Studio Shortcuts

Use this skill when adding or changing Studio UI in `apps/studio/**`, especially buttons, menus, sheets, list actions, table/grid actions, navigation, and repeated workflows.

## Core Standard

Studio shortcuts must be deliberate, discoverable, and registered through the shared shortcut system.

- Add shortcuts for repeated primary actions, visible toolbar actions, common list/table operations, and page or sub-page navigation.
- Do not add shortcuts for destructive actions unless the UI already has strong confirmation and the shortcut is clearly scoped.
- Do not add shortcuts for rare, low-value, or ambiguous actions just because a button exists.
- Keep click behaviour and shortcut behaviour on the same handler where practical so permissions, telemetry, loading state, and errors stay aligned.

## Implementation Pattern

- Define IDs and definitions in `apps/studio/state/shortcuts/registry.ts` or a scoped file under `apps/studio/state/shortcuts/registry/`.
- Register shortcuts with `useShortcut`.
- Gate shortcuts with `enabled` when an action is unavailable, hidden, or not meaningful in the current state.
- Use `ignoreInputs: true` for action chords that should not type into focused fields.
- Use `conflictBehavior: 'allow'` only when duplicate sequences are intentionally separated by mutually exclusive enabled gates.
- Use `registerInCommandMenu: true` for active in-page actions that should be discoverable from Cmd+K.

## Discovery Pattern

- Wrap visible buttons or rows with `ShortcutTooltip`.
- Use `ShortcutBadge` for dropdown menu items and action lists.
- Keep tooltip labels action-oriented and aligned with the registry label.
- If an action is exposed in the command menu, show the same shortcut badge there.

## Binding Rules

- Keep `G then ...` for navigation only.
- Prefer same-prefix mnemonic families for related actions, such as `F then ...` for one feature area or `O then ...` for opening local UI.
- Prefer scoped sequential chords over broad `Mod+letter` defaults.
- Avoid browser, editor, and system-owned chords, especially copy, save, find/search, close-tab, reload, print, devtools, and address-bar patterns.
- Treat Monaco editor bindings, command-menu open keys, grid navigation, and direct `keydown` handlers as part of the collision surface.

## Before Adding a Shortcut

1. Search `apps/studio/state/shortcuts/registry*`.
2. Search non-registry listeners: command menu provider, Monaco `addAction`/`addCommand`, grid handlers, and direct `keydown` listeners.
3. Check the current UI for tooltip or badge affordances.
4. Confirm the shortcut works only when the action is available.
5. Add focused unit coverage for registry grouping, hook registration, or interaction behaviour as appropriate.

## Testing

- Unit test pure shortcut helpers and registry grouping.
- Test hook registration when availability depends on project state, permissions, selected rows, active sheets, or search state.
- For E2E coverage, include both mouse and keyboard paths when the shortcut covers a core workflow.
