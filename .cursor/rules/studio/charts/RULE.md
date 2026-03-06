---
description: "Studio: composable chart patterns built on Recharts and our chart presentational components"
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio charts

Use the Design System UI pattern docs as the source of truth:

- Documentation: `apps/design-system/content/docs/ui-patterns/charts.mdx`
- Demos:
  - `apps/design-system/__registry__/default/block/chart-composed-demo.tsx`
  - `apps/design-system/__registry__/default/block/chart-composed-basic.tsx`
  - `apps/design-system/__registry__/default/block/chart-composed-states.tsx`
  - `apps/design-system/__registry__/default/block/chart-composed-metrics.tsx`
  - `apps/design-system/__registry__/default/block/chart-composed-actions.tsx`
  - `apps/design-system/__registry__/default/block/chart-composed-table.tsx`

## Best practices

- Prefer provided chart building blocks over passing raw Recharts components to `ChartContent`.
- Use `useChart` context flags for consistent loading/disabled handling.
- Keep chart composition straightforward; avoid over-abstraction.

