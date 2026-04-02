---
applyTo: "apps/studio/**"
---

# shadcn/Radix UI Component Review Rules

All comments are **advisory**.

## Core Principle

This project uses **shadcn/ui** components built on **Radix UI** primitives (from `packages/ui/`). These components provide comprehensive accessibility out-of-the-box. **Do not flag missing accessibility attributes that are already handled by the underlying Radix primitives.**

## Components with Built-In Accessibility — Do NOT Flag

The following components (imported from `ui`) already handle ARIA roles, keyboard navigation, focus management, and screen reader support automatically via Radix UI primitives:

| Component | What Radix Handles |
|-----------|-------------------|
| `Dialog`, `AlertDialog` | `role="dialog"`, `aria-modal`, focus trapping, ESC to close |
| `DropdownMenu`, `ContextMenu` | `role="menu"` / `role="menuitem"`, arrow key navigation |
| `Select` | `role="combobox"`, `aria-expanded`, keyboard selection |
| `Tabs` | `role="tablist"` / `role="tab"` / `role="tabpanel"`, `aria-selected`, arrow keys |
| `Checkbox` | `role="checkbox"`, `aria-checked`, Space to toggle |
| `RadioGroup` | `role="radio"`, `aria-checked`, arrow key navigation |
| `Switch` | `role="switch"`, `aria-checked`, keyboard toggle |
| `Tooltip` | Trigger/content association, show/hide timing |
| `Accordion`, `Collapsible` | `aria-expanded`, Enter/Space to toggle |
| `Popover`, `HoverCard` | Focus management, dismiss on ESC |
| `Slider` | `role="slider"`, `aria-valuemin/max/now`, arrow keys |
| `Toggle`, `ToggleGroup` | `aria-pressed`, keyboard support |
| `ScrollArea` | Accessible scrollbar replacement |
| `NavigationMenu` | `role="navigation"`, keyboard navigation |

### Specifically, Never Flag These

- Missing `role` on `Dialog`, `AlertDialog`, `DropdownMenu`, `Select`, `Tabs`, `RadioGroup`, or other Radix-based components — roles are set by the primitive
- Missing `aria-modal` on `Dialog` or `AlertDialog` — set automatically
- Missing `aria-expanded` on `Accordion`, `Collapsible`, `Select`, or `DropdownMenu` triggers — managed by Radix state
- Missing `aria-selected` on `Tabs` — managed by `TabsPrimitive`
- Missing `aria-checked` on `Checkbox`, `RadioGroup`, or `Switch` — managed by Radix state
- Missing keyboard event handlers (`onKeyDown`, `onKeyUp`) on interactive Radix components — keyboard support is built-in
- Missing focus management in `Dialog` or `AlertDialog` — focus trapping is automatic
- Missing `aria-label` on `DialogClose` or `AlertDialogCancel` — these render a visible `<span className="sr-only">Close</span>`

## What TO Flag

Only flag accessibility issues for:

1. **Custom interactive elements** not using Radix primitives (e.g., a `<div onClick>` that should be a `<button>`)
2. **Icon-only buttons** missing an accessible label — `<Button>` alone does not add one; use `aria-label` or `<span className="sr-only">`
3. **Missing `Label` association** — form inputs should be paired with `<Label htmlFor="...">` or wrapped in a `<Field>` component
4. **Images missing `alt` text** — not handled by any component library
5. **Color-only state indicators** — state changes should not rely solely on color
