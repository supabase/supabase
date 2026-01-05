---
description: 'Studio: page layout patterns (PageContainer/PageHeader/PageSection) and sizing guidance. Use to learn how to create or update existing pages in Studio.'
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio layout

Use the Design System UI pattern docs as the source of truth:

- Documentation: `apps/design-system/content/docs/ui-patterns/layout.mdx`
- Demos:
  - `apps/design-system/registry/default/example/page-layout-settings.tsx`
  - `apps/design-system/registry/default/example/page-layout-list.tsx`
  - `apps/design-system/registry/default/example/page-layout-list-simple.tsx`
  - `apps/design-system/registry/default/example/page-layout-detail.tsx`

## Guidelines

- Build pages using `PageContainer`, `PageHeader`, and `PageSection` for consistent spacing and max-widths.
- Choose `size` based on content:
  - Settings/config: `size="default"`
  - List/table-heavy: `size="large"`
  - Full-screen experiences: `size="full"`
- For list pages:
  - If filters/search exist, align table actions with filters (avoid `PageHeaderAside`/`PageSectionAside` for those actions).
  - If no filters/search, actions can go in `PageHeaderAside` or `PageSectionAside` depending on context.
