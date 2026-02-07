---
description: 'Studio: empty state patterns (presentational vs informational vs zero-results vs missing route)'
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio empty states

Use the Design System UI pattern docs as the source of truth:

- Documentation: `apps/design-system/content/docs/ui-patterns/empty-states.mdx`
- Demos:
  - `apps/design-system/registry/default/example/empty-state-presentational-icon.tsx`
  - `apps/design-system/registry/default/example/empty-state-initial-state-informational.tsx`
  - `apps/design-system/registry/default/example/empty-state-zero-items-table.tsx`
  - `apps/design-system/registry/default/example/data-grid-empty-state.tsx`
  - `apps/design-system/registry/default/example/empty-state-missing-route.tsx`

## Quick guidance

- Initial states: use presentational empty states when onboarding/value prop + a clear next action helps.
- Data-heavy lists: prefer informational empty states that match the list/table layout.
- Zero results: keep the UI consistent with the data state to avoid jarring transitions.
- Missing routes: prefer a centered `Admonition` pattern.
