---
description: "Studio: side panels (Sheet) for context-preserving workflows"
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio sheets

Use a `Sheet` when switching to a new page would be disruptive and the user should keep context (e.g. selecting an item from a list to edit details).

## Structure

- Prefer `SheetContent` with `size="lg"` for forms that need horizontal layout.
- Use `SheetHeader`, `SheetTitle`, `SheetSection`, and `SheetFooter` for consistent structure.
- Place submit/cancel actions in `SheetFooter`.

## Forms in sheets

- Prefer `FormItemLayout`:
  - `layout="horizontal"` for wider sheets
  - `layout="vertical"` for narrow sheets (`size="sm"` or below)
- See `@studio/forms` for the canonical patterns and demos.
