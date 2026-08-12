---
name: explorer
description: Build and modify Studio Explorer surfaces, including notebooks, chats, SQL snippets, query cells, and their shared toolbar patterns.
---

# Studio Explorer

Use this skill when working in `apps/studio/components/interfaces/Explorer` or building notebook, chat, snippet, or query-cell UI for Explorer.

Explorer UI is Studio-specific. Keep its components under `apps/studio/components/interfaces/Explorer`; do not move them into `ui-patterns` or duplicate them in the design-system app.

## Explorer toolbar

Import the toolbar primitives from:

```tsx
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
```

Compose the toolbar from slots rather than adding resource-specific props:

```tsx
<ExplorerToolbar aria-label="Query toolbar">
  <ExplorerToolbarIcon>{/* decorative resource icon */}</ExplorerToolbarIcon>
  <ExplorerToolbarTitle>{/* static or editable title */}</ExplorerToolbarTitle>
  <ExplorerToolbarActions>
    {/* badges, source controls, display controls, and direct actions */}
    <ExplorerToolbarAction aria-label="Run query" icon={<Play />} />
  </ExplorerToolbarActions>
</ExplorerToolbar>
```

- The row defaults to 40px and follows `--header-height` at the `md` breakpoint.
- Use `ExplorerToolbarAction` for compact direct actions. Icon-only actions are 28px wide automatically.
- Keep execution, persistence, source selection, and other resource state in the consuming Explorer surface.
- Extend layouts with children and `className`; avoid boolean props for resource-specific variants.
