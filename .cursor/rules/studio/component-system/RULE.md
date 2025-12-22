---
description: 'Studio: UI component system (packages/ui + shadcn primitives)'
globs:
  - apps/studio/**/*.{ts,tsx}
  - packages/ui/**/*.{ts,tsx}
alwaysApply: false
---

# Studio component system

Our primitive component system lives in `packages/ui` and is based on shadcn/ui patterns.

- Prefer using components exported from `ui` (e.g. `import { Button } from 'ui'`).
- Prefer `_Shadcn_`-suffixed components for form components e.g. `Input_Shadcn_`.
- Avoid introducing new primitives unless explicitly requested.
- Browse available exports in `packages/ui/index.tsx` before composing new UI.
