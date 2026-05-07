---
description: "Studio: project structure and where code lives"
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio project structure

- Studio is a Next.js app using the pages router.
- Pages live in `apps/studio/pages`.
  - Project pages: `apps/studio/pages/projects/[ref]`
  - Org pages: `apps/studio/pages/org/[slug]`
- Studio components live in `apps/studio/components`.
  - Studio UI helpers: `apps/studio/components/ui`
  - Interface/page components: `apps/studio/components/interfaces` (e.g. `apps/studio/components/interfaces/Auth`)
- Shared hooks: `apps/studio/hooks`
- Shared helpers: `apps/studio/lib`

