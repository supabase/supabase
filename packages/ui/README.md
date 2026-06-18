# `packages/ui`

Supabase's shared React component library. Built on [Radix UI](https://www.radix-ui.com/) primitives and [shadcn/ui](https://ui.shadcn.com/), styled with Tailwind CSS, and used across all Supabase apps.

## Usage

Import from the `'ui'` package alias:

```tsx
import { Badge, Button, Input } from 'ui'
```

Some of the components have the `_Shadcn_` suffix. These components should be preferred, they're in a process of replacing the other ones.

### Utilities

```tsx
// deep object merge (used for themes)
import { clipboard, cn, mergeDeep } from 'ui' // clsx + tailwind-merge

// copy-to-clipboard helper
```

## Styling conventions

- Tailwind only — no inline styles or CSS modules.
- Use semantic tokens (`bg-muted`, `text-foreground-light`, `border-default`) rather than hardcoded colors.
- The workspace root owns the actual `tailwind.config.js`. The file in this package is a stub for IntelliSense only.
