---
description: "Studio: table patterns (Table vs Data Table vs Data Grid) and placement of actions/filters"
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio tables

Use the Design System UI pattern docs as the source of truth:

- Documentation: `apps/design-system/content/docs/ui-patterns/tables.mdx`
- Demos:
  - `apps/design-system/registry/default/example/table-demo.tsx`
  - `apps/design-system/registry/default/example/data-table-demo.tsx`
  - `apps/design-system/registry/default/example/data-grid-demo.tsx`

## Choose the right pattern

- `Table`: simple, static, semantic table display.
- Data Table: TanStack-powered pattern for sorting/filtering/pagination; composed per use case.
- Data Grid: only when you need virtualization, column resizing, or complex cell editing.

## Actions and filters placement

- Actions: above the table, aligned right.
- Search/filters: above the table, aligned left.
- If the table is the primary page content and has no filters/search, actions can live in the page’s primary/secondary actions area.

