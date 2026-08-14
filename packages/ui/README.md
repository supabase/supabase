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
- Use shadcn semantic pairs (`bg-card text-card-foreground`, `bg-muted text-muted-foreground`,
  `bg-tertiary text-tertiary-foreground`) rather than hardcoded colors. Legacy utilities such as
  `text-foreground-light` and `border-default` are compatibility aliases only.
- Themes set the core `--hue` (or the split `--surface-hue` / `--primary-hue`), `--chroma`,
  `--surface`, `--foreground-lightness`, and `--contrast` inputs, plus their
  `--muted-foreground-level` and `--tertiary-foreground-level` hierarchy.
  Semantic colors are derived from them in OKLCH; `--contrast: 1` is the baseline and the supported
  adjustment range is `0.75` to `1.25`.
- The workspace root owns the actual `tailwind.config.js`. The file in this package is a stub for IntelliSense only.
