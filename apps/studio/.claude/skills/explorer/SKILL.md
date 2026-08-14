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

## Explorer query shell

Import the layout regions from:

```tsx
import {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryFooter,
  ExplorerQueryResults,
  ExplorerQueryViewport,
} from '@/components/interfaces/Explorer/ExplorerQuery'
```

Use `ExplorerQuery` for a framed query embedded in a notebook, chat, or another surface. Give it an explicit height when the surrounding surface constrains the cell:

```tsx
<ExplorerQuery className="h-96">
  <ExplorerToolbar>{/* title and actions */}</ExplorerToolbar>
  <ExplorerQueryEditor>{/* editable or read-only SQL */}</ExplorerQueryEditor>
  <ExplorerQueryResults>{/* idle, loading, error, or result display */}</ExplorerQueryResults>
  <ExplorerQueryFooter>{/* row count or surface metadata */}</ExplorerQueryFooter>
</ExplorerQuery>
```

Use `ExplorerQueryViewport` when a query owns the content area of an Explorer tab. Its parent must provide a bounded height and `min-h-0`:

```tsx
<div className="min-h-0 flex-1">
  <ExplorerQueryViewport>{/* the same query composition */}</ExplorerQueryViewport>
</div>
```

- `ExplorerQueryResults` is always present and fills the space left by the toolbar, editor, and footer.
- A result renderer that can grow supplies its own `min-h-0 flex-1 overflow-auto` container.
- The shell owns layout only. Query models, source resolution, execution, results, display selection, and saved configuration stay controlled by the consumer.
- Compose approval prompts, confirmation notices, and other surface-specific content as children between the standard regions.
