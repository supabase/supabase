---
description: "Studio: navigation patterns (page-level NavMenu + URL-driven navigation)"
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio navigation

Use the Design System UI pattern docs as the source of truth:

- Documentation: `apps/design-system/content/docs/ui-patterns/navigation.mdx`

## NavMenu

- Use `NavMenu` for a horizontal list of related views within a consistent page layout.
- Activating an item should trigger a URL change (no local-only tab state).
- See: `apps/design-system/content/docs/components/nav-menu.mdx`

