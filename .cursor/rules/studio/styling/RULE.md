---
description: "Studio: styling rules (Tailwind + semantic tokens + typography/focus utilities)"
globs:
  - apps/studio/**/*.{ts,tsx,scss}
alwaysApply: false
---

# Studio styling

- Use Tailwind.
- Do not hardcode Tailwind color tokens; use our semantic classes:
  - backgrounds: `bg`, `bg-muted`, `bg-warning`, `bg-destructive`
  - text: `text-foreground`, `text-foreground-light`, `text-foreground-lighter`, `text-warning`, `text-destructive`
- Use existing typography utilities from `apps/studio/styles/typography.scss` instead of recreating styles.
- Use existing focus utilities from `apps/studio/styles/focus.scss` for consistent keyboard focus styling.

